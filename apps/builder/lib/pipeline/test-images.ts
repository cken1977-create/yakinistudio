import { createHash } from 'node:crypto'
import sharp from 'sharp'
import type { ImageProvider, ImageRequest, VisionChecker, VisionFlag, VisionResult } from '@yakini/ai'

/**
 * Test-mode image providers (design D4): no network, no cost. The image provider draws a
 * photo-like picture for each prompt (colours and shapes seeded by the prompt, so every shot is
 * different and the same shot is the same picture). The vision checker can't see faces or text, so
 * tests tell it what an image contains (`label`); anything unlabelled passes with a good score.
 */
const SIZES: Record<ImageRequest['aspect'], Record<ImageRequest['size'], [number, number]>> = {
  '16:9': { '1k': [1024, 576], '2k': [2048, 1152] },
  '4:5': { '1k': [819, 1024], '2k': [1638, 2048] },
  '3:2': { '1k': [1024, 683], '2k': [2048, 1365] },
  '1:1': { '1k': [1024, 1024], '2k': [2048, 2048] },
}

export async function drawPhoto(prompt: string, width: number, height: number): Promise<Buffer> {
  const seed = createHash('sha256').update(prompt).digest()
  let i = 0
  const r = () => seed[i++ % seed.length] / 255
  const hue = Math.round(r() * 360)
  const blobs = Array.from({ length: 24 }, () => {
    const cx = r() * width, cy = r() * height, rad = (0.05 + r() * 0.3) * width
    return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="hsl(${(hue + r() * 80).toFixed(0)},${(40 + r() * 45).toFixed(0)}%,${(22 + r() * 48).toFixed(0)}%)" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},55%,26%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360},50%,58%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>${blobs}</svg>`
  const base = await sharp(Buffer.from(svg)).blur(0.5).png().toBuffer()
  const grain = await sharp({ create: { width, height, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 40 } } }).png().toBuffer()
  return sharp(base).composite([{ input: grain, blend: 'soft-light' }]).jpeg({ quality: 88 }).toBuffer()
}

export function testImageProvider(o: { priceUsd?: number; failPrompts?: RegExp } = {}): ImageProvider & { calls: number } {
  const p = {
    provider: 'test', model: 'test-image', calls: 0,
    priceUsd: () => o.priceUsd ?? 0,
    async generate(req: ImageRequest) {
      p.calls++
      if (o.failPrompts?.test(req.prompt)) throw new Error('test provider: refused')
      const [w, h] = SIZES[req.aspect][req.size]
      return { bytes: await drawPhoto(`${req.prompt}#${p.calls}`, w, h), mime: 'image/jpeg' as const, model: 'test-image', provider: 'test' }
    },
  }
  return p
}

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex')

export function testVisionChecker(o: { priceUsd?: number } = {}): VisionChecker & { label: (bytes: Buffer, r: Partial<VisionResult> & { flags?: VisionFlag[] }) => void; calls: number } {
  const labels = new Map<string, VisionResult>()
  const c = {
    model: 'test-vision', calls: 0,
    priceUsd: () => o.priceUsd ?? 0,
    label(bytes: Buffer, r: Partial<VisionResult>) { labels.set(sha(bytes), { score: r.score ?? 0.9, flags: r.flags ?? [] }) },
    async check(i: { bytes: Buffer }) { c.calls++; return labels.get(sha(i.bytes)) ?? { score: 0.9, flags: [] } },
  }
  return c
}
