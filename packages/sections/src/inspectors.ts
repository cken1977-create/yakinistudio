/**
 * Editor inspector definitions (spec 7.2): which fields of each section an owner can edit and how.
 * Paths are JSON pointers inside `props`. Phase 2's click editor renders these, and the chat-edit
 * tool `update_field` may only touch paths listed here (spec 8.7). `*` matches any list index.
 */
import type { SectionType } from '@yakini/site-schema'

export type FieldKind = 'text' | 'textarea' | 'richtext' | 'image' | 'link' | 'select' | 'boolean' | 'list' | 'time' | 'day' | 'url'

export type InspectorField = { path: string; label: string; kind: FieldKind; options?: readonly string[] }

export const INSPECTORS: Record<SectionType, readonly InspectorField[]> = {
  header: [
    { path: '/showPhone', label: 'Show phone number', kind: 'boolean' },
    { path: '/ctaLabel', label: 'Button text', kind: 'text' },
  ],
  hero: [
    { path: '/eyebrow', label: 'Small text above the headline', kind: 'text' },
    { path: '/headline', label: 'Headline', kind: 'text' },
    { path: '/subhead', label: 'Subheading', kind: 'textarea' },
    { path: '/image', label: 'Photo', kind: 'image' },
    { path: '/images', label: 'More photos (collage)', kind: 'list' },
    { path: '/primaryCta', label: 'Main button', kind: 'link' },
    { path: '/secondaryCta', label: 'Second button', kind: 'link' },
  ],
  about: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/body', label: 'Story', kind: 'richtext' },
    { path: '/image', label: 'Photo', kind: 'image' },
    { path: '/pullQuote', label: 'Line to set large (chapters)', kind: 'textarea' },
  ],
  services: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/intro', label: 'Intro', kind: 'textarea' },
    { path: '/items', label: 'Services', kind: 'list' },
    { path: '/items/*/title', label: 'Service name', kind: 'text' },
    { path: '/items/*/body', label: 'Description', kind: 'textarea' },
    { path: '/items/*/price', label: 'Price', kind: 'text' },
  ],
  menu: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/intro', label: 'Intro', kind: 'textarea' },
    { path: '/categories', label: 'Menu sections', kind: 'list' },
    { path: '/categories/*/name', label: 'Section name', kind: 'text' },
    { path: '/categories/*/items', label: 'Dishes', kind: 'list' },
    { path: '/categories/*/items/*/name', label: 'Dish', kind: 'text' },
    { path: '/categories/*/items/*/description', label: 'Description', kind: 'textarea' },
    { path: '/categories/*/items/*/price', label: 'Price', kind: 'text' },
    { path: '/categories/*/items/*/image', label: 'Photo', kind: 'image' },
    { path: '/note', label: 'Note under the menu', kind: 'textarea' },
  ],
  schedule: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/intro', label: 'Intro', kind: 'textarea' },
    { path: '/stops', label: 'Stops', kind: 'list' },
    { path: '/stops/*/day', label: 'Day', kind: 'day' },
    { path: '/stops/*/start', label: 'Starts', kind: 'time' },
    { path: '/stops/*/end', label: 'Ends', kind: 'time' },
    { path: '/stops/*/place', label: 'Place', kind: 'text' },
    { path: '/stops/*/address', label: 'Address', kind: 'text' },
  ],
  gallery: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/images', label: 'Photos', kind: 'list' },
  ],
  hours_location: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/directionsUrl', label: 'Directions link', kind: 'url' },
    { path: '/note', label: 'Note', kind: 'textarea' },
  ],
  testimonials: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/items', label: 'Reviews', kind: 'list' },
    { path: '/items/*/quote', label: 'What they said', kind: 'textarea' },
    { path: '/items/*/name', label: 'Name', kind: 'text' },
    { path: '/items/*/source', label: 'Where it came from', kind: 'text' },
  ],
  faq: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/items', label: 'Questions', kind: 'list' },
    { path: '/items/*/q', label: 'Question', kind: 'text' },
    { path: '/items/*/a', label: 'Answer', kind: 'richtext' },
  ],
  team: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/members', label: 'People', kind: 'list' },
    { path: '/members/*/name', label: 'Name', kind: 'text' },
    { path: '/members/*/role', label: 'Role', kind: 'text' },
    { path: '/members/*/photo', label: 'Photo', kind: 'image' },
    { path: '/members/*/bio', label: 'Short bio', kind: 'textarea' },
  ],
  cta_band: [
    { path: '/headline', label: 'Headline', kind: 'text' },
    { path: '/body', label: 'Text', kind: 'textarea' },
    { path: '/cta', label: 'Button', kind: 'link' },
    { path: '/image', label: 'Background photo (image band)', kind: 'image' },
  ],
  contact_form: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/intro', label: 'Intro', kind: 'textarea' },
    { path: '/submitLabel', label: 'Button text', kind: 'text' },
  ],
  booking: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/body', label: 'Text', kind: 'textarea' },
    { path: '/buttonLabel', label: 'Button text', kind: 'text' },
  ],
  catering_request: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/intro', label: 'Intro', kind: 'textarea' },
    { path: '/submitLabel', label: 'Button text', kind: 'text' },
  ],
  today: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/emptyBehavior', label: 'When there is no update', kind: 'select', options: ['hide', 'show-text'] },
    { path: '/emptyText', label: 'Text when there is no update', kind: 'text' },
  ],
  footer: [],
  ticker: [
    { path: '/label', label: 'What the list is (read aloud)', kind: 'text' },
    { path: '/items', label: 'Short phrases (3 to 8)', kind: 'list' },
    { path: '/items/*', label: 'Phrase', kind: 'text' },
  ],
  stats: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/items', label: 'Numbers (2 to 4, real ones only)', kind: 'list' },
    { path: '/items/*/value', label: 'Number', kind: 'text' },
    { path: '/items/*/label', label: 'What it counts', kind: 'text' },
  ],
  feature_rows: [
    { path: '/heading', label: 'Heading', kind: 'text' },
    { path: '/items', label: 'Rows (2 to 4)', kind: 'list' },
    { path: '/items/*/label', label: 'Small label', kind: 'text' },
    { path: '/items/*/title', label: 'Title', kind: 'text' },
    { path: '/items/*/body', label: 'Text', kind: 'textarea' },
    { path: '/items/*/image', label: 'Photo', kind: 'image' },
  ],
}

/** May an edit touch this JSON pointer inside a section of this type? (spec 8.7 allow-list) */
export function isEditablePath(type: SectionType, pointer: string): boolean {
  if (!/^(\/[A-Za-z0-9_]+)+$/.test(pointer)) return false
  const parts = pointer.split('/').slice(1)
  const seg = (pattern: string, actual: string) => (pattern === '*' ? /^\d{1,3}$/.test(actual) : pattern === actual)
  return INSPECTORS[type].some((f) => {
    const fp = f.path.split('/').slice(1)
    if (fp.length > parts.length || !fp.every((p, i) => seg(p, parts[i]))) return false
    // A list allows replacing the whole list or one item by index; deeper paths need their own entry.
    if (f.kind === 'list') return parts.length === fp.length || (parts.length === fp.length + 1 && /^\d{1,3}$/.test(parts[fp.length]))
    // Any other field allows itself and anything inside it (e.g. /image/alt).
    return true
  })
}
