import { SYSTEM_PROMPT, PUBLIC_FACTS } from './knowledge'
import type { ChatTurn } from './guard'

const DEFAULT_MODEL = 'grok-4.20-0309-non-reasoning'
const CHAT_URL = 'https://api.x.ai/v1/chat/completions'

export function xaiKey(): string {
  return (process.env.XAI_API_KEY || '').trim()
}

export function hasXaiKey(): boolean {
  return xaiKey().length > 0
}

export type ChatChunk = { type: 'token'; text: string } | { type: 'done'; text: string }

function modelName() {
  return (process.env.XAI_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL
}

export async function completeChat(turns: ChatTurn[], timeoutMs = 8000): Promise<string | null> {
  if (!hasXaiKey()) return null
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${xaiKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName(),
        temperature: 0.35,
        max_tokens: 280,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nPublic facts:\n${PUBLIC_FACTS}` },
          ...turns,
        ],
      }),
      signal: ac.signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const text = data.choices?.[0]?.message?.content?.trim()
    return text || null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/** Stream tokens as soon as they arrive so the UI can start under a second when the model is warm. */
export async function* streamChat(turns: ChatTurn[], timeoutMs = 8000): AsyncGenerator<ChatChunk> {
  if (!hasXaiKey()) return
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${xaiKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName(),
        temperature: 0.35,
        max_tokens: 280,
        stream: true,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nPublic facts:\n${PUBLIC_FACTS}` },
          ...turns,
        ],
      }),
      signal: ac.signal,
    })
    if (!res.ok || !res.body) return
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') {
          if (full) yield { type: 'done', text: full }
          return
        }
        try {
          const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] }
          const piece = json.choices?.[0]?.delta?.content || ''
          if (piece) {
            full += piece
            yield { type: 'token', text: piece }
          }
        } catch {
          /* ignore keepalives */
        }
      }
    }
    if (full) yield { type: 'done', text: full }
  } catch {
    return
  } finally {
    clearTimeout(t)
  }
}

export type DemoInsight = {
  intro?: string
  suggestedKit?: string
  suggestedSize?: 'small' | 'growing' | 'larger'
  name?: string
  colors?: { primary?: string; secondary?: string; accent?: string }
}

const HEX = /^#([0-9A-Fa-f]{6})$/

export async function completeInsights(input: {
  name: string
  industry?: string
  excerpt: string
  fetched: boolean
}): Promise<DemoInsight | null> {
  if (!hasXaiKey()) return null
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), 4500)
  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${xaiKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName(),
        temperature: 0.2,
        max_tokens: 220,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You write a short, warm intro (max 45 words) about a small business from public website text, suggest a Yakini kit id and a size (small, growing, or larger), and may suggest a cleaned business name or three hex colors only if the provided name/colors look weak. Kit ids: food-truck, restaurant, landlord, real-estate, tree-lawn, nonprofit, training, trucking, oilfield, specialized, cannabis, home-healthcare, reentry. Do not invent prices or promise work. Return JSON: {intro, suggestedKit, suggestedSize, name, colors:{primary,secondary,accent}}. Omit fields you are not confident about. Never name software vendors.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              name: input.name,
              industry: input.industry || '',
              fetched: input.fetched,
              excerpt: input.excerpt.slice(0, 1600),
            }),
          },
        ],
      }),
      signal: ac.signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const raw = data.choices?.[0]?.message?.content
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoInsight
    const out: DemoInsight = {}
    if (typeof parsed.intro === 'string' && parsed.intro.trim()) out.intro = parsed.intro.trim().slice(0, 280)
    if (typeof parsed.suggestedKit === 'string') out.suggestedKit = parsed.suggestedKit
    if (parsed.suggestedSize === 'small' || parsed.suggestedSize === 'growing' || parsed.suggestedSize === 'larger') {
      out.suggestedSize = parsed.suggestedSize
    }
    if (typeof parsed.name === 'string' && parsed.name.trim().length >= 2) out.name = parsed.name.trim().slice(0, 80)
    if (parsed.colors && typeof parsed.colors === 'object') {
      const colors: NonNullable<DemoInsight['colors']> = {}
      for (const key of ['primary', 'secondary', 'accent'] as const) {
        const val = parsed.colors[key]
        if (typeof val === 'string' && HEX.test(val)) colors[key] = val.toUpperCase()
      }
      if (colors.primary) out.colors = colors
    }
    return out
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}
