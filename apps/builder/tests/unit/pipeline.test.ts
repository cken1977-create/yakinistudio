import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import sharp from 'sharp'
import { beforeAll, describe, expect, it } from 'vitest'
import { lintCopy, type ChatResult } from '@yakini/ai'
import type { SafeFetchDeps } from '@yakini/brand/safe-fetch'
import { extractBrand } from '@yakini/brand'
import { BUILDER_KITS } from '@yakini/kits'
import { loadSiteDoc, type SiteDoc } from '@yakini/site-schema'
import { createDraft, type DraftRequest } from '@/lib/pipeline/draft'
import { generateContent, type GenerateChat } from '@/lib/pipeline/generate'
import { encodeLogo, encodePhoto, sniffImage } from '@/lib/pipeline/images'
import { sanitizeContent } from '@/lib/pipeline/sanitize'
import { mockFetchDeps, mockGenerateChat } from '@/lib/pipeline/test-mode'
import { draftTokenMatches, hashDraftToken } from '@/lib/server/draft-token'
import type { Runtime } from '@/lib/server/runtime'
import { createMemoryStore } from '@/lib/server/store'

const SITES = join(__dirname, '..', '..', '..', '..', 'packages', 'ai', 'evals', 'sites')
const MANIFEST = JSON.parse(readFileSync(join(SITES, 'manifest.json'), 'utf8')) as { slug: string; name: string; kitId: 'food-truck' | 'restaurant'; colors: Record<string, string> }[]
const PEPPER = 'unit-test-pepper-0123456789'

function runtime(over: Partial<Runtime> = {}) {
  const store = createMemoryStore()
  const rt: Runtime = { testMode: true, store, fetchDeps: mockFetchDeps(SITES), chat: mockGenerateChat, draftPepper: PEPPER, ipPepper: PEPPER, demoOrigin: 'https://yakini.digital', ...over }
  return { rt, store }
}
async function draftDoc(rt: Runtime, store: ReturnType<typeof createMemoryStore>, req: DraftRequest) {
  const r = await createDraft(req, rt)
  if (r.kind !== 'created') throw new Error('expected a draft')
  const stored = await store.getDraft(r.siteId)
  return { r, doc: loadSiteDoc(stored!.doc).doc, stored: stored! }
}
const textOf = (doc: SiteDoc) => JSON.stringify(doc)

describe('demo hand-off: 10 sample businesses (acceptance 1 and 7)', () => {
  it.each(MANIFEST.map((m) => [m.slug, m] as const))('%s → a 5-page draft with the exact colors and no banned words', async (_slug, m) => {
    const { rt, store } = runtime()
    const { r, doc, stored } = await draftDoc(rt, store, { source: 'demo', businessName: '', sourceUrl: `https://${m.slug}.example/`, kitId: m.kitId, features: [] })
    expect(r.outcome).toBe('ai')
    expect(r.siteRead).toBe(true)
    expect(doc.business.name).toBe(m.name)
    expect(doc.pages).toHaveLength(5)
    // Exactly what the brand reader found on the page, byte for byte (near-black neutrals are skipped by the reader).
    const html = readFileSync(join(SITES, `${m.slug}.html`), 'utf8')
    expect(doc.brand.colors).toEqual(extractBrand(html, new URL(`https://${m.slug}.example/`)).colors)
    expect(doc.brand.colors.primary).toBe(m.colors.primary)
    expect(doc.brand.colorsSource).toBe('extracted')
    expect(lintCopy(textOf(doc).replace(m.name, ''))).toEqual([])
    // Only a hash of the access token is stored, and it matches the token handed to the browser.
    expect(stored.tokenHash).toBe(hashDraftToken(r.token, PEPPER))
    expect(textOf(stored.doc as SiteDoc)).not.toContain(r.token)
    expect(draftTokenMatches(r.token, stored.tokenHash, PEPPER)).toBe(true)
    const tampered = `${r.token.slice(0, -1)}${r.token.endsWith('A') ? 'B' : 'A'}`
    expect(draftTokenMatches(tampered, stored.tokenHash, PEPPER)).toBe(false)
  })
})

