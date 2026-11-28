import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import sharp from 'sharp'
import { drawPhoto } from './test-images'
import type { ChatResult } from '@yakini/ai'
import type { SafeFetchDeps } from '@yakini/brand/safe-fetch'
import type { GenerateChat } from './generate'

/**
 * Fakes for unit tests and the CI end-to-end run (spec 16.6: "mock AI in CI"). Never used on
 * Vercel (see runtime.ts). Sites come from packages/ai/evals/sites: `https://<slug>.example/`
 * serves `<slug>.html`; robots.txt answers 404; anything else is unreachable.
 */
const SITES_DIR = join(process.cwd(), '..', '..', 'packages', 'ai', 'evals', 'sites')

export function mockFetchDeps(dir = SITES_DIR): SafeFetchDeps {
  return {
    resolve: async (host) => {
      if (!/^[a-z0-9-]+\.example$/.test(host)) throw new Error('nxdomain')
      return [{ address: '93.184.216.34', family: 4 }]
    },
    transport: async (url) => {
      const slug = url.hostname.replace(/\.example$/, '')
      let body: Buffer
      let status = 200
      let type = 'text/html; charset=utf-8'
      const photo = /^\/photos\/([a-z0-9-]{1,40})\.png$/.exec(url.pathname)
      if (url.pathname === '/robots.txt') { status = 404; body = Buffer.from('not found'); type = 'text/plain' }
      else if (photo) { body = await testPhoto(`${slug}/${photo[1]}`); type = 'image/png' }
      else {
        try { body = readFileSync(join(dir, `${slug}.html`)) } catch { status = 404; body = Buffer.from('not found') }
      }
      return { status, headers: { 'content-type': type }, body: Readable.from([body]) }
    },
  }
}

/**
 * Deterministic stand-in photos for test-mode sites (photo-like, so they pass the D4 quality filter).
 * Names pick a kind for the imported-photo tests: wide-* (1600 px, hero material), small-* (too
 * narrow for a hero), blurry-*, screenshot-*; anything else is a 1200x800 photo.
 */
async function testPhoto(key: string): Promise<Buffer> {
  const name = key.slice(key.indexOf('/') + 1)
  if (name.startsWith('screenshot-')) {
    const lines = Array.from({ length: 30 }, (_, i) => `<rect x="60" y="${120 + i * 22}" width="${300 + ((i * 137) % 800)}" height="9" fill="#222"/>`).join('')
    return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900"><rect width="100%" height="100%" fill="#fff"/><rect width="100%" height="64" fill="#1d4ed8"/>${lines}</svg>`)).png().toBuffer()
  }
  if (name.startsWith('blurry-')) return sharp(await drawPhoto(key, 1600, 1000)).blur(18).png().toBuffer()
  if (name.startsWith('small-')) return sharp(await drawPhoto(key, 700, 460)).png().toBuffer()
  if (name.startsWith('wide-')) return sharp(await drawPhoto(key, 1600, 1000)).png().toBuffer()
  return sharp(await drawPhoto(key, 1200, 800)).png().toBuffer()
}

function between(text: string, start: string, end: string): string {
  const i = text.indexOf(start)
  if (i < 0) return ''
  const j = text.indexOf(end, i + start.length)
  return text.slice(i + start.length, j < 0 ? undefined : j)
}

/**
 * A stand-in model: returns the kit template it was given, with the subhead and menu filled from
 * the site text. Deterministic, so tests and screenshots are stable.
 */
