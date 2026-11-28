import 'server-only'
import { createHash } from 'node:crypto'
import * as Sentry from '@sentry/nextjs'
import { imageSpendConfigFromEnv, type ImageProvider, type ImageSpendConfig, type VisionChecker } from '@yakini/ai'
import { sampleImageById } from '@yakini/kits'
import { loadSiteDoc, validateNewDoc, type SiteDoc } from '@yakini/site-schema'
import { analyzeImage } from '@/lib/images/analyze'
import { realImageProviders } from '@/lib/server/ai'
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

/** Library images: the kit samples and the AI-made kit library (never the owner's photos). */
export const isLibraryImage = (assetId: string) => Boolean(sampleImageById(assetId))

export async function runImagery(rt: Runtime, siteId: string, override?: Providers): Promise<ImageryRunResult> {
  const p = override ?? providersFor(rt)
  if (!p) return { status: 'off', generated: 0, placed: 0, stopped: false }
  const draft = await rt.store.getDraft(siteId)
  if (!draft || draft.deleted) return { status: 'gone', generated: 0, placed: 0, stopped: false }
  const doc = loadSiteDoc(draft.doc).doc
  const plan = assignShots(imageSlots(doc), isLibraryImage)
  if (!plan.length) return { status: 'nothing_to_do', generated: 0, placed: 0, stopped: false }

  const wanted = new Set(plan.map((x) => x.shot))
  const shots = buildShotList({
    kitId: doc.kitId, preset: doc.style.preset, offerings: offeringsIn(doc),
    ...(doc.business.tagline ? { description: doc.business.tagline } : {}),
  }).filter((s) => wanted.has(s.slot))

  // Pictures already on the page, so nothing generated repeats them.
  const seen: string[] = []
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
  const stored: GeneratedAsset[] = []
  for (const a of made) {
    try {
      await rt.store.saveAsset({
        id: a.id, tenantId: draft.tenantId, kind: 'image', bytes: a.bytes, mime: a.mime, width: a.width, height: a.height, alt: a.alt,
        source: 'generated', sourceUrl: null, sha256: createHash('sha256').update(a.bytes).digest('hex'), licenseKind: 'generated',
        licenseNote: 'Made for this site by Yakini', redistributable: false,
        imagery: { variants: a.variants.variants, lqip: a.variants.lqip, focus: a.variants.focus, dhash: a.dhash, quality: a.quality, license: a.license },
      })
      stored.push(a)
    } catch (e) { Sentry.captureException(e, { tags: { area: 'imagery-store' } }) }
  }

  // Swap in, re-reading the draft each try: the owner may be editing it.
  let placed = 0
  for (let attempt = 0; attempt < 3 && stored.length; attempt++) {
    const now = await rt.store.getDraft(siteId)
    if (!now || now.deleted) break
    const current = loadSiteDoc(now.doc).doc
    const fresh = assignShots(imageSlots(current), isLibraryImage)
    const byShot = new Map(stored.map((a) => [a.slot, a]))
    const placement = fresh.flatMap((x) => { const a = byShot.get(x.shot); return a ? [{ slot: x.slot, ref: { assetId: a.id, alt: a.alt } }] : [] })
    const next = placeImages(current, placement)
    if (!next.placed) break
    const checked = validateNewDoc(next.doc)
    if (!checked.ok) { Sentry.captureMessage('imagery produced an invalid doc', { level: 'error', tags: { area: 'imagery' } }); break }
    const saved = await rt.store.saveDraft({ siteId, baseRev: now.rev, doc: checked.doc as SiteDoc })
    if (saved.ok) { placed = next.placed; break }
  }
  return { status: 'done', generated: stored.length, placed, stopped: outcomes.some((o) => o.stopped === 'spend') }
}
