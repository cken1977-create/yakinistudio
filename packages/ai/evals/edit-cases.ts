/**
 * Chat-edit evaluation set (spec 16.5): 20 owner requests against the food-truck kit draft for
 * "Mesa Street Tacos", each with what must change and what must not.
 *
 * - `check` says whether the result is right (null = right, otherwise why not).
 * - `allowed` lists the parts of the site the request may touch; anything else changing fails.
 * - `script` is what a correct model would call. Tests use it as a stand-in model to prove the
 *   pipeline; `npm run eval -w builder` sends the same requests to the real model instead.
 *
 * No imports, plain JSON in and out, so the same cases serve tests, CI and the manual eval.
 */
type Json = any // eslint-disable-line @typescript-eslint/no-explicit-any
export type Call = { name: string; arguments: Record<string, unknown> }
export type EditCase = {
  id: string
  request: string
  selected?: { pageId: string; sectionId: string }
  /** 'change' = a proposal; 'reply' / 'question' = no change, a message instead. */
  kind: 'change' | 'reply' | 'question'
  allowed?: (doc: Json) => string[]
  check?: (before: Json, after: Json) => string | null
  script: (doc: Json) => Call[]
}

const page = (doc: Json, id: string) => doc.pages.find((p: Json) => p.id === id)
const pi = (doc: Json, id: string) => doc.pages.findIndex((p: Json) => p.id === id)
const si = (doc: Json, pageId: string, sectionId: string) => page(doc, pageId).sections.findIndex((s: Json) => s.id === sectionId)
const sec = (doc: Json, pageId: string, sectionId: string) => page(doc, pageId).sections.find((s: Json) => s.id === sectionId)
const at = (doc: Json, pageId: string, sectionId: string) => `/pages/${pi(doc, pageId)}/sections/${si(doc, pageId, sectionId)}`
const eq = (a: unknown, b: unknown, what: string) => (JSON.stringify(a) === JSON.stringify(b) ? null : `${what} is ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`)
const has = (v: unknown, re: RegExp, what: string) => (typeof v === 'string' && re.test(v) ? null : `${what} is ${JSON.stringify(v)}`)

