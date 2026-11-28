import sharp from 'sharp'

/**
 * Test images made at test time (nothing binary is committed): a photo-like picture and the kinds
 * of bad image the D4 filter and image check must reject.
 */
let seed = 7
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }

/** A photo-like image: smooth colour fields, soft shapes and fine grain, like a real scene. */
export async function photoLike(width = 1600, height = 1000, hue = 20): Promise<Buffer> {
  const blobs = Array.from({ length: 28 }, () => {
    const cx = rand() * width, cy = rand() * height, r = (0.05 + rand() * 0.25) * width
    const h = (hue + rand() * 60) % 360, l = 25 + rand() * 45
    return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="hsl(${h.toFixed(0)},${(45 + rand() * 40).toFixed(0)}%,${l.toFixed(0)}%)" opacity="${(0.35 + rand() * 0.5).toFixed(2)}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},55%,30%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},50%,55%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>${blobs}</svg>`
  const base = await sharp(Buffer.from(svg)).blur(0.5).png().toBuffer()
  const grain = await sharp({ create: { width, height, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 40 } } }).png().toBuffer()
  return sharp(base).composite([{ input: grain, blend: 'soft-light' }]).jpeg({ quality: 88 }).toBuffer()
}

export const blurry = async () => sharp(await photoLike(1600, 1000, 200)).blur(18).jpeg({ quality: 85 }).toBuffer()
export const small = async () => photoLike(900, 560, 120)
export const tooTiny = async () => photoLike(300, 180, 90)

/** A screenshot: white page, coloured header bar, many lines of "text" (thin dark bars). */
export async function screenshot(width = 1440, height = 900): Promise<Buffer> {
  const lines = Array.from({ length: 34 }, (_, i) => {
    const y = 120 + i * 22, w = 300 + Math.round(rand() * 900)
    return `<rect x="60" y="${y}" width="${w}" height="9" fill="#222"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#fff"/><rect width="100%" height="64" fill="#1d4ed8"/>${lines}</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

/** A flat graphic: one colour field with a big circle (a logo-like badge). */
export async function flatGraphic(width = 1400, height = 900): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#f59e0b"/><circle cx="700" cy="450" r="300" fill="#7c2d12"/></svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

/** The same picture again, smaller and re-compressed (a near-duplicate). */
export const nearDuplicate = async (of: Buffer) => sharp(of).resize({ width: 1280 }).jpeg({ quality: 70 }).toBuffer()

/** Blown out: most of the frame pushed to white. */
export const blownOut = async () => sharp(await photoLike(1600, 1000, 40)).linear(2.6, 40).jpeg({ quality: 88 }).toBuffer()
