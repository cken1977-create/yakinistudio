import type { Page, Section, SiteDoc } from '@yakini/site-schema'

/**
 * "Finish your site" (D1 step 5): the top things a draft is missing, in order of how much they
 * add, each linking straight to the section in the editor. Read from the doc only; nothing is
 * guessed or filled in.
 */
export type FinishItem = { label: string; pageId: string; sectionId: string }

const PH = /\[\[[^\]]*\]\]/
const hasPh = (v: unknown) => PH.test(JSON.stringify(v))
const images = (doc: SiteDoc) => new Set([...JSON.stringify(doc.pages).matchAll(/"assetId":"([^"]+)"/g)].map((m) => m[1])).size

function find(doc: SiteDoc, pred: (s: Section) => boolean): { page: Page; s: Section } | null {
  for (const page of doc.pages) for (const s of page.sections) if (!s.hidden && pred(s)) return { page, s }
  // A hidden section still counts (e.g. the gallery hides itself until it has photos).
  for (const page of doc.pages) for (const s of page.sections) if (pred(s)) return { page, s }
  return null
}

export function finishItems(doc: SiteDoc, max = 3): FinishItem[] {
  const out: FinishItem[] = []
  const add = (label: string, at: { page: Page; s: Section } | null) => { if (at && out.length < max && !out.some((o) => o.sectionId === at.s.id)) out.push({ label, pageId: at.page.id, sectionId: at.s.id }) }
  const checks: [string, () => { page: Page; s: Section } | null][] = [
    ['Add your menu', () => find(doc, (s) => s.type === 'menu' && !s.props.categories.some((c) => c.items.length > 0))],
    ['Add your weekly stops', () => find(doc, (s) => s.type === 'schedule' && s.props.stops.length === 0)],
    ['Add 3 photos', () => (images(doc) < 3 ? find(doc, (s) => s.type === 'gallery') ?? find(doc, (s) => s.type === 'hero') : null)],
    ['Add your services', () => find(doc, (s) => s.type === 'services' && (s.props.items.length === 0 || hasPh(s.props.items)))],
    ['Tell your story', () => find(doc, (s) => s.type === 'about' && hasPh(s.props.body))],
    ['Add your hours and address', () => (!doc.business.hours?.length && !doc.business.address ? find(doc, (s) => s.type === 'hours_location') : null)],
    ['Add a few reviews', () => find(doc, (s) => s.type === 'testimonials' && s.props.items.length === 0)],
    ['Fill in the last details', () => find(doc, (s) => hasPh(s.props))],
  ]
  for (const [label, at] of checks) { if (out.length >= max) break; add(label, at()) }
  return out
}

export const finishHref = (siteId: string, item: FinishItem) => `/sites/${siteId}/edit?page=${encodeURIComponent(item.pageId)}&section=${encodeURIComponent(item.sectionId)}`
