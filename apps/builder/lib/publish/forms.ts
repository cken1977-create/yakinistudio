import { BOOKING_FORM_KEY } from '@yakini/sections'
import type { SiteDoc } from '@yakini/site-schema'

/**
 * The forms a site has (spec 11.1 item 7, 11.3). Contact and catering sections post their own
 * fields; a booking section posts a booking request (Phase 3: request mode until the portal
 * booking link arrives in Phase 6).
 */
export type FormKind = 'contact' | 'catering' | 'booking_request'
export type SiteForm = { formKey: string; kind: FormKind; fields: string[] }

export { BOOKING_FORM_KEY }
export const BOOKING_FIELDS = ['name', 'email', 'phone', 'event_date', 'message'] as const

export function formsOf(doc: SiteDoc): SiteForm[] {
  const out = new Map<string, SiteForm>()
  for (const page of doc.pages) for (const s of page.sections) {
    if (s.hidden) continue
    if (s.type === 'contact_form' || s.type === 'catering_request') {
      if (!out.has(s.props.formKey)) out.set(s.props.formKey, { formKey: s.props.formKey, kind: s.type === 'contact_form' ? 'contact' : 'catering', fields: [...s.props.fields] })
    } else if (s.type === 'booking' && !out.has(BOOKING_FORM_KEY)) {
      out.set(BOOKING_FORM_KEY, { formKey: BOOKING_FORM_KEY, kind: 'booking_request', fields: [...BOOKING_FIELDS] })
    }
  }
  return [...out.values()]
}
