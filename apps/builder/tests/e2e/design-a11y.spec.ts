import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { DESIGN_FIXTURES, fixtureUrl } from './design-fixtures'

/**
 * Accessibility (D1 quality harness): axe on every design fixture page, published and draft
 * preview, at the project width (390 and 1280). Zero serious or critical violations allowed.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Needs the local test-mode server')

/**
 * Baseline found by the first run (2026-11-27), each owned by a later D1 step that must remove it:
 * - draft preview placeholder hints (.ys-hint) are too faint: step 5 stops showing them on the site.
 * (Cleared: schedule days with no stop were too faint; fixed by step 3's surface-aware muted color.)
 * Anything else serious or critical fails now.
 */
const BASELINE: { rule: string; target: RegExp; owner: string }[] = [
  { rule: 'color-contrast', target: /\.ys-hint\b/, owner: 'D1 step 5' },
]
const inBaseline = (rule: string, target: string) => BASELINE.some((b) => b.rule === rule && b.target.test(target))

for (const f of DESIGN_FIXTURES) {
  test(`axe: ${f.name}`, async ({ page }) => {
    test.setTimeout(120_000)
    const found: string[] = []
    for (const mode of ['live', 'draft'] as const) {
      for (const slug of mode === 'live' ? f.slugs : ['']) {
        await page.goto(fixtureUrl(f.name, slug, mode))
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
        for (const v of r.violations) if (v.impact === 'serious' || v.impact === 'critical') {
          const targets = v.nodes.map((n) => n.target.join(' ')).filter((t) => !inBaseline(v.id, t))
          if (targets.length) found.push(`${slug || 'home'} (${mode}) ${v.impact} ${v.id}: ${targets.slice(0, 3).join(' | ')}`)
        }
      }
    }
    expect(found, found.join('\n')).toEqual([])
  })
}
