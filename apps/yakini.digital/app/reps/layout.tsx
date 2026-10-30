import type { Metadata } from 'next'
import { REPS_CSS } from './reps-css'

// Private rep area: never indexed, never cached by search engines.
export const metadata: Metadata = {
  title: 'Demo Library · Yakini',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{REPS_CSS}</style>
      <div className="rp-root">{children}</div>
    </>
  )
}
