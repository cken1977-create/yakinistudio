import { describe, expect, it, vi } from 'vitest'
import { AiError, DEFAULT_XAI_MODEL, chat, parseToolCalls } from './client'
import { BANNED_TERMS, lintCopy, strayPrices } from './copy-lint'
import { checkSpend, spendConfigFromEnv } from './spend'

describe('copy lint (8.8)', () => {
  it('flags every banned term, case-insensitive', () => {
    for (const t of BANNED_TERMS) expect(lintCopy(`Hello ${t.toUpperCase()} world`).map((h) => h.term)).toContain(t)
  })
  it('catches the AI-built family in variants', () => {
    expect(lintCopy('This site was AI built for you').length).toBeGreaterThan(0)
    expect(lintCopy('Made with AI in minutes').length).toBeGreaterThan(0)
  })
  it('passes normal small-business copy', () => {
    expect(lintCopy('Your site draft is ready. Yakini set this up for Mesa Street Tacos.')).toEqual([])
    expect(lintCopy('We serve fresh tacos with reactive service')).toEqual([])
  })
  it('allows only the public pricing line', () => {
    expect(strayPrices('Setup from $299. Monthly plans from $149.')).toEqual([])
    expect(strayPrices('Only $99 today')).toEqual(['$99'])
  })
})

describe('global AI spend cap', () => {
  const cfg = spendConfigFromEnv({ AI_DAILY_TOKEN_CAP: '1000', AI_GLOBAL_DAILY_USD_CAP: '1', AI_PRICE_INPUT_PER_M_USD: '1000', AI_PRICE_OUTPUT_PER_M_USD: '1000' })
  it('allows a call under both caps', () => {
    expect(checkSpend({ inputTokens: 100, outputTokens: 100 }, { inputTokens: 100, outputTokens: 100 }, cfg)).toEqual({ allowed: true })
  })
  it('blocks on the token cap', () => {
    expect(checkSpend({ inputTokens: 900, outputTokens: 0 }, { inputTokens: 200, outputTokens: 0 }, cfg)).toEqual({ allowed: false, reason: 'token_cap' })
  })
  it('blocks on the USD cap', () => {
    const roomy = { ...cfg, dailyTokenCap: 1_000_000 }
    expect(checkSpend({ inputTokens: 600, outputTokens: 300 }, { inputTokens: 100, outputTokens: 100 }, roomy)).toEqual({ allowed: false, reason: 'usd_cap' })
  })
  it('fails closed on bad usage numbers and uses safe defaults', () => {
    expect(checkSpend({ inputTokens: NaN, outputTokens: 0 }, { inputTokens: 1, outputTokens: 1 }, cfg).allowed).toBe(false)
    const d = spendConfigFromEnv({})
    expect(d.dailyTokenCap).toBeGreaterThan(0)
    expect(d.dailyUsdCap).toBeGreaterThan(0)
  })
})

describe('xAI client', () => {
  it('parses tool calls with JSON arguments and rejects bad ones', () => {
    expect(parseToolCalls([{ id: 'a', function: { name: 'submit_site', arguments: '{"x":1}' } }])).toEqual([{ id: 'a', name: 'submit_site', arguments: { x: 1 } }])
    expect(() => parseToolCalls([{ id: 'a', function: { name: 'x', arguments: '{nope' } }])).toThrow(AiError)
  })
  it('sends the default model and returns usage, without needing a real key', async () => {
    const fetchImpl = vi.fn(async (_u: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body))
      expect(body.model).toBe(DEFAULT_XAI_MODEL)
      return new Response(JSON.stringify({ model: body.model, choices: [{ message: { content: 'hi' } }], usage: { prompt_tokens: 3, completion_tokens: 1 } }), { status: 200 })
    })
    const r = await chat({ apiKey: 'test-placeholder', messages: [{ role: 'user', content: 'hi' }], fetchImpl: fetchImpl as unknown as typeof fetch })
    expect(r.content).toBe('hi')
    expect(r.usage).toEqual({ inputTokens: 3, outputTokens: 1 })
  })
  it('refuses to run without a key and surfaces HTTP errors without the body', async () => {
    await expect(chat({ apiKey: '', messages: [] })).rejects.toThrow(/not configured/)
    const fetchImpl = (async () => new Response('secret-ish body', { status: 500 })) as unknown as typeof fetch
    await expect(chat({ apiKey: 'k', messages: [], fetchImpl })).rejects.toThrow('AI request failed (500)')
  })
})