export const mockGenerateChat: GenerateChat = async (opts) => {
  if (opts.tools?.[0]?.function.name === 'choose_kit') {
    const text = (opts.messages.find((m) => m.role === 'user')?.content ?? '').toLowerCase()
    const kitId = /truck|trailer|cart/.test(text) ? 'food-truck'
      : /restaurant|bistro|kitchen|grill|food|seafood|bbq|cafe|bar\b/.test(text) ? 'restaurant' : 'service'
    return { content: null, toolCalls: [{ id: 'mock-k', name: 'choose_kit', arguments: { kitId } }], usage: { inputTokens: 50, outputTokens: 5 }, model: 'mock', latencyMs: 1 }
  }
  const user = opts.messages.find((m) => m.role === 'user')?.content ?? ''
  const templateJson = between(user, 'KIT_TEMPLATE: ', '\nBUSINESS_FACTS')
  const site = between(user, '>\n', '\n</UNTRUSTED_SITE_CONTENT>')
  const content = JSON.parse(templateJson) as {
    pages: { id: string; sections: { type: string; props: Record<string, unknown> }[] }[]
  }
  const lines = site.split('\n').map((l) => l.trim()).filter(Boolean)
  const sentence = lines.find((l) => !l.startsWith('#') && !l.includes(':') && !l.startsWith('-') && l.length > 30)
  const items = lines.filter((l) => l.startsWith('- ') && /\$\d/.test(l)).slice(0, 8).map((l) => {
    const m = /^- (.+?)\s+(\$\d+(?:\.\d{2})?)\s*(.*)$/.exec(l)
    return m ? { name: m[1].slice(0, 80), price: m[2], ...(m[3] ? { description: m[3].slice(0, 240) } : {}) } : null
  }).filter(Boolean)
  let images: { assetId: string; description: string }[] = []
  try { images = JSON.parse(between(user, 'AVAILABLE_IMAGES: ', '\nReturn the complete site')) } catch { /* none */ }
  const refs = images.map((i) => ({ assetId: i.assetId, alt: i.description.slice(0, 160) || 'Photo' }))
  for (const p of content.pages) for (const s of p.sections as { type: string; hidden?: boolean; props: Record<string, unknown> }[]) {
    if (s.type === 'hero' && p.id === 'home' && refs[0]) s.props.image = refs[0]
    if (s.type === 'gallery' && refs.length) { s.props.images = refs; s.hidden = false }
    if (s.type === 'hero' && p.id === 'home' && sentence) s.props.subhead = sentence.slice(0, 200)
    if (s.type === 'menu' && items.length) s.props.categories = [{ name: 'Favorites', items }]
  }
  const result: ChatResult = {
    content: null,
    toolCalls: [{ id: 'mock-1', name: 'submit_site', arguments: content }],
    usage: { inputTokens: Math.ceil(user.length / 4), outputTokens: Math.ceil(templateJson.length / 4) },
    model: 'mock',
    latencyMs: 1,
  }
  return result
}

/**
 * Stand-in for chat edits: answers each of the 20 scripted eval requests (packages/ai/evals)
 * the way a correct model would, and anything else with a polite reply. Proves the pipeline in
 * tests and browser runs; the real model is measured by `npm run eval -w builder`.
 */
export const mockEditChat: GenerateChat = async (opts) => {
  const { EDIT_CASES } = await import('@yakini/ai/evals/edit-cases')
  const user = [...opts.messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  const request = /OWNER_REQUEST: (.*)$/m.exec(user)?.[1]?.trim() ?? ''
  const site = JSON.parse(between(user, '<CURRENT_SITE>\n', '\n</CURRENT_SITE>') || '{}')
  const c = EDIT_CASES.find((x) => x.request.toLowerCase() === request.toLowerCase())
  const calls = c ? c.script(site) : [{ name: 'reply', arguments: { message: 'I can help with that. Try clicking the text you want to change.' } }]
  return { content: null, toolCalls: calls.map((call, i) => ({ id: `mock-e${i}`, ...call })), usage: { inputTokens: 400, outputTokens: 60 }, model: 'mock', latencyMs: 1 }
}

/** One stand-in for every model call in test mode, routed by the tools offered. */
/**
 * Stand-in Destiny for the Help tab: short answers keyed on the question, in the real prompt's
 * style. A question containing "leak-test" answers with a stack name, so tests can check the
 * route's safety net replaces it.
 */
export const mockHelperChat: GenerateChat = async (opts) => {
  const q = String(opts.messages[opts.messages.length - 1]?.content ?? '').toLowerCase()
  const say = (content: string) => ({ content, toolCalls: [], usage: { inputTokens: 300, outputTokens: 40 }, model: 'test-helper', latencyMs: 5 })
  if (q.includes('leak-test')) return say('This runs on Vercel and Supabase.')
  if (/photo|picture|image/.test(q)) return say('Tap the section with the photo, then Change photo in its fields. Pick one of yours, a kit photo, or upload one, and describe it in a few words. Tutorial step 3: Change a photo.')
  if (/hide|move|section/.test(q)) return say('Tap the section, then use the arrows to move it or Hide to take it off the page for now. Tutorial step 4: Move or hide a section.')
  if (/publish|live|domain/.test(q)) return say('Publishing opens soon. Your draft is saved and private until then. Tutorial step 7: Publish.')
  if (/change .* (headline|words)|my headline/.test(q)) return say('I’ll put that in the Chat tab for you.')
  return say('Tap any part of the page to change it; it saves on its own. Tutorial step 2: Change any words.')
}

export const mockChat: GenerateChat = (opts) =>
  opts.tools?.some((t) => t.function.name === 'update_field') ? mockEditChat(opts)
    : opts.tools?.length ? mockGenerateChat(opts)
    : mockHelperChat(opts)
