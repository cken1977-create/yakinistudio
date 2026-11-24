import type { Metadata } from 'next'

export const metadata: Metadata = { title: { absolute: 'This site is unavailable' }, description: null, robots: { index: false, follow: false }, icons: { icon: 'data:,' } }

const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' as const, background: '#fff', color: '#1a1a1a', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }

/** Neutral page for unknown hosts and sites under takedown or auto-hold (spec 11.4, 14.8 #9). No reason, no vendor names. */
export default function SiteUnavailable() {
  return (
    <main style={wrap}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>This site is unavailable.</h1>
        <p style={{ marginTop: '12px', color: '#555' }}>Please check the address and try again.</p>
      </div>
    </main>
  )
}
