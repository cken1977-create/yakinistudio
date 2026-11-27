import { describe, expect, it } from 'vitest'
import { COLOR_PRESETS, BUILDER_KITS } from '@yakini/kits'
import type { Brand } from '@yakini/site-schema'
import { AA, AA_LARGE, contrastRatio, surfaceTheme, themeFor } from './index'

/**
 * Surface-aware contrast (plan 6.3): every color preset, and every kit's default palette, on both
 * surfaces. All text roles pass 4.5:1 and display roles 3:1 on surfaces 0 to 2 (page, glass card,
 * raised card); brand colors are used as stored or replaced by ink, never altered (R6).
 */
const palettes = [
  ...COLOR_PRESETS.map((p) => ({ name: `preset ${p.id}`, colors: p.colors })),
  ...Object.values(BUILDER_KITS).map((k) => ({ name: `kit ${k!.id}`, colors: k!.defaultPalette })),
]
const brand = (colors: Brand['colors']): Brand => ({ colors, colorsSource: 'owner', fontPair: 'signature' })

describe.each(palettes)('$name', ({ colors }) => {
  for (const surface of ['dark', 'light'] as const) {
    it(`${surface} surface: text >= 4.5:1, display >= 3:1, brand hex untouched`, () => {
      const st = surfaceTheme(brand(colors), surface)
      if (surface === 'dark') expect(st.base).toBe(colors.secondary) // the stored Dark color, as is
      const grounds = st.steps.slice(0, 3)
      const roles = { ink: st.ink, muted: st.muted, ...Object.fromEntries(Object.entries(st.text).map(([k, v]) => [`${k} text`, v])) }
      for (const [role, c] of Object.entries(roles)) for (const g of grounds) expect(contrastRatio(c, g), `${role} ${c} on ${g}`).toBeGreaterThanOrEqual(AA)
      for (const [role, c] of Object.entries(st.display)) for (const g of grounds) expect(contrastRatio(c, g), `${role} display ${c} on ${g}`).toBeGreaterThanOrEqual(AA_LARGE)
      for (const r of ['primary', 'secondary', 'accent'] as const) {
        expect([colors[r], st.ink]).toContain(st.text[r])
        expect(st.lowContrast.includes(r)).toBe(st.text[r] !== colors[r])
      }
    })
  }
  it('Signature vars carry the stored hex values byte for byte; classic vars are unchanged', () => {
    const b = brand(colors)
    const sig = themeFor(b, 'signature', { preset: 'signature', surface: 'dark' }).vars
    for (const r of ['primary', 'secondary', 'accent'] as const) expect(sig[`--ys-${r}`]).toBe(colors[r])
    expect(themeFor(b, 'signature', { preset: 'classic', surface: 'light' })).toEqual(themeFor(b, 'signature'))
  })
})
