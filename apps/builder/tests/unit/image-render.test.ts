import { describe, expect, it } from 'vitest'
import { designFixtures } from '@yakini/kits/design-fixtures'
import { sampleImageById } from '@yakini/kits'
import { loadSiteDoc, type SiteDoc } from '@yakini/site-schema'
import { makeVariants } from '@/lib/images/variants'
import { assetResolved, imageOptions, sampleResolved, VARIANT_KEY } from '@/lib/images/resolve'
import { assetFile } from '@/lib/images/serve'
import { drawPhoto } from '@/lib/pipeline/test-images'
import { renderPublished } from '@/lib/site/render-entry'
import { createMemoryStore, type AssetMeta } from '@/lib/server/store'

/**
 * Design D4 rendering: every photo on a v2 look ships AVIF then WebP copies, its exact size, alt
 * text and an inline blurred placeholder; heroes get the 4:5 phone crop; photos made for the site
 * take the look's grade; nothing points off the site; the classic look's markup is unchanged.
 */
const SAMPLE = '7a1e0000-0000-4000-8000-000000000104'
const GEN = '9b2e0000-1111-4222-8333-444444444444'
const fixtures = designFixtures()
const docOf = (name: string): SiteDoc => loadSiteDoc(structuredClone(fixtures[name])).doc
const base = { siteId: '7a1e0000-0000-4000-8000-0000000000aa', reportUrl: null, formStamp: 'stamp', canonicalHost: 'mesa.yakini.digital', indexable: false }

async function generatedMeta(): Promise<{ meta: AssetMeta; bytes: Awaited<ReturnType<typeof makeVariants>> }> {
  const v = await makeVariants(await drawPhoto('photo-hero', 2400, 1350), { tall: true })
  return { bytes: v, meta: { width: v.width, height: v.height, lqip: v.lqip, focus: v.focus, generated: true, variants: v.variants.map(({ format, width, height, crop }) => ({ format, width, height, crop })) } }
}