describe('fallbacks never show an error page (acceptance 2)', () => {
  it('an unreadable URL gives a kit-default draft with the given name', async () => {
    const { rt, store } = runtime()
    const { r, doc } = await draftDoc(rt, store, { source: 'demo', businessName: 'Rosa’s Tamales', sourceUrl: 'https://does-not-exist.example/', kitId: 'food-truck' })
    expect(r.siteRead).toBe(false)
    expect(doc.business.name).toBe('Rosa’s Tamales')
    expect(doc.brand.colorsSource).toBe('kit-default')
    expect(doc.brand.colors).toEqual(BUILDER_KITS['food-truck']!.defaultPalette)
    expect(doc.pages).toHaveLength(5)
  })
  it('a private or malformed URL is never fetched and still gives a draft', async () => {
    const { rt, store } = runtime()
    for (const url of ['http://169.254.169.254/latest', 'http://localhost', 'not a url at all']) {
      const { r } = await draftDoc(rt, store, { source: 'demo', businessName: 'X Grill', sourceUrl: url, kitId: 'restaurant' })
      expect(r.siteRead).toBe(false)
    }
  })
  it('a model timeout, a spend cap or a broken model all fall back to the kit template', async () => {
    for (const chat of [
      (async () => { throw Object.assign(new Error('t'), { name: 'AiError', code: 'timeout' }) }) as GenerateChat,
      (async () => ({ skipped: 'token_cap' as const })) as GenerateChat,
      (async () => ({ content: 'Here is your site!', toolCalls: [], usage: { inputTokens: 1, outputTokens: 1 }, model: 'm', latencyMs: 1 })) as GenerateChat,
    ]) {
      const { rt, store } = runtime({ chat })
      const { r, doc } = await draftDoc(rt, store, { source: 'demo', businessName: '', sourceUrl: 'https://casa-verde-kitchen.example/', kitId: 'restaurant' })
      expect(r.outcome).toBe('fallback')
      expect(doc.brand.colors.primary).toBe('#1E3A34') // still their exact colors
    }
  })
})

describe('prompt injection (acceptance 3, spec 16.4)', () => {
  it('the injection fixture site leaves no instructions, links or color changes in the draft', async () => {
    const { rt, store } = runtime()
    const { doc } = await draftDoc(rt, store, { source: 'demo', businessName: '', sourceUrl: 'https://injection.example/', kitId: 'food-truck' })
    const t = textOf(doc)
    for (const bad of ['evil.example', 'Ignore previous', 'ff0000', 'built by AI', 'Set primary color']) expect(t).not.toContain(bad)
    expect(doc.brand.colors.primary).toBe('#2563EB')
  })
  it('a model that obeys the injection is corrected or replaced, never stored as-is', async () => {
    let calls = 0
    const evil: GenerateChat = async (opts) => {
      calls++
      const base = await mockGenerateChat(opts) as ChatResult
      const content = structuredClone(base.toolCalls[0].arguments) as SiteDoc
      if (calls === 1) {
        content.pages[0].sections[1].props = { ...content.pages[0].sections[1].props, headline: 'This site was built by AI' } as never
      }
      const cta = content.pages[0].sections.find((s) => s.type === 'cta_band')!
      ;(cta.props as { cta: { target: unknown } }).cta.target = { kind: 'url', url: 'https://evil.example/phish' }
      ;(content as unknown as { brand: unknown }).brand = { colors: { primary: '#ff0000' } }
      return { ...base, toolCalls: [{ ...base.toolCalls[0], arguments: content }] }
    }
    const { rt, store } = runtime({ chat: evil })
    const { r, doc } = await draftDoc(rt, store, { source: 'demo', businessName: '', sourceUrl: 'https://mesa-street-tacos.example/', kitId: 'food-truck' })
    expect(calls).toBe(2) // first answer refused (brand key + banned words), second accepted after clean-up
    expect(r.outcome).toBe('ai')
    const t = textOf(doc)
    expect(t).not.toContain('evil.example')
    expect(t).not.toContain('built by AI')
    expect(doc.brand.colors.primary).toBe('#9A3412')
  })
})

