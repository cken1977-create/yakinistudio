import type { Migration } from './index'

/**
 * v1 → v2 (design v2, plan 6.1 / spec 7.4). Pure: no I/O, no clock, input never mutated.
 *
 * - Adds `style` with the `classic` preset and the doc's own font pair, so every v1 site renders
 *   exactly as before.
 * - v1 had no accent marker, so an asterisk in a headline or heading was literal text. v2 reads
 *   `*phrase*` as an accent, so those asterisks become U+2217 (∗), which looks the same and stays
 *   literal.
 */
const HEADLINE_KEYS = new Set(['headline', 'heading'])

function keepAsterisksLiteral(props: unknown): unknown {
  if (!props || typeof props !== 'object' || Array.isArray(props)) return props
  return Object.fromEntries(Object.entries(props as Record<string, unknown>).map(([k, v]) =>
    [k, HEADLINE_KEYS.has(k) && typeof v === 'string' ? v.replace(/\*/g, '∗') : v]))
}

export const v1ToV2: Migration = {
  from: 1,
  to: 2,
  up(doc) {
    const brand = (doc.brand ?? {}) as { fontPair?: unknown }
    const pages = Array.isArray(doc.pages) ? doc.pages : []
    return {
      ...structuredClone(doc),
      schemaVersion: 2,
      pages: pages.map((p) => {
        const page = structuredClone(p) as Record<string, unknown>
        const sections = Array.isArray(page.sections) ? page.sections : []
        return { ...page, sections: sections.map((s) => (s && typeof s === 'object' ? { ...(s as Record<string, unknown>), props: keepAsterisksLiteral((s as Record<string, unknown>).props) } : s)) }
      }),
      style: { preset: 'classic', surface: 'light', fontPair: brand.fontPair, radius: 'round', motion: 'off' },
    }
  },
}
