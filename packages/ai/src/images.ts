import { AiError, DEFAULT_XAI_MODEL, XAI_BASE_URL } from './client'

/**
 * Image making and checking (design D4, 7c). Both sit behind interfaces so a provider can change
 * by configuration. The real xAI implementations below are only reached when the builder's image
 * flag is on (AI_IMAGE_GENERATION_ENABLED), which stays off until Clarence confirms xAI's
 * commercial terms and sets the image spend cap. Tests use the test-mode providers in the builder.
 *
 * Like the chat client, these take the API key as an argument and never log prompts, headers,
 * images or the key.
 */
export type ImageAspect = '16:9' | '4:5' | '3:2' | '1:1'
export type ImageRequest = { prompt: string; aspect: ImageAspect; size: '1k' | '2k' }
export type GeneratedImage = { bytes: Buffer; mime: 'image/png' | 'image/jpeg' | 'image/webp'; model: string; provider: string }

export interface ImageProvider {
  readonly provider: string
  readonly model: string
  /** Worst-case price of one image of this size, in USD (for the image spend cap). */
  priceUsd(size: ImageRequest['size']): number
  generate(r: ImageRequest): Promise<GeneratedImage>
}

/** What the automatic image check looks for (7c). Any flag fails the image. */
export const VISION_FLAGS = ['text', 'face', 'logo', 'warped', 'extra_fingers', 'off_brief'] as const
export type VisionFlag = (typeof VISION_FLAGS)[number]
export type VisionResult = { score: number; flags: VisionFlag[]; note?: string }

export interface VisionChecker {
  readonly model: string
  /** Worst-case price of one check, in USD (counted against the image spend cap). */
  priceUsd(): number
  check(i: { bytes: Buffer; mime: string; brief: string }): Promise<VisionResult>
}

export const XAI_IMAGE_MODEL = 'grok-imagine-image-2.0'
/** Listed prices (docs.x.ai, read 2026-11-26): $0.04 per 1K image, up to $0.08 per 2K image. */
const XAI_IMAGE_PRICE = { '1k': 0.04, '2k': 0.08 } as const

export function xaiImageProvider(o: { apiKey: string; model?: string; fetchImpl?: typeof fetch; timeoutMs?: number }): ImageProvider {
  const model = o.model || XAI_IMAGE_MODEL
  return {
    provider: 'xai', model,
    priceUsd: (size) => XAI_IMAGE_PRICE[size],
    async generate(r) {
      if (!o.apiKey) throw new AiError('http', 'Images are not configured')
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 60_000)
      try {
        // Check xAI's current image API parameters before turning the flag on.
        const res = await (o.fetchImpl ?? fetch)(`${XAI_BASE_URL}/images/generations`, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'content-type': 'application/json', authorization: `Bearer ${o.apiKey}` },
          body: JSON.stringify({ model, prompt: r.prompt, n: 1, response_format: 'b64_json', aspect_ratio: r.aspect, resolution: r.size }),
        })
        if (!res.ok) throw new AiError('http', `Image request failed (${res.status})`, res.status)
        const body = (await res.json()) as { data?: { b64_json?: string; mime_type?: string }[] }
        const b64 = body.data?.[0]?.b64_json
        if (!b64) throw new AiError('bad_response', 'Image reply had no image')
        const mime = body.data?.[0]?.mime_type === 'image/png' ? 'image/png' : body.data?.[0]?.mime_type === 'image/webp' ? 'image/webp' : 'image/jpeg'
        return { bytes: Buffer.from(b64, 'base64'), mime, model, provider: 'xai' }
      } catch (e) {
        if ((e as { name?: string }).name === 'AbortError') throw new AiError('timeout', 'Image request timed out')
        throw e
      } finally { clearTimeout(timer) }
    },
  }
}

const VISION_PROMPT = `You check one generated photo for a small business website against its brief.
Reply with JSON only: {"score": number 0-1 (how well it matches the brief and looks like a real, well-made photo), "flags": string[]}.
Flags (include every one that applies): "text" (any letters, words, numbers or signage, even garbled), "face" (any recognizable human face), "logo" (any logo or brand mark), "warped" (melted, bent or impossible objects), "extra_fingers" (wrong number of fingers or broken hands), "off_brief" (not what the brief describes).`

export function xaiVisionChecker(o: { apiKey: string; model?: string; fetchImpl?: typeof fetch; timeoutMs?: number; priceUsd?: number }): VisionChecker {
  const model = o.model || DEFAULT_XAI_MODEL
  return {
    model,
    priceUsd: () => o.priceUsd ?? 0.01,
    async check(i) {
      if (!o.apiKey) throw new AiError('http', 'Images are not configured')
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 30_000)
      try {
        const res = await (o.fetchImpl ?? fetch)(`${XAI_BASE_URL}/chat/completions`, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'content-type': 'application/json', authorization: `Bearer ${o.apiKey}` },
          body: JSON.stringify({
            model, temperature: 0, max_tokens: 200,
            messages: [
              { role: 'system', content: VISION_PROMPT },
              { role: 'user', content: [
                { type: 'text', text: `Brief: ${i.brief.slice(0, 600)}` },
                { type: 'image_url', image_url: { url: `data:${i.mime};base64,${i.bytes.toString('base64')}` } },
              ] },
            ],
          }),
        })
        if (!res.ok) throw new AiError('http', `Image check failed (${res.status})`, res.status)
        const body = (await res.json()) as { choices?: { message?: { content?: string | null } }[] }
        return parseVisionReply(body.choices?.[0]?.message?.content ?? '')
      } catch (e) {
        if ((e as { name?: string }).name === 'AbortError') throw new AiError('timeout', 'Image check timed out')
        throw e
      } finally { clearTimeout(timer) }
    },
  }
}

/** Read the checker's JSON reply; anything unreadable fails the image (fails closed). */
export function parseVisionReply(text: string): VisionResult {
  const json = text.match(/\{[\s\S]*\}/)?.[0]
  if (!json) return { score: 0, flags: ['off_brief'], note: 'unreadable check' }
  try {
    const v = JSON.parse(json) as { score?: unknown; flags?: unknown }
    const score = typeof v.score === 'number' && Number.isFinite(v.score) ? Math.max(0, Math.min(1, v.score)) : 0
    const flags = Array.isArray(v.flags) ? v.flags.filter((f): f is VisionFlag => (VISION_FLAGS as readonly string[]).includes(f as string)) : []
    return { score, flags }
  } catch {
    return { score: 0, flags: ['off_brief'], note: 'unreadable check' }
  }
}