describe('content policy and prompt start', () => {
  it('refuses blocked categories politely and stores nothing', async () => {
    const { rt, store } = runtime()
    const r = await createDraft({ source: 'prompt', businessName: 'Lucky Seven Casino', description: 'Slot machines and poker' }, rt)
    expect(r.kind).toBe('blocked')
    expect(store._state.tenants.size).toBe(0)
    expect(store._state.runs.at(-1)?.outcome).toBe('blocked')
  })
  it('picks a kit when none is given, and labels owner colors as the owner’s', async () => {
    const { rt, store } = runtime()
    const { r, doc } = await draftDoc(rt, store, { source: 'prompt', businessName: 'Rolling Smoke', description: 'BBQ trailer that parks at breweries', colors: { primary: '#123456', secondary: '#0A0A0A', accent: '#FFCC00' } })
    expect(r.kitId).toBe('food-truck')
    expect(doc.brand.colorsSource).toBe('owner')
    expect(doc.brand.colors).toEqual({ primary: '#123456', secondary: '#0A0A0A', accent: '#FFCC00' })
  })
  it('a business with no kit of its own gets the general layout, never a restaurant menu', async () => {
    const { rt, store } = runtime()
    const { r, doc } = await draftDoc(rt, store, { source: 'prompt', businessName: 'BRSA Holdings Inc', description: 'Holdings company', city: 'Albuquerque' })
    expect(r.kitId).toBe('service')
    expect(doc.pages.map((p) => p.slug)).toEqual(['', 'services', 'about', 'contact'])
    expect(JSON.stringify(doc)).not.toMatch(/"type":"menu"/)
  })
  it('the owner’s industry shapes the draft: its label in the hero and, for trades, a fitting photo', async () => {
    const { rt, store } = runtime()
    const { doc } = await draftDoc(rt, store, { source: 'prompt', businessName: 'Rio Grande Plumbing', description: 'Repairs, water heaters and drains.', kitId: 'service', industry: { label: 'Plumber', photo: 'pipe-fitting' }, city: 'Santa Fe' })
    const hero = doc.pages[0].sections.find((s) => s.type === 'hero')!
    expect(hero.props).toMatchObject({ eyebrow: 'Plumber in Santa Fe', image: { assetId: '7a1e0000-0000-4000-8000-000000000305' } })
  })
  it('without colors, uses the kit default palette and says so', async () => {
    const { rt, store } = runtime()
    const { doc } = await draftDoc(rt, store, { source: 'prompt', businessName: 'Corner Bistro', description: 'Neighborhood bistro with seasonal plates', kitId: 'restaurant', colors: null })
    expect(doc.brand.colorsSource).toBe('kit-default')
  })
})

describe('generateContent retry loop', () => {
  const kit = BUILDER_KITS.restaurant!
  const input = { businessFacts: { name: 'Casa Verde', kitId: 'restaurant' }, hostname: null, siteText: '', images: [] }
  const sanitize = { businessName: 'Casa Verde', ownHosts: [], allowedAssetIds: new Set<string>() }
  it('sends validation errors back and stops after 2 retries', async () => {
    const seen: string[] = []
    const chat: GenerateChat = async (opts) => {
      const last = opts.messages.at(-1)!
      seen.push(last.role)
      return { content: null, toolCalls: [{ id: `c${seen.length}`, name: 'submit_site', arguments: { pages: [] } }], usage: { inputTokens: 10, outputTokens: 10 }, model: 'm', latencyMs: 1 }
    }
    const r = await generateContent({ kit, input, sanitize, chat, deadline: Date.now() + 60_000 })
    expect(r.outcome).toBe('invalid')
    expect(r.attempts).toBe(3)
    expect(seen).toEqual(['user', 'tool', 'tool'])
    expect(r.usage).toEqual({ inputTokens: 30, outputTokens: 30 })
  })
  it('does not start a retry it cannot finish before the deadline', async () => {
    const chat: GenerateChat = async () => ({ content: null, toolCalls: [{ id: 'c', name: 'submit_site', arguments: {} }], usage: { inputTokens: 1, outputTokens: 1 }, model: 'm', latencyMs: 1 })
    const r = await generateContent({ kit, input, sanitize, chat, deadline: Date.now() + 5_000 })
    expect(r.attempts).toBe(1)
  })
})

