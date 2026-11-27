/**
 * Theme tokens (spec 7.3). Brand colors are injected exactly as stored (R6). Text colors that sit
 * on a brand color are chosen for WCAG AA contrast; when a brand color is hard to read on the page
 * background, the renderer uses ink for text instead of altering the brand color.
 */
import type { Brand, FontPair, Style } from '@yakini/site-schema'

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
  signature: { display: "'Cormorant Garamond Variable', 'Cormorant Fallback', Georgia, 'Times New Roman', serif", body: "'Inter Variable', 'Inter Fallback', ui-sans-serif, system-ui, sans-serif", displayWeight: 500, displayTracking: '-0.02em' },
}

export type ThemeReport = {
  vars: Record<string, string>
  /** Brand colors that cannot be used as text on the page background (shown to the owner, spec 7.3). */
  lowContrast: ('primary' | 'secondary' | 'accent')[]
}

/** WCAG large-text threshold: display text (24px and up). */
export const AA_LARGE = 3

const hexToRgb = (hex: string) => { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const rgbToHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('').toUpperCase()}`
/** `t` of `b` mixed into `a`, in sRGB (what CSS color-mix(in srgb) does). */
export function mixHex(a: string, b: string, t: number): string {
  const [x, y] = [hexToRgb(a), hexToRgb(b)]
  return rgbToHex(x.map((c, i) => c + (y[i] - c) * t))
}

/** Readable ink for a surface: the studio's ink or paper, or pure black or white when those fall short. */
export function onSurfaceInk(surface: string): string {
  const best = readableInk(surface)
  if (contrastRatio(surface, best) >= AA) return best
  return contrastRatio(surface, '#000000') >= contrastRatio(surface, '#FFFFFF') ? '#000000' : '#FFFFFF'
}

export type SurfaceTheme = {
  /** Page ground: brand secondary exactly as stored (dark) or the light page color. */
  base: string
  /** surface-0 (= base) to surface-3, each a little further toward the ink. */
  steps: [string, string, string, string]
  ink: string
  muted: string
  /** Text colors per brand role on this surface: the brand color when it passes, else ink. */
  text: Record<'primary' | 'secondary' | 'accent', string>
  /** Display text (24px and up, 3:1). */
  display: Record<'primary' | 'secondary' | 'accent', string>
  lowContrast: ('primary' | 'secondary' | 'accent')[]
}

/**
 * Surface-aware colors (design v2, plan 6.3). Every text role is checked against surfaces 0 to 2
 * (page, cards, raised cards) and must pass on all of them: 4.5:1 for text, 3:1 for display.
 * Brand hex values are used as stored or not at all; tints are computed beside them (R6).
 */
export function surfaceTheme(brand: Brand, surface: Style['surface']): SurfaceTheme {
  const base = surface === 'dark' ? brand.colors.secondary : PAGE_BG
  const ink = onSurfaceInk(base)
  const steps = [base, mixHex(base, ink, 0.05), mixHex(base, ink, 0.09), mixHex(base, ink, 0.14)] as SurfaceTheme['steps']
  const worst = (c: string) => Math.min(...steps.slice(0, 3).map((s) => contrastRatio(c, s)))
  let t = 0.62
  let muted = mixHex(base, ink, t)
  while (worst(muted) < AA && t < 1) { t = Math.min(1, t + 0.02); muted = mixHex(base, ink, t) }
  const lowContrast: SurfaceTheme['lowContrast'] = []
  const roles = ['primary', 'secondary', 'accent'] as const
  const text = {} as SurfaceTheme['text']
  const display = {} as SurfaceTheme['display']
  for (const r of roles) {
    const c = brand.colors[r]
    text[r] = worst(c) >= AA ? c : ink
    display[r] = worst(c) >= AA_LARGE ? c : ink
    if (text[r] !== c) lowContrast.push(r)
  }
  return { base, steps, ink, muted, text, display, lowContrast }
}

/**
 * CSS custom properties for a site. The `--ys-primary/secondary/accent` values are the stored hex
 * strings, byte for byte. Everything else is computed beside them.
 */
export function themeFor(brand: Brand, fontPair: FontPair = brand.fontPair, style?: Pick<Style, 'preset' | 'surface'>): ThemeReport {
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
  // The classic look keeps exactly its original values. Design-v2 presets add surface colors.
  if (!style || style.preset === 'classic') return { vars, lowContrast }
  const st = surfaceTheme(brand, style.surface)
  Object.assign(vars, {
    '--ys-bg': st.base,
    '--ys-ink': st.ink,
    '--ys-on-surface': st.ink,
    '--ys-muted': st.muted,
    '--ys-surface-0': st.steps[0], '--ys-surface-1': st.steps[1], '--ys-surface-2': st.steps[2], '--ys-surface-3': st.steps[3],
    '--ys-primary-text': st.text.primary, '--ys-secondary-text': st.text.secondary, '--ys-accent-text': st.text.accent,
    '--ys-primary-display': st.display.primary, '--ys-secondary-display': st.display.secondary, '--ys-accent-display': st.display.accent,
  })
  return { vars, lowContrast: st.lowContrast }
}
