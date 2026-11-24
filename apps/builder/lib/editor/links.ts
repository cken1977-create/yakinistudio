import type { LinkTarget, SiteDoc } from '@yakini/site-schema'

/**
 * Link targets as short text the editor can show and read back: `page:menu`, `section:home#faq`,
 * `https://…`, `tel:+19155550123`, `mailto:a@b.co`, `booking`, `form:contact`. Validation of the
 * result still happens in the site format on save; this only converts.
 */
export function linkToText(t: LinkTarget): string {
  switch (t.kind) {
    case 'page': return `page:${t.pageId}`
    case 'section': return `section:${t.pageId}#${t.sectionId}`
    case 'url': return t.url
    case 'tel': return `tel:${t.phone}`
    case 'mailto': return `mailto:${t.email}`
    case 'booking': return 'booking'
    case 'form': return `form:${t.formKey}`
  }
}

export function textToLink(s: string): LinkTarget | null {
  const v = s.trim()
  let m
  if ((m = /^page:([a-z0-9-]+)$/.exec(v))) return { kind: 'page', pageId: m[1] }
  if ((m = /^section:([a-z0-9-]+)#([a-z0-9-]+)$/.exec(v))) return { kind: 'section', pageId: m[1], sectionId: m[2] }
  if ((m = /^tel:(\+[1-9]\d{6,14})$/.exec(v))) return { kind: 'tel', phone: m[1] }
  if ((m = /^mailto:([^\s@]+@[^\s@]+\.[^\s@]+)$/.exec(v))) return { kind: 'mailto', email: m[1] }
  if (v === 'booking') return { kind: 'booking' }
  if ((m = /^form:([a-z0-9-]+)$/.exec(v))) return { kind: 'form', formKey: m[1] }
  if (/^https:\/\/\S+$/.test(v)) return { kind: 'url', url: v }
  return null
}

/** Choices for a "Goes to" picker: every page, then the site's forms. */
export function linkChoices(doc: SiteDoc): { value: string; label: string }[] {
  const out = doc.pages.map((p) => ({ value: `page:${p.id}`, label: `${p.title} page` }))
  const forms = new Set<string>()
  for (const p of doc.pages) for (const s of p.sections) {
    const key = (s.props as { formKey?: unknown }).formKey
    if (typeof key === 'string' && !forms.has(key)) { forms.add(key); out.push({ value: `form:${key}`, label: `The ${s.type === 'catering_request' ? 'catering' : 'contact'} form` }) }
  }
  return out
}