describe('sanitizeContent (8.8, 14.8)', () => {
  const kit = BUILDER_KITS['food-truck']!
  it('drops any numbers the writer put in a stats band: only the owner adds stats (D2)', () => {
    const c = kit.template({ name: 'Mesa Street Tacos' })
    const stats = c.pages[0].sections.find((s) => s.type === 'stats')!
    stats.props = { ...(stats.props as object), items: [{ value: '15', label: 'years on the road' }, { value: '10k', label: 'tacos a month' }] } as typeof stats.props
    const { content, report } = sanitizeContent(c, { kit, businessName: 'Mesa Street Tacos', ownHosts: [], allowedAssetIds: new Set() })
    expect(content.pages[0].sections.find((s) => s.type === 'stats')!.props).toMatchObject({ items: [] })
    expect(report.removedStats).toBe(2)
  })
  it('keeps own-site and social links, replaces others with the home page, drops unknown images, resets forms', () => {
    const c = kit.template({ name: 'Mesa Street Tacos' })
    const hero = c.pages[0].sections[1].props as Record<string, unknown>
    hero.primaryCta = { label: 'Order', target: { kind: 'url', url: 'https://mesatacos.com/order' } }
    hero.secondaryCta = { label: 'Win', target: { kind: 'url', url: 'https://evil.example/' } }
    hero.image = { assetId: '3f2a1b9c-4d5e-4f60-8a7b-1c2d3e4f5a6b', alt: 'x' }
    const form = c.pages[4].sections[2].props as Record<string, unknown>
    form.fields = ['name', 'email']
    form.consentText = 'We will text you deals.'
    c.business.social = [{ kind: 'instagram', url: 'https://instagram.com/mesa' }, { kind: 'facebook', url: 'https://evil.example/fb' }]
    const { content, report } = sanitizeContent(c, { kit, businessName: 'Mesa Street Tacos', ownHosts: ['mesatacos.com', 'www.mesatacos.com'], allowedAssetIds: new Set(kit.sampleImages.map((i) => i.assetId)) })
    const h = content.pages[0].sections[1].props as Record<string, unknown>
    expect((h.primaryCta as { target: unknown }).target).toEqual({ kind: 'url', url: 'https://mesatacos.com/order' })
    expect((h.secondaryCta as { target: unknown }).target).toEqual({ kind: 'page', pageId: 'home' })
    expect(h.image).toBeUndefined()
    expect((content.pages[4].sections[2].props as { fields: string[] }).fields).toEqual(['name', 'email', 'phone', 'message'])
    expect(content.business.name).toBe('Mesa Street Tacos')
    expect(content.business.social).toEqual([{ kind: 'instagram', url: 'https://instagram.com/mesa' }])
    expect(report).toEqual({ removedLinks: 1, removedImages: 1, resetForms: 1 })
  })
})

