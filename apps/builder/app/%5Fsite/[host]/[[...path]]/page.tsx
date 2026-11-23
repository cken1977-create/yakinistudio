import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// Multi-tenant renderer (spec 13.5). Phase 0: no client site is live, so every host gets the
// neutral not-found page (noindex). Phase 3 looks the host up with
// builder.published_doc_for_host() and renders the published doc through loadSiteDoc().
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function SiteRenderer() {
  notFound()
}
