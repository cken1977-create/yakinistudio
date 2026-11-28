import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { DESIGN_FIXTURES, V1_FIXTURES, V2_FIXTURES, fixtureUrl } from './design-fixtures'

/**
 * Design gallery (D1 quality harness): every design fixture, every page, published mode, plus the
 * home page in draft preview, at 390, 1280 and 1440 wide, full page. Screenshots go to
 * $GALLERY_DIR/<label>/... (label = $GALLERY_LABEL, e.g. "before" / "after"); CI uploads the folder
 * as the "design-gallery" artifact. Nothing binary is committed.
 *
 * Opt-in (it takes a few minutes): DESIGN_GALLERY=1. Runs once, in the phone project, and sets both
 * widths itself.
 */
test.skip(!process.env.DESIGN_GALLERY, 'Set DESIGN_GALLERY=1 to render the design gallery')
test.skip(!!process.env.E2E_BASE_URL, 'The design gallery needs the local test-mode server')

const OUT = join(process.env.GALLERY_DIR || join(process.cwd(), 'design-gallery'), process.env.GALLERY_LABEL || 'current')
const WIDTHS = [390, 1280, 1440] as const
// GALLERY_SET=v1 renders only the v1 fixtures (the pixel-identity check); GALLERY_V1=1 adds them to the design set.
const set = process.env.GALLERY_SET === 'v1' ? V1_FIXTURES : process.env.GALLERY_V1 ? [...DESIGN_FIXTURES, ...V2_FIXTURES, ...V1_FIXTURES] : [...DESIGN_FIXTURES, ...V2_FIXTURES]

for (const f of set) {
  test(`gallery: ${f.name}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone-390', 'Runs once; sets its own widths')
    test.setTimeout(180_000)
    mkdirSync(join(OUT, f.name), { recursive: true })
    const shots: { slug: string; mode: 'live' | 'draft' }[] = [...f.slugs.map((slug) => ({ slug, mode: 'live' as const })), { slug: '', mode: 'draft' }]
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 })
      for (const s of shots) {
        const res = await page.goto(fixtureUrl(f.name, s.slug, s.mode))
        expect(res?.status(), `${f.name}/${s.slug} ${s.mode}`).toBe(200)
        await page.evaluate(() => document.fonts.ready)
        const shot = join(OUT, f.name, `${s.slug || 'home'}-${s.mode}-${w}.png`)
        // Full-page capture sometimes fails in CI with "Unable to capture screenshot" even though the
        // page loaded. Retry the same shot before failing the gallery.
        let captured = false
        let last: unknown
        for (let attempt = 0; attempt < 3 && !captured; attempt++) {
          try {
            // CSS pixels, so the file is 390, 1280, or 1440 wide. The phone project is a 3x device,
            // and a full-page shot at that scale is taller than Chrome can capture.
            await page.screenshot({ path: shot, fullPage: true, animations: 'disabled', scale: 'css' })
            captured = true
          } catch (e) {
            last = e
            await page.waitForTimeout(400)
          }
        }
        if (!captured) throw last
      }
    }
  })
}
