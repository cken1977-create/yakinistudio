import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { safeFetch, type SafeFetchDeps } from '@yakini/brand/safe-fetch'

/**
 * Photos and logos from the business's own site (spec 8.3, 14.5): downloaded through the safe
 * fetcher (5 MB max), checked by magic bytes (never by the server's word), re-encoded by sharp
 * (which drops EXIF/GPS and anything hidden in the file) and capped in size. SVG logos are
 * rasterized to PNG, so no SVG from the outside is ever stored or served.
 */
export const PHOTO_MAX_WIDTH = 1600
export const LOGO_MAX_SIZE = 512
const MAX_PIXELS = 40_000_000 // decompression-bomb guard

export type StoredImage = {
  id: string
  kind: 'image' | 'logo'
  bytes: Buffer
  mime: 'image/webp' | 'image/png'
  width: number
  height: number
  alt: string
  sourceUrl: string
  sha256: string
}

export function sniffImage(b: Buffer): 'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'svg' | null {
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp'
  if (b.subarray(0, 6).toString('ascii') === 'GIF87a' || b.subarray(0, 6).toString('ascii') === 'GIF89a') return 'gif'
  if (b.subarray(4, 8).toString('ascii') === 'ftyp' && /avi[fs]/.test(b.subarray(8, 12).toString('ascii'))) return 'avif'
  const head = b.subarray(0, 1024).toString('utf8').replace(/^﻿/, '').trimStart().toLowerCase()
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'svg'
  return null
}

/** Re-encode a raster photo to WebP, max 1600 px wide. Throws on anything that is not an image. */
export async function encodePhoto(input: Buffer): Promise<{ bytes: Buffer; width: number; height: number }> {
  const kind = sniffImage(input)
  if (!kind || kind === 'svg') throw new Error('not a photo')
  const { data, info } = await sharp(input, { limitInputPixels: MAX_PIXELS, animated: false, failOn: 'error' })
    .rotate()
    .resize({ width: PHOTO_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer({ resolveWithObject: true })
  return { bytes: data, width: info.width, height: info.height }
}

/**
 * Logo: kept as a PNG with transparency, max 512 px. Never recolored, cropped or redrawn (R6);
 * SVG is rasterized here so scripts or external references inside it can never run.
 */
export async function encodeLogo(input: Buffer): Promise<{ bytes: Buffer; width: number; height: number }> {
  const kind = sniffImage(input)
  if (!kind) throw new Error('not an image')
  if (kind === 'svg') {
    const text = input.toString('utf8')
    // Refuse SVGs that try to pull outside files; rasterizing must never fetch anything.
    if (/<!ENTITY|xlink:href\s*=\s*["'](?!#)|href\s*=\s*["'](?!#)(?:https?:|file:|data:)/i.test(text)) throw new Error('svg with external references')
  }
  const { data, info } = await sharp(input, { limitInputPixels: MAX_PIXELS, animated: false, density: kind === 'svg' ? 300 : undefined, failOn: 'error' })
    .resize({ width: LOGO_MAX_SIZE, height: LOGO_MAX_SIZE, fit: 'inside', withoutEnlargement: kind !== 'svg' })
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true })
  return { bytes: data, width: info.width, height: info.height }
}

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex')

/** Download and re-encode up to `max` photos, a few at a time, inside a time budget. Never throws. */
export async function importPhotos(
  candidates: { id: string; src: string; alt: string }[],
  deps: SafeFetchDeps | undefined,
  opts: { max?: number; deadline: number; concurrency?: number },
): Promise<StoredImage[]> {
  const out: StoredImage[] = []
  const queue = candidates.slice(0, 12)
  const worker = async () => {
    while (queue.length && out.length < (opts.max ?? 8) && Date.now() < opts.deadline) {
      const c = queue.shift()!
      try {
        const r = await safeFetch(c.src, { kind: 'image', timeoutMs: Math.max(1000, Math.min(6000, opts.deadline - Date.now())) }, deps)
        const img = await encodePhoto(r.body)
        if (img.width < 320 || img.height < 200) continue // too small to look good on a site
        out.push({
          id: c.id, kind: 'image', bytes: img.bytes, mime: 'image/webp', width: img.width, height: img.height,
          alt: c.alt || 'Photo from the business’s website', sourceUrl: r.url.toString(), sha256: sha(img.bytes),
        })
      } catch { /* skip this photo */ }
    }
  }
  await Promise.all(Array.from({ length: opts.concurrency ?? 4 }, worker))
  // Drop exact duplicates (the same photo linked twice in different sizes still differs; that's fine).
  const seen = new Set<string>()
  return out.filter((i) => (seen.has(i.sha256) ? false : (seen.add(i.sha256), true)))
}

export async function importLogo(url: string, name: string, deps: SafeFetchDeps | undefined, deadline: number): Promise<StoredImage | null> {
  try {
    const r = await safeFetch(url, { kind: 'image', timeoutMs: Math.max(1000, Math.min(6000, deadline - Date.now())) }, deps)
    const img = await encodeLogo(r.body)
    return {
      id: randomUUID(), kind: 'logo', bytes: img.bytes, mime: 'image/png', width: img.width, height: img.height,
      alt: `${name} logo`.slice(0, 120), sourceUrl: r.url.toString(), sha256: sha(img.bytes),
    }
  } catch {
    return null
  }
}

/** An owner-uploaded logo from /new (PNG/JPG/SVG ≤ 2 MB, spec 5.3). */
export async function logoFromUpload(file: Buffer, name: string): Promise<StoredImage | null> {
  if (file.length === 0 || file.length > 2 * 1024 * 1024) return null
  const kind = sniffImage(file)
  if (kind !== 'png' && kind !== 'jpeg' && kind !== 'svg') return null
  try {
    const img = await encodeLogo(file)
    return {
      id: randomUUID(), kind: 'logo', bytes: img.bytes, mime: 'image/png', width: img.width, height: img.height,
      alt: `${name} logo`.slice(0, 120), sourceUrl: '', sha256: sha(img.bytes),
    }
  } catch {
    return null
  }
}
