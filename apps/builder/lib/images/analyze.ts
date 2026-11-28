import sharp from 'sharp'

/**
 * Pixel measurements of one image (design D4): what the quality filter and the automatic image
 * check decide on. Pure (no network, no storage), deterministic, a few milliseconds per image:
 * everything is measured on small grayscale copies.
 */
export type ImageStats = {
  width: number
  height: number
  /** Shannon entropy of the grayscale histogram, 0 (one flat colour) to 8. Flat graphics are low. */
  entropy: number
  /** Variance of the Laplacian on a 256-wide copy: how sharp edges are. Blurry photos are low. */
  sharpness: number
  /** Share of pixels whose 3x3 neighbourhood is perfectly flat. Screenshots and graphics are high. */
  flatShare: number
  /** Share of pixels on a strong edge. Text and UI are high. */
  edgeShare: number
  /** Share of pixels in the two most common grey levels (text on a plain background is high). */
  twoToneShare: number
  /** Share of pixels at or near pure white (blown highlights). */
  clippedShare: number
  /** Average saturation, 0 to 1. */
  colourfulness: number
  /** 64-bit difference hash, as 16 hex characters (near-duplicate detection). */
  dhash: string
}

const MAX_PIXELS = 40_000_000

async function gray(input: Buffer, width: number, height?: number): Promise<{ data: Buffer; w: number; h: number }> {
  const { data, info } = await sharp(input, { limitInputPixels: MAX_PIXELS, failOn: 'error' })
    .rotate()
    .resize({ width, height, fit: height ? 'fill' : 'inside' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

export async function analyzeImage(input: Buffer): Promise<ImageStats> {
  const meta = await sharp(input, { limitInputPixels: MAX_PIXELS, failOn: 'error' }).metadata()
  const width = meta.autoOrient?.width ?? meta.width ?? 0
  const height = meta.autoOrient?.height ?? meta.height ?? 0

  // Histogram, flatness, edges and two-tone share on a 128-wide copy.
  const g = await gray(input, 128)
  const n = g.w * g.h
  const hist = new Array<number>(256).fill(0)
  for (let i = 0; i < n; i++) hist[g.data[i]]++
  let entropy = 0
  for (const c of hist) if (c) { const p = c / n; entropy -= p * Math.log2(p) }
  const sorted = [...hist].sort((a, b) => b - a)
  const twoToneShare = (sorted[0] + sorted[1]) / n
  let clipped = 0
  for (let v = 250; v < 256; v++) clipped += hist[v]

  let flat = 0, edges = 0, inner = 0
  const at = (x: number, y: number) => g.data[y * g.w + x]
  for (let y = 1; y < g.h - 1; y++) for (let x = 1; x < g.w - 1; x++) {
    inner++
    const c = at(x, y)
    let same = true
    for (let dy = -1; dy <= 1 && same; dy++) for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy) !== c) { same = false; break }
    if (same) flat++
    const gx = at(x + 1, y) - at(x - 1, y), gy = at(x, y + 1) - at(x, y - 1)
    if (Math.abs(gx) + Math.abs(gy) > 96) edges++
  }

  // Sharpness: variance of a 4-neighbour Laplacian on a 256-wide copy.
  const s = await gray(input, 256)
  let sum = 0, sumSq = 0, m = 0
  const sat = (x: number, y: number) => s.data[y * s.w + x]
  for (let y = 1; y < s.h - 1; y++) for (let x = 1; x < s.w - 1; x++) {
    const l = sat(x - 1, y) + sat(x + 1, y) + sat(x, y - 1) + sat(x, y + 1) - 4 * sat(x, y)
    sum += l; sumSq += l * l; m++
  }
  const sharpness = m ? sumSq / m - (sum / m) ** 2 : 0

  // Colourfulness: mean HSV saturation on a 64-wide colour copy.
  const { data: rgb, info } = await sharp(input, { limitInputPixels: MAX_PIXELS }).rotate().resize({ width: 64, fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let satSum = 0
  const px = info.width * info.height
  for (let i = 0; i < px; i++) {
    const r = rgb[i * 3], gg = rgb[i * 3 + 1], b = rgb[i * 3 + 2]
    const max = Math.max(r, gg, b), min = Math.min(r, gg, b)
    satSum += max === 0 ? 0 : (max - min) / max
  }

  return {
    width, height, entropy, sharpness,
    flatShare: inner ? flat / inner : 0, edgeShare: inner ? edges / inner : 0,
    twoToneShare, clippedShare: clipped / n, colourfulness: px ? satSum / px : 0,
    dhash: await dhash(input),
  }
}

/** 64-bit difference hash: each bit says whether a pixel is brighter than its right neighbour (9x8 grid). */
export async function dhash(input: Buffer): Promise<string> {
  const g = await gray(input, 9, 8)
  let bits = ''
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += g.data[y * 9 + x] > g.data[y * 9 + x + 1] ? '1' : '0'
  let hex = ''
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16)
  return hex
}

/** Number of differing bits between two dhashes (0 = the same picture; up to about 8 = a near-duplicate). */
export function hamming(a: string, b: string): number {
  let d = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16)
    while (x) { d += x & 1; x >>= 1 }
  }
  return d
}

export const NEAR_DUPLICATE_BITS = 8

/** Thresholds, tuned on the generated fixtures in tests/unit/image-quality.test.ts and real kit photos. */
export const LIMITS = {
  heroMinWidth: 1200,
  minWidth: 320,
  minHeight: 200,
  flatEntropy: 4.2,
  // Real photos measure about 1000 to 2500; a soft but usable photo about 100. Heavy blur is under 20.
  blurSharpness: 30,
  screenshotFlatShare: 0.25,
  // Real photos have plenty of edges but almost no two-tone area (2 to 4%); text on a plain page has both.
  textEdgeShare: 0.05,
  textTwoToneShare: 0.4,
  clippedShare: 0.2,
} as const

export type ImageProblem = 'too_small' | 'flat_graphic' | 'screenshot' | 'text_heavy' | 'blurry' | 'blown_highlights' | 'duplicate'

/** Problems any photo on a site must not have (resolution for hero use is checked separately). */
export function pixelProblems(st: ImageStats): ImageProblem[] {
  const out: ImageProblem[] = []
  if (st.width < LIMITS.minWidth || st.height < LIMITS.minHeight) out.push('too_small')
  if (st.entropy < LIMITS.flatEntropy) out.push('flat_graphic')
  const texty = st.edgeShare > LIMITS.textEdgeShare && st.twoToneShare > LIMITS.textTwoToneShare
  if (st.flatShare > LIMITS.screenshotFlatShare || texty) out.push('screenshot')
  if (texty) out.push('text_heavy')
  if (st.sharpness < LIMITS.blurSharpness && !out.includes('flat_graphic')) out.push('blurry')
  if (st.clippedShare > LIMITS.clippedShare) out.push('blown_highlights')
  return out
}

/** 0 to 1: how good a photo this is for a site (resolution, detail, sharpness, colour). */
export function photoScore(st: ImageStats): number {
  const res = Math.min(1, st.width / 1600)
  const detail = Math.min(1, st.entropy / 7.5)
  const sharp = Math.min(1, Math.log10(1 + st.sharpness) / 3)
  const colour = Math.min(1, st.colourfulness / 0.45)
  return Math.round((0.35 * res + 0.25 * detail + 0.25 * sharp + 0.15 * colour) * 1000) / 1000
}
