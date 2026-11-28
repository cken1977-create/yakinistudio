import { describe, expect, it } from 'vitest'
import { checkImageSpend, imageSpendConfigFromEnv, spendConfigFromEnv, textUsdCap } from './spend'
import { parseVisionReply, xaiImageProvider, xaiVisionChecker, XAI_IMAGE_MODEL } from './images'

describe('image spend cap (D4: its own dollar cap inside the overall AI cap, fails closed)', () => {
  it('is off unless the flag is on and a cap above 0 is set', () => {
    expect(checkImageSpend(0, 0.08, imageSpendConfigFromEnv({}))).toEqual({ allowed: false, reason: 'off' })
    expect(checkImageSpend(0, 0.08, imageSpendConfigFromEnv({ AI_IMAGE_GENERATION_ENABLED: '1' }))).toEqual({ allowed: false, reason: 'no_cap' })
    expect(checkImageSpend(0, 0.08, imageSpendConfigFromEnv({ AI_IMAGE_GENERATION_ENABLED: '1', AI_IMAGE_DAILY_USD_CAP: '0' }))).toEqual({ allowed: false, reason: 'no_cap' })
    expect(checkImageSpend(0, 0.08, imageSpendConfigFromEnv({ AI_IMAGE_GENERATION_ENABLED: 'true', AI_IMAGE_DAILY_USD_CAP: '5' }))).toEqual({ allowed: false, reason: 'off' })
  })

  it('stops at the image cap, counting the call about to run', () => {
    const c = imageSpendConfigFromEnv({ AI_IMAGE_GENERATION_ENABLED: '1', AI_IMAGE_DAILY_USD_CAP: '2', AI_GLOBAL_DAILY_USD_CAP: '10' })
    expect(checkImageSpend(1.9, 0.08, c)).toEqual({ allowed: true })
    expect(checkImageSpend(1.95, 0.08, c)).toEqual({ allowed: false, reason: 'image_cap' })
    expect(checkImageSpend(Number.NaN, 0.08, c)).toEqual({ allowed: false, reason: 'bad_usage' })
    expect(checkImageSpend(-1, 0.08, c)).toEqual({ allowed: false, reason: 'bad_usage' })
  })

  it('sits inside the overall cap: never above it, and its share is taken out of the text budget', () => {
    const env = { AI_IMAGE_GENERATION_ENABLED: '1', AI_IMAGE_DAILY_USD_CAP: '3', AI_GLOBAL_DAILY_USD_CAP: '10' }
    expect(textUsdCap(env)).toBe(7)
    expect(spendConfigFromEnv(env).dailyUsdCap).toBe(7)
    // Images on but no amount set: text keeps the whole cap.
    expect(textUsdCap({ AI_IMAGE_GENERATION_ENABLED: '1', AI_GLOBAL_DAILY_USD_CAP: '10' })).toBe(10)
    // Images off: text keeps the whole cap, whatever the image amount says.
    expect(textUsdCap({ AI_IMAGE_DAILY_USD_CAP: '3', AI_GLOBAL_DAILY_USD_CAP: '10' })).toBe(10)
    // An image cap above the overall cap is clipped to it.
    expect(imageSpendConfigFromEnv({ AI_IMAGE_GENERATION_ENABLED: '1', AI_IMAGE_DAILY_USD_CAP: '50', AI_GLOBAL_DAILY_USD_CAP: '10' }).imageDailyUsdCap).toBe(10)
  })
})

describe('vision check reply', () => {
  it('reads score and known flags; anything unreadable fails the image', () => {
    expect(parseVisionReply('{"score":0.9,"flags":[]}')).toEqual({ score: 0.9, flags: [] })
    expect(parseVisionReply('Here: {"score": 1.4, "flags": ["face","nonsense","text"]}')).toEqual({ score: 1, flags: ['face', 'text'] })
    expect(parseVisionReply('no json')).toMatchObject({ score: 0, flags: ['off_brief'] })
    expect(parseVisionReply('{"score": "high"}')).toEqual({ score: 0, flags: [] })
  })
})

describe('xAI image providers (only used when the flag is on)', () => {
  it('asks for one base64 image and returns the bytes; never sends without a key', async () => {
    let sent: { url: string; body: Record<string, unknown>; auth: string } | null = null
    const fetchImpl = (async (url: string, init: RequestInit) => {
      sent = { url, body: JSON.parse(String(init.body)), auth: (init.headers as Record<string, string>).authorization }
      return new Response(JSON.stringify({ data: [{ b64_json: Buffer.from('img').toString('base64'), mime_type: 'image/png' }] }), { status: 200 })
    }) as unknown as typeof fetch
    const p = xaiImageProvider({ apiKey: 'k', fetchImpl })
    const out = await p.generate({ prompt: 'tacos', aspect: '16:9', size: '2k' })
    expect(out).toMatchObject({ mime: 'image/png', model: XAI_IMAGE_MODEL, provider: 'xai' })
    expect(out.bytes.toString()).toBe('img')
    expect(sent!.url).toBe('https://api.x.ai/v1/images/generations')
    expect(sent!.body).toMatchObject({ model: XAI_IMAGE_MODEL, prompt: 'tacos', n: 1, response_format: 'b64_json' })
    expect(sent!.auth).toBe('Bearer k')
    expect(p.priceUsd('2k')).toBe(0.08)
    await expect(xaiImageProvider({ apiKey: '', fetchImpl }).generate({ prompt: 'x', aspect: '1:1', size: '1k' })).rejects.toThrow()
  })

  it('vision check sends the image and the brief, and parses the verdict', async () => {
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { messages: { content: unknown }[] }
      const parts = body.messages[1].content as { type: string; image_url?: { url: string } }[]
      expect(parts[1].image_url!.url.startsWith('data:image/webp;base64,')).toBe(true)
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"score":0.8,"flags":["logo"]}' } }] }), { status: 200 })
    }) as unknown as typeof fetch
    const v = await xaiVisionChecker({ apiKey: 'k', fetchImpl }).check({ bytes: Buffer.from('x'), mime: 'image/webp', brief: 'tacos' })
    expect(v).toEqual({ score: 0.8, flags: ['logo'] })
  })
})
