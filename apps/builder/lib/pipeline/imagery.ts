import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { checkImageSpend, type ImageProvider, type ImageSpendConfig, type VisionChecker } from '@yakini/ai'
import { makeVariants, type ImageVariants } from '@/lib/images/variants'
import { checkGenerated, type CheckReason } from './image-check'
import type { Shot, ShotSlot } from './shot-list'

/**
 * Image generation for one site (design D4, 7c). Library images are already on the page, so the
 * draft never waits; this makes the shot list's images one by one and returns the ones that passed
 * the automatic check, ready to swap in.
 *
 * - Spend: every image and every check is priced against the images' own daily cap before it runs.
 *   When the cap is reached (or images are switched off) generation stops; the library images stay.
 * - At most 2 attempts per slot; after that the slot keeps its library image.
 * - A provider or checker error counts as a failed attempt (fails closed).
 */
export type GeneratedAsset = {
  id: string
  slot: ShotSlot
  bytes: Buffer
  mime: 'image/webp'
  width: number
  height: number
  alt: string
  sha256?: string
  dhash: string
  variants: ImageVariants
  quality: { score: number; reasons: CheckReason[] }
  license: { provider: string; model: string; prompt: string; createdAt: string }
}

export type SlotOutcome = { slot: ShotSlot; asset: GeneratedAsset | null; attempts: { reasons: CheckReason[] }[]; stopped?: 'spend' }

export type ImageryDeps = {
  provider: ImageProvider
  checker: VisionChecker
  spend: { config: ImageSpendConfig; todayUsd(): Promise<number>; record(usd: number, kind: 'image' | 'image_check'): Promise<void> }
  /** dhashes of images already on the site (library and owner photos), so nothing repeats. */
  seen?: string[]
  maxAttempts?: number
  now?: () => Date
}

/** "a food truck window glowing at dusk…" → "A food truck window glowing at dusk…" (≤ 160 chars). */
export const altFor = (subject: string) => {
  const s = subject.replace(/, beautifully presented, close up$/, '').replace(/, for a [^,]+ business$/, '').trim()
  return (s.charAt(0).toUpperCase() + s.slice(1)).slice(0, 160)
}

export async function generateShots(shots: readonly Shot[], deps: ImageryDeps): Promise<SlotOutcome[]> {
  const out: SlotOutcome[] = []
  const seen = [...(deps.seen ?? [])]
  const max = deps.maxAttempts ?? 2
  let stopped = false
  for (const shot of shots) {
    const o: SlotOutcome = { slot: shot.slot, asset: null, attempts: [] }
    out.push(o)
    if (stopped) { o.stopped = 'spend'; continue }
    for (let attempt = 0; attempt < max && !o.asset; attempt++) {
      const cost = deps.provider.priceUsd(shot.size) + deps.checker.priceUsd()
      let today: number
      try { today = await deps.spend.todayUsd() } catch { today = Number.NaN } // unknown spend: fails closed
      if (!checkImageSpend(today, cost, deps.spend.config).allowed) { stopped = true; o.stopped = 'spend'; break }
      try {
        const img = await deps.provider.generate({ prompt: shot.prompt, aspect: shot.aspect, size: shot.size })
        await deps.spend.record(deps.provider.priceUsd(shot.size), 'image')
        const verdict = await checkGenerated({ bytes: img.bytes, mime: img.mime, brief: shot.subject, role: shot.slot.startsWith('hero') ? 'hero' : 'other', seen, checker: deps.checker })
        await deps.spend.record(deps.checker.priceUsd(), 'image_check')
        o.attempts.push({ reasons: verdict.reasons })
        if (!verdict.pass) continue
        // Stored master: WebP, at most 2400 wide, metadata stripped.
        const master = await sharp(img.bytes, { failOn: 'error' }).rotate().resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true })
        const variants = await makeVariants(master.data, { tall: shot.slot === 'hero-wide' })
        seen.push(verdict.stats.dhash)
        o.asset = {
          id: randomUUID(), slot: shot.slot, bytes: master.data, mime: 'image/webp', width: master.info.width, height: master.info.height,
          alt: altFor(shot.subject), dhash: verdict.stats.dhash, variants,
          quality: { score: verdict.score, reasons: [] },
          license: { provider: img.provider, model: img.model, prompt: shot.prompt, createdAt: (deps.now?.() ?? new Date()).toISOString() },
        }
      } catch {
        o.attempts.push({ reasons: ['check_failed'] })
      }
    }
  }
  return out
}
