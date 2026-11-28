import type { VisionChecker, VisionFlag } from '@yakini/ai'
import { analyzeImage, hamming, LIMITS, NEAR_DUPLICATE_BITS, photoScore, pixelProblems, type ImageProblem, type ImageStats } from '@/lib/images/analyze'

/**
 * The automatic image checks (design D4, 7c). There is no human review step: a photo shows on a
 * site only if it passes here.
 *
 * - Imported photos (the owner's own, read from their site): `rankImportedPhotos` drops small,
 *   blurry, flat, screenshot-like, text-heavy and near-duplicate images and ranks the rest; the best
 *   one wide enough for a hero (1200 px) becomes the hero.
 * - Generated images: `checkGenerated` runs the pixel pass (resolution, blown highlights, duplicates,
 *   flat or text-like images) and the vision pass against the shot description (garbled text, faces,
 *   logos, warped objects, extra fingers, off-brief). The score and every reason are kept on the asset.
 */
export type RankedPhoto<T> = { item: T; stats: ImageStats; score: number; problems: ImageProblem[]; heroOk: boolean }

export async function rankImportedPhotos<T extends { bytes: Buffer }>(items: readonly T[]): Promise<{ kept: RankedPhoto<T>[]; rejected: RankedPhoto<T>[]; hero: RankedPhoto<T> | null }> {
  const all: RankedPhoto<T>[] = []
  for (const item of items) {
    try {
      const stats = await analyzeImage(item.bytes)
      const problems = pixelProblems(stats)
      all.push({ item, stats, score: photoScore(stats), problems, heroOk: stats.width >= LIMITS.heroMinWidth && stats.width >= stats.height })
    } catch { /* unreadable: left out */ }
  }
  const candidates = all.filter((p) => p.problems.length === 0).sort((a, b) => b.score - a.score)
  const kept: RankedPhoto<T>[] = []
  for (const p of candidates) {
    if (kept.some((k) => hamming(k.stats.dhash, p.stats.dhash) <= NEAR_DUPLICATE_BITS)) { p.problems.push('duplicate'); continue }
    kept.push(p)
  }
  const rejected = all.filter((p) => !kept.includes(p))
  return { kept, rejected, hero: kept.find((p) => p.heroOk) ?? null }
}

export type CheckReason = ImageProblem | 'low_resolution' | VisionFlag | 'low_score' | 'check_failed'
export type ImageVerdict = { pass: boolean; score: number; reasons: CheckReason[]; stats: ImageStats }

/** Minimum score from the vision pass for an image to show. */
export const VISION_MIN_SCORE = 0.6

export async function checkGenerated(i: {
  bytes: Buffer; mime: string; brief: string; role: 'hero' | 'other'; seen: readonly string[]; checker: VisionChecker
}): Promise<ImageVerdict> {
  const stats = await analyzeImage(i.bytes)
  const reasons: CheckReason[] = []
  const minWidth = i.role === 'hero' ? LIMITS.heroMinWidth : 640
  if (Math.max(stats.width, stats.height) < minWidth) reasons.push('low_resolution')
  for (const p of pixelProblems(stats)) if (p !== 'too_small') reasons.push(p)
  if (i.seen.some((d) => hamming(d, stats.dhash) <= NEAR_DUPLICATE_BITS)) reasons.push('duplicate')
  let vision = 0
  try {
    const v = await i.checker.check({ bytes: i.bytes, mime: i.mime, brief: i.brief })
    vision = v.score
    reasons.push(...v.flags)
    if (v.score < VISION_MIN_SCORE) reasons.push('low_score')
  } catch {
    reasons.push('check_failed') // fails closed: an image the checker couldn't see never shows
  }
  const unique = [...new Set(reasons)]
  const score = Math.round(((photoScore(stats) + vision) / 2) * 1000) / 1000
  return { pass: unique.length === 0, score, reasons: unique, stats }
}
