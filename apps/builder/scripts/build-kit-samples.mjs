#!/usr/bin/env node
/**
 * Design D4: AVIF copies of the kit sample photos, made at build time (never committed).
 *
 * The kit samples ship as a JPEG plus WebP copies (public/kit-samples/<kit>/). Pages offer AVIF first
 * (smaller at the same look), so this writes, for every sample JPEG, AVIF files at the same widths as
 * the WebP copies:
 *   public/_kit-samples/<kit>/<key>-<width>.avif     (640, 800, 960, 1280)
 * Runs with build:site (before `build`, `dev` and the browser tests). A file newer than its JPEG is
 * kept, so a second run does nothing. The placeholders and focus points are text, committed in
 * packages/kits/src/sample-imagery.json (scripts/kit-sample-imagery.ts writes them).
 */
import { mkdirSync, readdirSync, statSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const app = resolve(here, '..')
const require = createRequire(join(app, 'package.json'))
const sharp = require('sharp')
const SRC = join(app, 'public', 'kit-samples')
const OUT = join(app, 'public', '_kit-samples')
export const SAMPLE_AVIF_WIDTHS = [640, 800, 960, 1280] // keep in step with packages/kits SAMPLE_AVIF_WIDTHS

const fresh = (out, src) => { try { return statSync(out).mtimeMs >= statSync(src).mtimeMs } catch { return false } }

const jobs = []
for (const kit of readdirSync(SRC)) {
  const dir = join(SRC, kit)
  if (!statSync(dir).isDirectory()) continue
  mkdirSync(join(OUT, kit), { recursive: true })
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.jpg'))) {
    const key = f.slice(0, -4)
    const src = join(dir, f)
    for (const w of SAMPLE_AVIF_WIDTHS) {
      const out = join(OUT, kit, `${key}-${w}.avif`)
      if (!fresh(out, src)) jobs.push(() => sharp(src).resize({ width: w, withoutEnlargement: true }).avif({ quality: 52, effort: 1 }).toFile(out))
    }
  }
}
// One encode per core at a time (each AVIF encode is mostly single-threaded).
const workers = Math.max(1, Math.min(8, availableParallelism()))
let next = 0
await Promise.all(Array.from({ length: workers }, async () => { while (next < jobs.length) await jobs[next++]() }))
console.log(`kit samples: ${jobs.length} AVIF file(s) made`)
