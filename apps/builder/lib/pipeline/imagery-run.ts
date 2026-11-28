import 'server-only'
import { createHash } from 'node:crypto'
import * as Sentry from '@sentry/nextjs'
import { imageSpendConfigFromEnv, type ImageProvider, type ImageSpendConfig, type VisionChecker } from '@yakini/ai'
import { sampleImageById } from '@yakini/kits'
import { loadSiteDoc, validateNewDoc, type SiteDoc } from '@yakini/site-schema'
import { analyzeImage } from '@/lib/images/analyze'
import { realImageProviders } from '@/lib/server/ai'
import { storedAssetIds } from '@/lib/site/asset-meta-cache'
import type { Runtime } from '@/lib/server/runtime'
import { generateShots, type GeneratedAsset } from './imagery'
import { assignShots, imageSlots, offeringsIn, placeImages } from './slots'
import { buildShotList } from './shot-list'
import { testImageProvider, testVisionChecker } from './test-images'

/**
 * Fill a new draft's photos (design D4). Runs after the draft is saved (never while the owner
 * waits): the draft already shows library images, and each one is swapped for an image made for
 * this business once it passes the automatic check. No human review step.
 *
 * Off unless images are switched on (flag, cap and key, see realImageProviders). Test mode uses the
 * test providers, so the whole flow runs in CI with no network and no cost.
 */
export type ImageryRunResult = { status: 'off' | 'nothing_to_do' | 'done' | 'gone'; generated: number; placed: number; stopped: boolean }

type Providers = { provider: ImageProvider; checker: VisionChecker; spend: ImageSpendConfig }

export function providersFor(rt: Pick<Runtime, 'testMode'>): Providers | null {
  if (rt.testMode) {
    // Test mode: free providers, and a cap so the spend path is exercised like production.
    return { provider: testImageProvider(), checker: testVisionChecker(), spend: { enabled: true, imageDailyUsdCap: 1, overallDailyUsdCap: 10 } }
  }
  const real = realImageProviders()
  return real ? { ...real, spend: imageSpendConfigFromEnv(process.env) } : null
}

/** Kit sample photos (shipped with the studio). Library copies in a tenant are found from their asset rows. */
export const isLibraryImage = (assetId: string) => Boolean(sampleImageById(assetId))

type Draft = NonNullable<Awaited<ReturnType<Runtime['store']['getDraft']>>>

/** Asset ids in the doc that are kit library copies (replaceable, like kit samples). */
async function libraryCopies(rt: Runtime, tenantId: string, doc: SiteDoc): Promise<Set<string>> {
  const ids = storedAssetIds(doc)
  if (!ids.length) return new Set()
  const meta = await rt.store.assetMeta(tenantId, ids)
  return new Set(Object.entries(meta).filter(([, m]) => m.library).map(([id]) => id))
}

/**
 * Swap images into the draft by shot, re-reading it each try (the owner may be editing it). Only
 * places that still show a library image or nothing are filled.
 */
async function swapIn(rt: Runtime, siteId: string, byShot: ReadonlyMap<string, { assetId: string; alt: string }>, extraLibrary: ReadonlySet<string>): Promise<number> {
  for (let attempt = 0; attempt < 3 && byShot.size; attempt++) {
    const now = await rt.store.getDraft(siteId)
    if (!now || now.deleted) return 0
    const current = loadSiteDoc(now.doc).doc
    const fresh = assignShots(imageSlots(current), (id) => isLibraryImage(id) || extraLibrary.has(id))
    const placement = fresh.flatMap((x) => { const ref = byShot.get(x.shot); return ref ? [{ slot: x.slot, ref }] : [] })
    const next = placeImages(current, placement)
    if (!next.placed) return 0
    const checked = validateNewDoc(next.doc)
    if (!checked.ok) { Sentry.captureMessage('imagery produced an invalid doc', { level: 'error', tags: { area: 'imagery' } }); return 0 }
    const saved = await rt.store.saveDraft({ siteId, baseRev: now.rev, doc: checked.doc as SiteDoc })
    if (saved.ok) return next.placed
  }
  return 0
}

/**
 * Library first: when the kit has library photos (made by hand with scripts/generate-kit-library.ts),
 * copy the ones this draft needs into the tenant and show them in place of the kit samples. Until the
 * library is made the kit samples stay the library, and this does nothing.
 */
