import sharp from 'sharp'

/**
 * Image variants (design D4): every photo a site shows is served as AVIF and WebP at 640, 1024,
 * 1600 and 2400 px wide (never larger than the source), with a tiny blurred placeholder inlined
 * under it so nothing pops in, its focus point (sharp's attention strategy) for object-position and
 * the phone crop, and explicit width and height everywhere (CLS 0).
 *
 * The look's colour grade is not baked into the files: it is a CSS filter per look (presets/*.css,
 * `.ys-graded`), so it follows a look change at once, costs no bytes, and never touches brand colours.
 */
export const VARIANT_WIDTHS = [640, 1024, 1600, 2400] as const
export type VariantFormat = 'avif' | 'webp'
export type Variant = { format: VariantFormat; width: number; height: number; crop: 'full' | 'tall'; bytes: Buffer }
export type ImageVariants = { width: number; height: number; focus: { x: number; y: number }; lqip: string; variants: Variant[] }

const MAX_PIXELS = 40_000_000

/** Where the interesting part of the photo is (0..1 each way), from sharp's attention strategy. */
export async function focusPoint(input: Buffer): Promise<{ x: number; y: number }> {
  const meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).rotate().metadata()
  const w = meta.autoOrient?.width ?? meta.width ?? 1, h = meta.autoOrient?.height ?? meta.height ?? 1
  // Crop a square of the short side with the attention strategy; its centre is the focus.
  const side = Math.min(w, h)
  const { info } = await sharp(input, { limitInputPixels: MAX_PIXELS }).rotate()
    .resize({ width: side, height: side, fit: 'cover', position: sharp.strategy.attention })
    .raw().toBuffer({ resolveWithObject: true })
  const left = -(info.cropOffsetLeft ?? 0), top = -(info.cropOffsetTop ?? 0)
  const round = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000
  return { x: round((left + side / 2) / w), y: round((top + side / 2) / h) }
}

/** A 24 px wide blurred WebP as a data URI (well under 1 KB): shown under the photo while it loads. */
export async function lqip(input: Buffer): Promise<string> {
  const b = await sharp(input, { limitInputPixels: MAX_PIXELS }).rotate().resize({ width: 24 }).blur(1.2).webp({ quality: 40 }).toBuffer()
  return `data:image/webp;base64,${b.toString('base64')}`
}

/** A 4:5 crop around the focus point, for hero photos on phones (art direction). */
async function tallCrop(input: Buffer, w: number, h: number, focus: { x: number; y: number }): Promise<Buffer> {
  const cw = Math.min(w, Math.round((h * 4) / 5)), ch = Math.min(h, Math.round((cw * 5) / 4))
  const left = Math.round(Math.max(0, Math.min(w - cw, focus.x * w - cw / 2)))
  const top = Math.round(Math.max(0, Math.min(h - ch, focus.y * h - ch / 2)))
  return sharp(input, { limitInputPixels: MAX_PIXELS }).extract({ left, top, width: cw, height: ch }).png().toBuffer()
}

export async function makeVariants(input: Buffer, o: { tall?: boolean; widths?: readonly number[] } = {}): Promise<ImageVariants> {
  const src = await sharp(input, { limitInputPixels: MAX_PIXELS, failOn: 'error' }).rotate().removeAlpha().png().toBuffer()
  const meta = await sharp(src).metadata()
  const width = meta.width!, height = meta.height!
  const focus = await focusPoint(src)
  const variants: Variant[] = []
  const encode = async (buf: Buffer, crop: Variant['crop'], srcW: number, srcH: number) => {
    const ws = [...new Set((o.widths ?? VARIANT_WIDTHS).map((w) => Math.min(w, srcW)))].sort((a, b) => a - b)
    for (const w of ws) {
      const resized = sharp(buf).resize({ width: w, withoutEnlargement: true })
      const h = Math.round((srcH * w) / srcW)
      variants.push({ format: 'avif', width: w, height: h, crop, bytes: await resized.clone().avif({ quality: 50, effort: 1 }).toBuffer() }) // effort 1: ~10x faster than 4, ~7% larger
      variants.push({ format: 'webp', width: w, height: h, crop, bytes: await resized.clone().webp({ quality: 74, effort: 4 }).toBuffer() })
    }
  }
  await encode(src, 'full', width, height)
  if (o.tall && width > height) {
    const t = await tallCrop(src, width, height, focus)
    const tm = await sharp(t).metadata()
    await encode(t, 'tall', tm.width!, tm.height!)
  }
  return { width, height, focus, lqip: await lqip(src), variants }
}
