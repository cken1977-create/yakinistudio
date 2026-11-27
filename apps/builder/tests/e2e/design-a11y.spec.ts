import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { DESIGN_FIXTURES, V2_FIXTURES, fixtureUrl } from './design-fixtures'

/**
 * Accessibility (D1 quality harness): axe on every design fixture page, published and draft
 * preview, at the project width (390 and 1280). Zero serious or critical violations allowed, and no
 * page may scroll sideways.
 */
test.skip(!!process.env.E2E_BASE_URL, 'Needs the local test-mode server')

/**
 * Baseline found by the first run (2026-11-27), each owned by a later D1 step that must remove it:
 * - (cleared in step 5: draft preview placeholder hints, which no longer appear outside the editor)
 * - schedule days with no stop (.is-off .ys-muted) are too faint in the CLASSIC look only. Classic
 *   must stay byte for byte (plan 7.4), so it clears when those kits move to a v2 preset (D3).
 *   Signature fixes it (checked: no Signature page may hit it, see below).
 * Anything else serious or critical fails now.
 */
const BASELINE: { rule: string; target: RegExp; owner: string }[] = [
  { rule: 'color-contrast', target: /\.is-off\b.*\.ys-muted\b/, owner: 'D3 (classic kits move to a v2 preset)' },
]
const inBaseline = (rule: string, target: string, preset: string) =>
  BASELINE.some((b) => b.rule === rule && b.target.test(target) && (b.owner.startsWith('D3') ? preset === 'classic' : true))

for (const f of [...DESIGN_FIXTURES, ...V2_FIXTURES]) {
  test(`axe: ${f.name}`, async ({ page }) => {
    test.setTimeout(120_000)
    const found: string[] = []
    for (const mode of ['live', 'draft'] as const) {
      for (const slug of mode === 'live' ? f.slugs : ['']) {
        await page.goto(fixtureUrl(f.name, slug, mode))
        const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        if (sideways > 0) found.push(`${slug || 'home'} (${mode}) scrolls sideways by ${sideways}px`)
        const preset = (await page.locator('.ys-site').getAttribute('data-preset')) ?? 'classic'
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
        for (const v of r.violations) if (v.impact === 'serious' || v.impact === 'critical') {
          const targets = v.nodes.map((n) => n.target.join(' ')).filter((t) => !inBaseline(v.id, t, preset))
          if (targets.length) found.push(`${slug || 'home'} (${mode}) ${v.impact} ${v.id}: ${targets.slice(0, 3).join(' | ')}`)
        }
      }
    }
    expect(found, found.join('\n')).toEqual([])
  })
}