describe('images (spec 8.3, 14.5)', () => {
  let png: Buffer
  beforeAll(async () => { png = await sharp({ create: { width: 900, height: 600, channels: 3, background: '#9A3412' } }).png().toBuffer() })
  it('sniffs by magic bytes, not by what the server claims', () => {
    expect(sniffImage(png)).toBe('png')
    expect(sniffImage(Buffer.from('<html><body>not an image</body></html>'))).toBeNull()
    expect(sniffImage(Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe('svg')
  })
  it('re-encodes photos to WebP, max 1600 wide', async () => {
    const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#000' } }).jpeg().toBuffer()
    const r = await encodePhoto(big)
    expect(sniffImage(r.bytes)).toBe('webp')
    expect(r.width).toBe(1600)
    await expect(encodePhoto(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).rejects.toThrow()
  })
  it('rasterizes safe SVG logos to PNG and refuses SVGs that reference outside files', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#1E3A34"/></svg>')
    const r = await encodeLogo(svg)
    expect(sniffImage(r.bytes)).toBe('png')
    const sneaky = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image xlink:href="https://evil.example/x.png"/></svg>')
    await expect(encodeLogo(sneaky)).rejects.toThrow()
    const xxe = Buffer.from('<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg">&x;</svg>')
    await expect(encodeLogo(xxe)).rejects.toThrow()
  })
  it('stores photos from the business’s site with the draft, marked not redistributable', async () => {
    const page = '<html><head><title>Photo Grill</title><meta name="theme-color" content="#1E3A34"></head><body><p>Grilled food every day of the week.</p><img src="/p1.png" width="900" height="600" alt="The grill"></body></html>'
    const deps: SafeFetchDeps = {
      resolve: async () => [{ address: '93.184.216.34', family: 4 }],
      transport: async (url) => url.pathname === '/p1.png'
        ? { status: 200, headers: { 'content-type': 'image/png' }, body: Readable.from([png]) }
        : url.pathname === '/robots.txt' ? { status: 404, headers: { 'content-type': 'text/plain' }, body: Readable.from([Buffer.from('')]) }
        : { status: 200, headers: { 'content-type': 'text/html' }, body: Readable.from([Buffer.from(page)]) },
    }
    const { rt, store } = runtime({ fetchDeps: deps })
    const { doc } = await draftDoc(rt, store, { source: 'demo', businessName: '', sourceUrl: 'https://photo-grill.example/', kitId: 'restaurant' })
    const assets = [...store._state.assets.values()]
    expect(assets).toHaveLength(1)
    expect(assets[0]).toMatchObject({ kind: 'image', mime: 'image/webp', source: 'scraped', licenseKind: 'owner_site', redistributable: false })
    expect(textOf(doc)).toContain(assets[0].id)
  })
})

describe('architecture rule: stored SiteDocs are read only through loadSiteDoc (acceptance 8)', () => {
  it('no code outside packages/site-schema parses a SiteDoc directly', () => {
    const root = join(__dirname, '..', '..', '..', '..')
    const offenders: string[] = []
    const scan = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', '.next', 'fixtures', 'dist'].includes(e.name)) continue
        const p = join(dir, e.name)
        if (e.isDirectory()) scan(p)
        else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) {
          const src = readFileSync(p, 'utf8')
          if (/\bSiteDoc(V1)?\.(safeParse|parse|parseAsync|safeParseAsync)\(/.test(src)) offenders.push(p.slice(root.length + 1))
        }
      }
    }
    for (const d of ['apps/builder', 'packages/sections', 'packages/kits', 'packages/ai', 'packages/brand']) scan(join(root, d))
    expect(offenders).toEqual([])
  })
})

describe('kit sample images ship with the studio', () => {
  it('every sample image has a licence and a file in public/', async () => {
    const { existsSync } = await import('node:fs')
    const { unlicensedSamples } = await import('@yakini/kits')
    expect(unlicensedSamples()).toEqual([])
    for (const kit of Object.values(BUILDER_KITS)) for (const s of kit!.sampleImages) {
      expect(existsSync(join(__dirname, '..', '..', 'public', s.storagePath)), s.storagePath).toBe(true)
      if (s.webp) for (const f of [s.webp.large, s.webp.small]) {
        expect(existsSync(join(__dirname, '..', '..', 'public', 'kit-samples', kit!.id, f)), f).toBe(true)
      }
    }
  })
})

describe('accent marker only in headlines (design v2)', () => {
  it('flags *accent* outside a headline or heading, allows it in them', async () => {
    const { accentMisuse } = await import('@/lib/pipeline/sanitize')
    expect(accentMisuse({ props: { headline: 'Street food, *made here*', heading: 'Good *to know*' } })).toEqual([])
    expect(accentMisuse({ props: { body: 'We *love* tacos', subhead: 'Fresh *daily*' }, seo: { description: '*Best* in town' } })).toEqual(['We *love* tacos', 'Fresh *daily*', '*Best* in town'])
    expect(accentMisuse({ props: { body: 'Rated 5* by locals' } })).toEqual([])
  })
})