export const EDIT_CASES: EditCase[] = [
  {
    id: 'hero-cater-weddings', request: 'Make the hero say we cater weddings', kind: 'change',
    allowed: (d) => [`${at(d, 'home', 'hero')}/props/subhead`, `${at(d, 'home', 'hero')}/props/headline`, `${at(d, 'home', 'hero')}/props/eyebrow`],
    check: (_b, a) => {
      const p = sec(a, 'home', 'hero').props
      return /wedding/i.test(`${p.headline} ${p.subhead ?? ''} ${p.eyebrow ?? ''}`) ? null : 'the hero does not mention weddings'
    },
    script: () => [{ name: 'update_field', arguments: { pageId: 'home', sectionId: 'hero', path: '/subhead', value: 'Street tacos for your wedding, party or office lunch. We cater.' } }],
  },
  {
    id: 'saturday-hours', request: 'Add our Saturday hours 10–4', kind: 'change',
    allowed: () => ['/business/hours'],
    check: (_b, a) => eq((a.business.hours ?? []).find((h: Json) => h.day === 'sat'), { day: 'sat', open: '10:00', close: '16:00' }, 'Saturday hours'),
    script: (d) => [{ name: 'update_business', arguments: { field: 'hours', value: [...(d.business.hours ?? []).filter((h: Json) => h.day !== 'sat'), { day: 'sat', open: '10:00', close: '16:00' }] } }],
  },
  {
    id: 'headline', request: 'Change the headline to Best tacos in Austin', kind: 'change',
    allowed: (d) => [`${at(d, 'home', 'hero')}/props/headline`],
    check: (_b, a) => eq(sec(a, 'home', 'hero').props.headline, 'Best tacos in Austin', 'the headline'),
    script: () => [{ name: 'update_field', arguments: { pageId: 'home', sectionId: 'hero', path: '/headline', value: 'Best tacos in Austin' } }],
  },
  {
    id: 'hide-reviews', request: 'Hide the reviews section', kind: 'change',
    allowed: (d) => [`${at(d, 'home', 'reviews')}/hidden`],
    check: (_b, a) => eq(sec(a, 'home', 'reviews').hidden, true, 'reviews hidden'),
    script: () => [{ name: 'set_section_hidden', arguments: { pageId: 'home', sectionId: 'reviews', hidden: true } }],
  },
  {
    id: 'move-reviews', request: 'Put the reviews right after the top banner', kind: 'change',
    allowed: (d) => [`/pages/${pi(d, 'home')}/sections`],
    check: (_b, a) => eq(page(a, 'home').sections[2]?.id, 'reviews', 'the section after the banner'),
    script: () => [{ name: 'move_section', arguments: { pageId: 'home', sectionId: 'reviews', toIndex: 2 } }],
  },
  {
    id: 'faq-parking', request: 'Add a question about parking: there is free parking behind the truck', selected: { pageId: 'about', sectionId: 'faq' }, kind: 'change',
    allowed: (d) => [`${at(d, 'about', 'faq')}/props/items`],
    check: (b, a) => {
      const before = sec(b, 'about', 'faq').props.items, after = sec(a, 'about', 'faq').props.items
      if (after.length !== before.length + 1) return `FAQ has ${after.length} questions, expected ${before.length + 1}`
      return /park/i.test(JSON.stringify(after[after.length - 1])) ? null : 'the new question is not about parking'
    },
    script: (d) => [{ name: 'update_field', arguments: { pageId: 'about', sectionId: 'faq', path: '/items', value: [...sec(d, 'about', 'faq').props.items, { q: 'Where can I park?', a: [{ type: 'p', children: [{ text: 'There is free parking behind the truck.' }] }] }] } }],
  },
  {
    id: 'hero-button', request: 'Change the See the menu button to say Order now', kind: 'change',
    allowed: (d) => [`${at(d, 'home', 'hero')}/props/primaryCta/label`],
    check: (_b, a) => eq(sec(a, 'home', 'hero').props.primaryCta.label, 'Order now', 'the button text'),
    script: () => [{ name: 'update_field', arguments: { pageId: 'home', sectionId: 'hero', path: '/primaryCta/label', value: 'Order now' } }],
  },
  {
    id: 'rename-about', request: 'Rename the About page to Our story', kind: 'change',
    allowed: (d) => [`/pages/${pi(d, 'about')}/title`, `/pages/${pi(d, 'about')}/slug`, '/nav/items'],
    check: (_b, a) => eq(page(a, 'about').title, 'Our story', 'the page name'),
    script: () => [{ name: 'rename_page', arguments: { pageId: 'about', title: 'Our story' } }],
  },
  {
    id: 'phone', request: 'Add our phone number (512) 555-0134', kind: 'change',
    allowed: () => ['/business/phone'],
    check: (_b, a) => eq(a.business.phone, '+15125550134', 'the phone number'),
    script: () => [{ name: 'update_business', arguments: { field: 'phone', value: '+15125550134' } }],
  },
  {
    id: 'catering-style', request: 'Make the catering box on the menu page solid instead of outlined', kind: 'change',
    allowed: (d) => [`${at(d, 'menu', 'catering-cta')}/variant`],
    check: (_b, a) => eq(sec(a, 'menu', 'catering-cta').variant, 'solid', 'the style'),
    script: () => [{ name: 'set_section_variant', arguments: { pageId: 'menu', sectionId: 'catering-cta', variant: 'solid' } }],
  },
  {
    id: 'colors-red', request: 'Change my colors to red', kind: 'reply',
    script: () => [{ name: 'reply', arguments: { message: 'Your colors can be changed in Brand settings.' } }],
  },
  {
    id: 'publish', request: 'Publish my site', kind: 'reply',
    script: () => [{ name: 'reply', arguments: { message: 'Use the Publish button when you are ready.' } }],
  },
  {
    id: 'menu-intro', request: 'Update the menu intro to say everything is made fresh daily', kind: 'change',
    allowed: (d) => [`${at(d, 'menu', 'menu')}/props/intro`],
    check: (_b, a) => has(sec(a, 'menu', 'menu').props.intro, /fresh/i, 'the menu intro'),
    script: () => [{ name: 'update_field', arguments: { pageId: 'menu', sectionId: 'menu', path: '/intro', value: 'Everything is made fresh daily on the truck.' } }],
  },
  {
    id: 'drinks', request: 'Add a Drinks section to the menu with Horchata for $3', kind: 'change',
    allowed: (d) => [`${at(d, 'menu', 'menu')}/props/categories`],
    check: (_b, a) => {
      const cat = sec(a, 'menu', 'menu').props.categories.find((c: Json) => /drink/i.test(c.name))
      const item = cat?.items.find((i: Json) => /horchata/i.test(i.name))
      return item ? has(item.price, /3/, 'the horchata price') : 'no Horchata under Drinks'
    },
    script: (d) => [{ name: 'update_field', arguments: { pageId: 'menu', sectionId: 'menu', path: '/categories', value: [...sec(d, 'menu', 'menu').props.categories, { name: 'Drinks', items: [{ name: 'Horchata', price: '$3' }] }] } }],
  },
  {
    id: 'remove-catering-faq', request: 'Remove the questions from the catering page', kind: 'change',
    allowed: (d) => [`/pages/${pi(d, 'catering')}/sections`],
    check: (_b, a) => (sec(a, 'catering', 'catering-faq') ? 'the catering questions are still there' : null),
    script: () => [{ name: 'remove_section', arguments: { pageId: 'catering', sectionId: 'catering-faq' } }],
  },
  {
    id: 'email', request: 'Add our email hello@mesastreettacos.com', kind: 'change',
    allowed: () => ['/business/email'],
    check: (_b, a) => eq(a.business.email, 'hello@mesastreettacos.com', 'the email'),
    script: () => [{ name: 'update_business', arguments: { field: 'email', value: 'hello@mesastreettacos.com' } }],
  },
  {
    id: 'vague', request: 'Make it better', kind: 'question',
    script: () => [{ name: 'ask_clarifying_question', arguments: { question: 'What would you like to change first?', choices: ['The headline', 'The menu', 'The photos'] } }],
  },
  {
    id: 'form-button', request: 'Change the catering form button to Send my request', kind: 'change',
    allowed: (d) => [`${at(d, 'catering', 'catering-form')}/props/submitLabel`],
    check: (_b, a) => eq(sec(a, 'catering', 'catering-form').props.submitLabel, 'Send my request', 'the form button'),
    script: () => [{ name: 'update_field', arguments: { pageId: 'catering', sectionId: 'catering-form', path: '/submitLabel', value: 'Send my request' } }],
  },
  {
    id: 'seo-description', request: 'Set the search description to Street tacos in Austin, Texas', kind: 'change',
    allowed: () => ['/seo/description'],
    check: (_b, a) => has(a.seo.description, /Street tacos in Austin/i, 'the search description'),
    script: () => [{ name: 'set_seo', arguments: { pageId: null, description: 'Street tacos in Austin, Texas' } }],
  },
  {
    id: 'friday-stop', request: 'Add a stop on Fridays from 11 to 2 at Civic Plaza', kind: 'change',
    allowed: (d) => [`${at(d, 'home', 'schedule')}/props/stops`],
    check: (_b, a) => {
      const stop = sec(a, 'home', 'schedule').props.stops.find((s: Json) => s.day === 'fri' && /civic plaza/i.test(s.place))
      return stop ? eq([stop.start, stop.end], ['11:00', '14:00'], 'the Friday times') : 'no Friday stop at Civic Plaza'
    },
    script: (d) => [{ name: 'update_field', arguments: { pageId: 'home', sectionId: 'schedule', path: '/stops', value: [...sec(d, 'home', 'schedule').props.stops, { day: 'fri', start: '11:00', end: '14:00', place: 'Civic Plaza' }] } }],
  },
]

/** Leaf JSON pointers that differ between two values (arrays compared by index). */
export function changedPaths(a: unknown, b: unknown, base = ''): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return []
  const isObj = (v: unknown) => v !== null && typeof v === 'object'
  if (!isObj(a) || !isObj(b) || Array.isArray(a) !== Array.isArray(b)) return [base || '/']
  const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)])
  return [...keys].flatMap((k) => changedPaths((a as Json)[k], (b as Json)[k], `${base}/${k}`))
}

/** Changes outside the allowed parts of the site (empty = nothing else changed). */
export function strayChanges(before: unknown, after: unknown, allowed: string[]): string[] {
  return changedPaths(before, after).filter((p) => !allowed.some((a) => p === a || p.startsWith(`${a}/`)))
}
