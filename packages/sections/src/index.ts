/**
 * @yakini/sections — the section library and the one renderer every client site is drawn with
 * (spec 6.3, 7.2, 7.3). Import `@yakini/sections/styles.css` and `@yakini/sections/fonts.css`
 * once wherever SiteView renders.
 */
export { SiteView, jsonLdFor } from './SiteView'
export {
  PLACEHOLDER_RE, hasPlaceholder, resolveLink, time12, timeRange, formatPhone,
  type RenderContext, type RenderMode, type ResolvedImage, type TodayUpdate,
} from './context'
export { themeFor, contrastRatio, readableInk, luminance, FONT_STACKS, AA, INK, PAGE_BG, type ThemeReport } from './theme'
export { INSPECTORS, isEditablePath, type InspectorField, type FieldKind } from './inspectors'
export { mapsUrl } from './sections/hours'
export { BOOKING_FORM_KEY, HONEYPOT_FIELD } from './sections/forms'