async function fillFromLibrary(rt: Runtime, draft: Draft): Promise<{ placed: number; dhashes: string[] }> {
  const doc = loadSiteDoc(draft.doc).doc
  const lib = await rt.store.kitLibrary(doc.kitId)
  if (!lib.length) return { placed: 0, dhashes: [] }
  const best = new Map<string, (typeof lib)[number]>()
  for (const img of lib) { const b = best.get(img.slot); if (!b || img.qualityScore > b.qualityScore) best.set(img.slot, img) }
  const plan = assignShots(imageSlots(doc), isLibraryImage)
  const byShot = new Map<string, { assetId: string; alt: string }>()
  const copied = new Set<string>()
  const dhashes: string[] = []
  for (const { shot } of plan) {
    const img = best.get(shot)
    if (!img || byShot.has(shot)) continue
    try {
      const id = await rt.store.copyLibraryImage(draft.tenantId, img)
      byShot.set(shot, { assetId: id, alt: img.alt })
      copied.add(id)
      if (img.dhash) dhashes.push(img.dhash)
    } catch (e) { Sentry.captureException(e, { tags: { area: 'kit-library-copy' } }) }
  }
  return { placed: await swapIn(rt, draft.siteId, byShot, copied), dhashes }
}

export async function runImagery(rt: Runtime, siteId: string, override?: Providers): Promise<ImageryRunResult> {
  const first = await rt.store.getDraft(siteId)
  if (!first || first.deleted) return { status: 'gone', generated: 0, placed: 0, stopped: false }
  const lib = await fillFromLibrary(rt, first)
  const p = override ?? providersFor(rt)
  if (!p) return { status: 'off', generated: 0, placed: lib.placed, stopped: false }
  const draft = lib.placed ? await rt.store.getDraft(siteId) : first
  if (!draft || draft.deleted) return { status: 'gone', generated: 0, placed: lib.placed, stopped: false }
  const doc = loadSiteDoc(draft.doc).doc
  const copies = await libraryCopies(rt, draft.tenantId, doc)
  const isLibrary = (id: string) => isLibraryImage(id) || copies.has(id)
  const plan = assignShots(imageSlots(doc), isLibrary)
  if (!plan.length) return { status: 'nothing_to_do', generated: 0, placed: lib.placed, stopped: false }

  const wanted = new Set(plan.map((x) => x.shot))
  const shots = buildShotList({
    kitId: doc.kitId, preset: doc.style.preset, offerings: offeringsIn(doc),
    ...(doc.business.tagline ? { description: doc.business.tagline } : {}),
  }).filter((s) => wanted.has(s.slot))

  // Pictures already on the page, so nothing generated repeats them.
  const seen: string[] = [...lib.dhashes]
  for (const s of imageSlots(doc)) {
    const sample = s.current ? sampleImageById(s.current.assetId) : undefined
    if (!sample) continue
    try {
      const { readFile } = await import('node:fs/promises')
      const { join } = await import('node:path')
      seen.push((await analyzeImage(await readFile(join(process.cwd(), 'public', sample.storagePath)))).dhash)
    } catch { /* a sample that can't be read just isn't compared */ }
  }

  const outcomes = await generateShots(shots, {
    provider: p.provider, checker: p.checker, seen,
    spend: {
      config: p.spend,
      todayUsd: () => rt.store.imageUsdToday(),
      record: (usd, kind) => rt.store.logAiRun({
        tenantId: draft.tenantId, siteId, kind, model: kind === 'image' ? p.provider.model : p.checker.model, promptVersion: 'd4-images-1',
        inputTokens: 0, outputTokens: 0, latencyMs: 0, outcome: 'ok', toolCalls: 0, usd,
      }),
    },
  })

  const made = outcomes.map((o) => o.asset).filter((a): a is GeneratedAsset => !!a)
  const byShot = new Map<string, { assetId: string; alt: string }>()
  for (const a of made) {
    try {
      await rt.store.saveAsset({
        id: a.id, tenantId: draft.tenantId, kind: 'image', bytes: a.bytes, mime: a.mime, width: a.width, height: a.height, alt: a.alt,
        source: 'generated', sourceUrl: null, sha256: createHash('sha256').update(a.bytes).digest('hex'), licenseKind: 'generated',
        licenseNote: 'Made for this site by Yakini', redistributable: false,
        imagery: { variants: a.variants.variants, lqip: a.variants.lqip, focus: a.variants.focus, dhash: a.dhash, quality: a.quality, license: a.license },
      })
      byShot.set(a.slot, { assetId: a.id, alt: a.alt })
    } catch (e) { Sentry.captureException(e, { tags: { area: 'imagery-store' } }) }
  }
  const placed = await swapIn(rt, siteId, byShot, copies)
  return { status: 'done', generated: byShot.size, placed: lib.placed + placed, stopped: outcomes.some((o) => o.stopped === 'spend') }
}
