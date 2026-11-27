/**
 * Theme tokens (spec 7.3). Brand colors are injected exactly as stored (R6). Text colors that sit
 * on a brand color are chosen for WCAG AA contrast; when a brand color is hard to read on the page
 * background, the renderer uses ink for text instead of altering the brand color.
 */
import type { Brand, FontPair } from '@yakini/site-schema'

export const INK = '#16130F'
export const PAPER = '#FFFFFF'
export const PAGE_BG = '#FBF9F6'

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** Relative luminance of a 6-digit hex color (WCAG 2.x). */
export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error('Expected a 6-digit hex color')
  const n = parseInt(m[1], 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

/** WCAG contrast ratio between two colors, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Black-ish or white text, whichever reads better on `bg`. */
export function readableInk(bg: string): string {
  return contrastRatio(bg, INK) >= contrastRatio(bg, PAPER) ? INK : PAPER
}

/** WCAG AA for normal text. */
export const AA = 4.5

export type FontStack = { display: string; body: string; displayWeight: number; displayTracking: string }

export const FONT_STACKS: Record<FontPair, FontStack> = {
  editorial: { display: "'Fraunces Variable', Georgia, 'Times New Roman', serif", body: "'Source Sans 3 Variable', ui-sans-serif, system-ui, sans-serif", displayWeight: 600, displayTracking: '-0.01em' },
  modern: { display: "'Inter Variable', ui-sans-serif, system-ui, sans-serif", body: "'Inter Variable', ui-sans-serif, system-ui, sans-serif", displayWeight: 750, displayTracking: '-0.025em' },
  friendly: { display: "'Nunito Variable', ui-rounded, ui-sans-serif, system-ui, sans-serif", body: "'Nunito Variable', ui-rounded, ui-sans-serif, system-ui, sans-serif", displayWeight: 850, displayTracking: '-0.01em' },
  classic: { display: "'Playfair Display Variable', Georgia, 'Times New Roman', serif", body: "'Lora Variable', Georgia, 'Times New Roman', serif", displayWeight: 650, displayTracking: '0' },
  signature: { display: "'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, 'Times New Roman', serif", body: "'Inter Variable', ui-sans-serif, system-ui, sans-serif", displayWeight: 500, displayTracking: '-0.02em' },
}

export type ThemeReport = {
  vars: Record<string, string>
  /** Brand colors that cannot be used as text on the page background (shown to the owner, spec 7.3). */
  lowContrast: ('primary' | 'secondary' | 'accent')[]
}

/**
 * CSS custom properties for a site. The `--ys-primary/secondary/accent` values are the stored hex
 * strings, byte for byte. Everything else is computed beside them.
 */
export function themeFor(brand: Brand, fontPair: FontPair = brand.fontPair): ThemeReport {
  const { primary, secondary, accent } = brand.colors
  const font = FONT_STACKS[fontPair]
  const lowContrast: ThemeReport['lowContrast'] = []
  const textOn = (name: 'primary' | 'secondary' | 'accent', c: string) => {
    if (contrastRatio(c, PAGE_BG) >= AA) return c
    lowContrast.push(name)
    return INK
  }
  const vars: Record<string, string> = {
    '--ys-primary': primary,
    '--ys-secondary': secondary,
    '--ys-accent': accent,
    '--ys-on-primary': readableInk(primary),
    '--ys-on-secondary': readableInk(secondary),
    '--ys-on-accent': readableInk(accent),
    '--ys-primary-text': textOn('primary', primary),
    '--ys-secondary-text': textOn('secondary', secondary),
    '--ys-accent-text': textOn('accent', accent),
    '--ys-bg': PAGE_BG,
    '--ys-ink': INK,
    '--ys-font-display': font.display,
    '--ys-font-body': font.body,
    '--ys-display-weight': String(font.displayWeight),
    '--ys-display-tracking': font.displayTracking,
  }
  return { vars, lowContrast }
}
