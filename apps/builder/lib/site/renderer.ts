import 'server-only'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import type { SiteDoc } from '@yakini/site-schema'

/**
 * Loads the standalone published-page renderer (.site-renderer/render.cjs, built by
 * scripts/build-site-renderer.mjs) at runtime. It isn't part of the Next.js bundle on purpose: it
 * carries its own React and react-dom/server, which App Router code may not import.
 */
export type SiteIsland = { src: string }
export type PublishedInput = {
  doc: SiteDoc
  pageId: string | null
  thanks: { formKey: string | null } | null
  siteId: string
  reportUrl: string | null
  formStamp: string | null
  canonicalHost: string
  indexable: boolean
  islands?: SiteIsland[]
  nonce?: string | null
}
type Renderer = {
  renderPublished: (i: PublishedInput) => string
  neutralHtml: (title: string, note: string) => string
  renderFixturePage: (i: { doc: SiteDoc; pageId: string; mode: 'live' | 'draft'; base: string }) => string
}

let loaded: Renderer | null = null
export function siteRenderer(): Renderer {
  if (!loaded) {
    const file = join(process.cwd(), '.site-renderer', 'render.cjs')
    loaded = createRequire(join(process.cwd(), 'package.json'))(file) as Renderer
  }
  return loaded
}
