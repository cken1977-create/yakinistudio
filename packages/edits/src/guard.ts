import type { KitDefinition } from '@yakini/kits'
import { SECTION_DEFS, type SiteDoc } from '@yakini/site-schema'

/**
 * Whole-site rules every edit must keep (spec 7.2, 8.4, 10.3), checked after each batch whatever
 * ops it used, so even an undo or restore sent by a tampered browser can't break them:
 * every page starts with its header and ends with its footer, only the kit's sections and styles,
 * the plan's page limit, and pictures only from the tenant's own files.
 * Returns plain-English problems; callers refuse an edit only for problems it *adds*, so a site
 * saved before a rule existed can still be edited.
 */
export function structureProblems(doc: SiteDoc, kit: KitDefinition, maxPages: number): string[] {
  const out: string[] = []
  if (doc.pages.length > maxPages) out.push(`Your plan has room for ${maxPages} pages.`)
  const allowed = new Set<string>(kit.allowedSections)
  for (const p of doc.pages) {
    p.sections.forEach((s, j) => {
      if (!allowed.has(s.type)) out.push(`A ${s.type.replace('_', ' ')} section isn't part of this kit (${p.title}).`)
      if (!(SECTION_DEFS[s.type].variants as readonly string[]).includes(s.variant)) out.push(`"${s.variant}" isn't a style for the ${s.type.replace('_', ' ')} section (${p.title}).`)
      if (s.type === 'header' && j !== 0) out.push(`The header must be the first section (${p.title}).`)
      if (s.type === 'footer' && j !== p.sections.length - 1) out.push(`The footer must be the last section (${p.title}).`)
    })
    if (p.sections[0]?.type !== 'header') out.push(`${p.title} needs its header.`)
    if (p.sections[p.sections.length - 1]?.type !== 'footer') out.push(`${p.title} needs its footer.`)
  }
  return out
}

/** Every picture id used by the site's pages (not the brand logo, which no edit can touch). */
export function pageAssetIds(doc: SiteDoc): Set<string> {
  const ids = new Set<string>()
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(walk); return }
    if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        if (k === 'assetId' && typeof x === 'string') ids.add(x)
        else walk(x)
      }
    }
  }
  walk(doc.pages)
  return ids
}
