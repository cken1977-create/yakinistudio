import { INSPECTORS } from '@yakini/sections/inspectors'
import type { SiteDoc } from '@yakini/site-schema'
import type { EditOp } from './ops'

/**
 * Plain-English lines for a proposal card (spec 10.4): "Changed the headline on Home to …".
 * Describes against the doc BEFORE the change, so names are the ones the owner sees now.
 */
const SECTION_NAMES: Record<string, string> = {
  header: 'header', hero: 'top banner', about: 'about', services: 'services', menu: 'menu', schedule: 'schedule',
  gallery: 'photo gallery', testimonials: 'reviews', faq: 'questions', hours_location: 'hours and location',
  contact_form: 'contact form', catering_request: 'catering form', booking: 'booking', team: 'team',
  cta_band: 'call-to-action band', today: 'today', footer: 'footer',
}
const BUSINESS_NAMES: Record<string, string> = {
  tagline: 'tagline', phone: 'phone number', email: 'email', address: 'address', hours: 'hours', serviceArea: 'service area', social: 'social links',
}

const quote = (v: unknown) => {
  if (typeof v !== 'string') return ''
  const t = v.replace(/\s+/g, ' ').trim()
  return ` to “${t.length > 60 ? `${t.slice(0, 57)}…` : t}”`
}

function labelFor(type: string, path: string): string {
  const fields = INSPECTORS[type as keyof typeof INSPECTORS] ?? []
  const pattern = path.replace(/\/\d+(?=\/|$)/g, '/*')
  const f = fields.find((x) => x.path === pattern) ?? fields.find((x) => pattern.startsWith(`${x.path}/`))
  return (f?.label ?? 'text').toLowerCase()
}

export function describeOp(doc: SiteDoc, op: EditOp): string {
  const page = 'pageId' in op && op.pageId ? doc.pages.find((p) => p.id === op.pageId) : undefined
  const on = page ? ` on ${page.title}` : ''
  const section = page && 'sectionId' in op ? page.sections.find((s) => s.id === op.sectionId) : undefined
  const sName = section ? SECTION_NAMES[section.type] ?? 'section' : 'section'
  switch (op.op) {
    case 'update_field': return op.value === undefined
      ? `Removed the ${labelFor(section?.type ?? '', op.path)}${on}`
      : `Changed the ${labelFor(section?.type ?? '', op.path)}${on}${quote(op.value)}`
    case 'update_business': return op.value === undefined ? `Removed your ${BUSINESS_NAMES[op.field]}` : `Updated your ${BUSINESS_NAMES[op.field]}${quote(op.value)}`
    case 'add_section': return `Added a ${SECTION_NAMES[op.type] ?? 'new'} section${on}`
    case 'remove_section': return `Removed the ${sName} section${on}`
    case 'restore_section': return `Put back a section${on}`
    case 'move_section': return `Moved the ${sName} section${on}`
    case 'duplicate_section': return `Copied the ${sName} section${on}`
    case 'set_section_variant': return `Changed the style of the ${sName} section${on}`
    case 'set_section_hidden': return `${op.hidden ? 'Hid' : 'Showed'} the ${sName} section${on}`
    case 'set_image': return `Changed the ${labelFor(section?.type ?? '', op.path)}${on}`
    case 'add_page': return `Added a page called “${op.title}”`
    case 'remove_page': return `Removed the ${page?.title ?? ''} page`.replace('  ', ' ')
    case 'restore_doc_parts': return 'Put back your pages'
    case 'rename_page': return `Renamed ${page?.title ?? 'a page'} to “${op.title}”`
    case 'rename_page_raw': return `Renamed ${page?.title ?? 'a page'} to “${op.title}”`
    case 'move_page': return `Moved the ${page?.title ?? ''} page in the menu`.replace('  ', ' ')
    case 'set_seo': case 'set_seo_raw': return op.pageId === null ? 'Updated how your site shows in search results' : `Updated how ${page?.title ?? 'a page'} shows in search results`
  }
}
