/**
 * Design D4: writes packages/kits/src/sample-imagery.json, the tiny blurred placeholder and focus
 * point of every kit sample photo (text, committed). Run by hand after adding or changing a sample:
 *   npx tsx scripts/kit-sample-imagery.ts
 * A unit test fails when a sample photo has no entry.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { BUILDER_KITS } from '@yakini/kits'
import { focusPoint, lqip } from '../lib/images/variants'

async function main() {
const out: Record<string, { lqip: string; focus: { x: number; y: number } }> = {}
for (const kit of Object.values(BUILDER_KITS)) for (const s of kit.sampleImages) {
  if (!s.webp) continue // drawn (SVG) samples need neither
  const bytes = readFileSync(join(__dirname, '..', 'public', s.storagePath))
  out[s.assetId] = { lqip: await lqip(bytes), focus: await focusPoint(bytes) }
}
const file = join(__dirname, '..', '..', '..', 'packages', 'kits', 'src', 'sample-imagery.json')
writeFileSync(file, `${JSON.stringify(Object.fromEntries(Object.entries(out).sort()), null, 1)}\n`)
console.log(`wrote ${Object.keys(out).length} entries to ${file}`)
}
void main()
