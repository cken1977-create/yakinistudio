import type { Metadata } from 'next'

// Internal pages: keep them out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
