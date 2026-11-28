import { SAMPLE_AVIF_WIDTHS, SAMPLE_TALL, sampleImagery, type SampleImage } from '@yakini/kits'
import type { ResolvedImage } from '@yakini/sections'
import type { SiteDoc } from '@yakini/site-schema'
import type { AssetMeta } from '@/lib/server/store'

/**
 * How every renderer turns a photo into <picture> markup (design D4): AVIF first, then WebP, at
 * several widths; the exact size (no layout shift); a tiny blurred placeholder under it; its focus
 * point; the 4:5 phone crop for heroes; and whether it takes the look's colour grade.
 *
 * Pure (no server imports), so the published-page renderer bundle uses it too.
 */
export type AssetMetaMap = Readonly<Record<string, AssetMeta>>

/** A served copy's name, `<crop>-<width>.<format>`; routes accept only names that match. */
export const VARIANT_KEY = /^(full|tall)-([1-9][0-9]{1,3})\.(avif|webp)$/
const key = (v: { crop: string; width: number; format: string }) => `${v.crop}-${v.width}.${v.format}`

/** Photos made for the site and library photos always take the grade; the owner's own only when they turn it on. */
export const gradesOwnerPhotos = (doc: Pick<SiteDoc, 'style'>) => doc.style.photoGrade === 'all'

/**
 * The classic look keeps its photo markup exactly as before D4 (plan 7.4: classic stays byte for
 * byte), so sites still on it render unchanged. Every v2 look gets the D4 markup.
 */
export const legacyImages = (doc: Pick<SiteDoc, 'style'>) => doc.style.preset === 'classic'
export type ImageOptions = { gradeOwn: boolean; legacy: boolean }
export const imageOptions = (doc: Pick<SiteDoc, 'style'>): ImageOptions => ({ gradeOwn: gradesOwnerPhotos(doc), legacy: legacyImages(doc) })

/** A kit sample photo: its AVIF copies (made by build:site), WebP copies, placeholder and focus. */
export function sampleResolved(sample: SampleImage, legacy = false): ResolvedImage {
  const src = `/${sample.storagePath}`
  if (!sample.webp) return { src, width: sample.width, height: sample.height }
  const dir = `/${sample.storagePath.slice(0, sample.storagePath.lastIndexOf('/') + 1)}`
  const avifDir = dir.replace(/^\/kit-samples\//, '/_kit-samples/')
  const stem = sample.key
  const meta = sampleImagery(sample.assetId)
  const webp = [
    `${dir}${sample.webp.small} ${sample.webp.smallWidth}w`,
    sample.webp.phone && sample.webp.phoneWidth ? `${dir}${sample.webp.phone} ${sample.webp.phoneWidth}w` : null,
    sample.webp.medium && sample.webp.mediumWidth ? `${dir}${sample.webp.medium} ${sample.webp.mediumWidth}w` : null,
    `${dir}${sample.webp.large} ${sample.width}w`,
  ].filter(Boolean).join(', ')
  if (legacy) return { src, width: sample.width, height: sample.height, sources: [{ type: 'image/webp', srcSet: webp }] }
  const avif = SAMPLE_AVIF_WIDTHS.filter((w) => w <= sample.width).map((w) => `${avifDir}${stem}-${w}.avif ${w}w`).join(', ')
  const tall = `${avifDir}${stem}-tall-${SAMPLE_TALL.width}`
  return {
    src, width: sample.width, height: sample.height,
    sources: [{ type: 'image/avif', srcSet: avif }, { type: 'image/webp', srcSet: webp }],
    tallSources: [{ type: 'image/avif', srcSet: `${tall}.avif ${SAMPLE_TALL.width}w` }, { type: 'image/webp', srcSet: `${tall}.webp ${SAMPLE_TALL.width}w` }],
    ...(meta ? { lqip: meta.lqip, focus: meta.focus } : {}),
    graded: true,
  }
}

/**
 * A stored asset (the owner's photo, or one made for the site). `url` is the asset's address with any
 * access query already on it; copies add `img=<name>`. Without stored copies (older photos) the
 * single stored file is used, as before.
 */
export function assetResolved(url: string, meta: AssetMeta | undefined, o: ImageOptions): ResolvedImage {
  if (!meta || o.legacy) return { src: url, width: 1600, height: 1000 }
  const at = (k: string) => `${url}${url.includes('?') ? '&' : '?'}img=${encodeURIComponent(k)}`
  const set = (crop: 'full' | 'tall', format: 'avif' | 'webp') => meta.variants
    .filter((v) => v.crop === crop && v.format === format)
    .sort((a, b) => a.width - b.width)
    .map((v) => `${at(key(v))} ${v.width}w`).join(', ')
  const sources = (crop: 'full' | 'tall') => (['avif', 'webp'] as const)
    .map((f) => ({ type: `image/${f}` as const, srcSet: set(crop, f) }))
    .filter((s) => s.srcSet)
  const full = sources('full')
  const tall = sources('tall')
  // The plain <img> src: a mid-size WebP copy, else the stored file.
  const webps = meta.variants.filter((v) => v.crop === 'full' && v.format === 'webp').sort((a, b) => a.width - b.width)
  const fallback = webps.find((v) => v.width >= 1024) ?? webps[webps.length - 1]
  return {
    src: fallback ? at(key(fallback)) : url,
    width: meta.width, height: meta.height,
    ...(full.length ? { sources: full } : {}),
    ...(tall.length ? { tallSources: tall } : {}),
    ...(meta.lqip ? { lqip: meta.lqip } : {}),
    ...(meta.focus ? { focus: meta.focus } : {}),
    graded: meta.generated || Boolean(meta.library) || o.gradeOwn,
  }
}