const heroOf = (doc: SiteDoc) => doc.pages[0].sections.find((s) => s.type === 'hero')!.props as { image?: { assetId: string; alt: string } }
const imgs = (html: string) => html.match(/<img\b[^>]*>/g) ?? []
// Everything the page fetches (links a visitor clicks are not requests): src, srcset, and <link> hrefs.
const urlsIn = (html: string) => [...html.replace(/<a\b[^>]*>/g, '').matchAll(/\s(?:src|srcSet|srcset|href|imageSrcSet)="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((x) => x.trim().split(/\s+/)[0]).filter(Boolean))

describe('kit sample photos', () => {
  it('AVIF first, then WebP, with placeholder, focus and the grade', () => {
    const r = sampleResolved(sampleImageById(SAMPLE)!)
    expect(r.sources?.map((s) => s.type)).toEqual(['image/avif', 'image/webp'])
    expect(r.sources![0].srcSet).toMatch(/^\/_kit-samples\/[a-z-]+\/[a-z-]+-640\.avif 640w, .*-1280\.avif 1280w$/)
    expect(r.lqip).toMatch(/^data:image\/webp;base64,/)
    expect(r.focus).toBeTruthy()
    expect(r.graded).toBe(true)
  })
  it('the classic look keeps the markup it had before (WebP only, nothing else)', () => {
    const r = sampleResolved(sampleImageById(SAMPLE)!, true)
    expect(Object.keys(r).sort()).toEqual(['height', 'sources', 'src', 'width'])
    expect(r.sources?.map((s) => s.type)).toEqual(['image/webp'])
  })
})

describe('stored photos', () => {
  it('copies are served by name: AVIF and WebP at each width, the phone crop, placeholder and focus', async () => {
    const { meta } = await generatedMeta()
    const r = assetResolved('/assets/x', meta, { gradeOwn: false, legacy: false })
    expect(r.sources?.map((s) => s.type)).toEqual(['image/avif', 'image/webp'])
    expect(r.sources![0].srcSet).toContain('/assets/x?img=full-640.avif 640w')
    expect(r.sources![0].srcSet).toContain('/assets/x?img=full-2400.avif 2400w')
    expect(r.tallSources?.[0].srcSet).toMatch(/img=tall-\d+\.avif/)
    expect(r.src).toBe('/assets/x?img=full-1024.webp')
    expect([r.width, r.height]).toEqual([2400, 1350])
    expect(r.graded).toBe(true)
    // A preview link keeps its access query and adds the copy name after it.
    expect(assetResolved('/api/previews/s/assets/a?s=tok', meta, { gradeOwn: false, legacy: false }).src).toBe('/api/previews/s/assets/a?s=tok&img=full-1024.webp')
  })
  it("the owner's own photos take the grade only when they turn it on", async () => {
    const { meta } = await generatedMeta()
    const own = { ...meta, generated: false }
    expect(assetResolved('/a', own, { gradeOwn: false, legacy: false }).graded).toBe(false)
    expect(assetResolved('/a', own, { gradeOwn: true, legacy: false }).graded).toBe(true)
    const doc = docOf('restaurant-rich')
    expect(imageOptions(doc).gradeOwn).toBe(false)
    expect(imageOptions({ style: { ...doc.style, photoGrade: 'all' } }).gradeOwn).toBe(true)
  })
  it('classic, or a photo with no stored copies, renders exactly as before', async () => {
    const { meta } = await generatedMeta()
    expect(assetResolved('/a', meta, { gradeOwn: true, legacy: true })).toEqual({ src: '/a', width: 1600, height: 1000 })
    expect(assetResolved('/a', undefined, { gradeOwn: true, legacy: false })).toEqual({ src: '/a', width: 1600, height: 1000 })
  })
})

describe('serving copies', () => {
  it('only well-formed copy names reach storage; the stored file is served without one', async () => {
    const store = createMemoryStore()
    const { bytes: v } = await generatedMeta()
    const tenant = 'tenant-1'
    store._state.assets.set(GEN, {
      id: GEN, tenantId: tenant, kind: 'image', bytes: v.variants.find((x) => x.format === 'webp' && x.width === 2400 && x.crop === 'full')!.bytes, mime: 'image/webp',
      width: v.width, height: v.height, alt: 'Bread', source: 'generated', sourceUrl: null, sha256: '0'.repeat(64), licenseKind: 'generated', licenseNote: '', redistributable: false,
      imagery: { variants: v.variants, lqip: v.lqip, focus: v.focus },
    })
    expect((await assetFile(store, tenant, GEN, 'full-640.avif'))?.mime).toBe('image/avif')
    expect((await assetFile(store, tenant, GEN, 'tall-1024.webp'))?.mime).toBe('image/webp')
    expect((await assetFile(store, tenant, GEN, null))?.mime).toBe('image/webp')
    for (const bad of ['../secret', 'full-640.gif', 'full-0640.avif', 'wide-640.avif', 'full-640.avif/x', '']) {
      expect(VARIANT_KEY.test(bad), bad).toBe(false)
      expect(await assetFile(store, tenant, GEN, bad), bad).toBeNull()
    }
    expect(await assetFile(store, 'another-tenant', GEN, 'full-640.avif')).toBeNull()
  }, 60_000)
})

describe('published page markup', () => {
  it('a generated hero on a v2 look: picture with AVIF and WebP, phone crop, size, alt, placeholder, grade; nothing off-site', async () => {
    const { meta } = await generatedMeta()
    const doc = docOf('restaurant-rich')
    heroOf(doc).image = { assetId: GEN, alt: 'Fresh bread on a wooden table' }
    const html = renderPublished({ ...base, doc, pageId: doc.pages[0].id, thanks: null, assets: { [GEN]: meta } })
    expect(html).toContain(`<source media="(max-width: 699px)" type="image/avif" srcSet="/assets/${GEN}?img=tall-`)
    expect(html).toContain(`type="image/avif" srcSet="/assets/${GEN}?img=full-640.avif 640w`)
    const hero = imgs(html).find((t) => t.includes(GEN))!
    expect(hero).toMatch(/width="2400"/)
    expect(hero).toMatch(/height="1350"/)
    expect(hero).toContain('alt="Fresh bread on a wooden table"')
    expect(hero).toContain('ys-graded')
    expect(hero).toMatch(/background-image:url\(&quot;data:image\/webp;base64,/)
    for (const u of urlsIn(html)) expect(u, u).toMatch(/^(\/(?!\/)|#|data:|https:\/\/mesa\.yakini\.digital(\/|$))/)
  }, 60_000)
  it('every photo on every v2 fixture page has width, height, alt, AVIF and WebP, and a placeholder', () => {
    let checked = 0
    for (const [name, raw] of Object.entries(fixtures)) {
      const doc = loadSiteDoc(structuredClone(raw)).doc
      if (doc.style.preset === 'classic') continue
      for (const p of doc.pages) {
        const html = renderPublished({ ...base, doc, pageId: p.id, thanks: null })
        for (const pic of html.match(/<picture\b[\s\S]*?<\/picture>/g) ?? []) {
          const img = imgs(pic)[0]
          expect(img, `${name}/${p.slug}`).toMatch(/\swidth="\d+"/)
          expect(img).toMatch(/\sheight="\d+"/)
          expect(img).toMatch(/\salt="/)
          expect(pic).toContain('type="image/avif"')
          expect(pic).toContain('type="image/webp"')
          expect(img).toContain('data:image/webp;base64,')
          checked++
        }
        for (const u of urlsIn(html)) expect(u, `${name}/${p.slug}: ${u}`).toMatch(/^(\/(?!\/)|#|data:|https:\/\/mesa\.yakini\.digital(\/|$))/)
      }
    }
    expect(checked).toBeGreaterThan(30)
  })
})
