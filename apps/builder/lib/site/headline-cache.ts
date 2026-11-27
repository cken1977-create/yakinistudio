import 'server-only'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { unstable_cache } from 'next/cache'
import type { SiteDoc } from '@yakini/site-schema'
import type { Runtime } from '@/lib/server/runtime'
import { siteRenderer, type HeadlineFont } from './renderer'

/**
 * The site's inline headline font is made once per published version, never per page view.
 *
 * A published version never changes (a new publish is a new version), so the font is cached under
 * its version id plus a fingerprint of the deployed font files. Publishing fills the cache
 * (goLive), so a site's first visitor already finds it; a page view only reads it. The cache is
 * Next's shared data cache: on Vercel it persists and is shared by every server instance, so a cold
 * start reads the cached font instead of cutting it again. A version made live another way (a
 * rollback to one published before this change) is made on its first view and cached from then on.
 *
 * Test mode keeps the same cache in this process (the in-memory store lives here too), and reports
 * hits so browser tests can prove a page view did no font work.
 */
export type HeadlineSite = { siteId: string; versionId: string | null; doc: SiteDoc }
export type HeadlineResult = { font: HeadlineFont | null; cached: boolean }
type Make = (doc: SiteDoc) => Promise<HeadlineFont | null>

let makeFont: Make = (doc) => siteRenderer().headlineFont(doc)
/** Tests only: count or replace the font maker. */
export function setHeadlineMaker(m: Make | null) { makeFont = m ?? ((doc) => siteRenderer().headlineFont(doc)) }

let fontsVersion: string | null = null
/** Fingerprint of the deployed font files (from the site-assets build manifest). */
export function deployedFontsVersion(): string {
  if (fontsVersion === null) {
    try { fontsVersion = (JSON.parse(readFileSync(join(process.env.SITE_ASSETS_DIR ?? join(process.cwd(), 'public', '_site-assets'), 'manifest.json'), 'utf8')) as { fontsVersion?: string }).fontsVersion ?? 'none' } catch { fontsVersion = 'none' }
  }
  return fontsVersion
}

const memory = new Map<string, HeadlineFont | null>()
const keyOf = (s: HeadlineSite) => `${s.siteId}:${s.versionId ?? 'draft'}:${deployedFontsVersion()}`

export async function headlineFor(rt: Pick<Runtime, 'testMode'>, s: HeadlineSite): Promise<HeadlineResult> {
  const key = keyOf(s)
  if (rt.testMode || !s.versionId) {
    if (memory.has(key)) return { font: memory.get(key)!, cached: true }
    const font = await makeFont(s.doc)
    if (memory.size > 200) memory.delete(memory.keys().next().value!)
    memory.set(key, font)
    return { font, cached: false }
  }
  let made = false
  const font = await unstable_cache(async () => { made = true; return makeFont(s.doc) }, ['headline-font', key], { revalidate: false, tags: [`headline:${s.siteId}`] })()
  return { font, cached: !made }
}

/** Publish step: make and cache the new version's headline font so no visitor pays for it. */
export async function warmHeadline(rt: Pick<Runtime, 'testMode'>, s: HeadlineSite): Promise<void> {
  await headlineFor(rt, s)
}

/** Tests only. */
export function clearHeadlineMemory() { memory.clear() }
