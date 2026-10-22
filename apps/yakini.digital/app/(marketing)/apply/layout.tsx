import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a call · Yakini custom builds',
  description: 'Tell us what you want built. A real person at Yakini reads every message, and every custom build is quoted in writing first.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
