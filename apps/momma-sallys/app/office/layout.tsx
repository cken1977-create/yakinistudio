import type { Metadata } from 'next'
import Link from 'next/link'
import { isOwner } from '@/lib/funnel/owner'
import { logout } from './actions'

export const metadata: Metadata = { title: "Catering desk — Momma Sally's", robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const owner = await isOwner()
  return (
    <div style={{ minHeight: '70svh', background: '#050505' }}>
      <style>{`
        .of-wrap { max-width: 1180px; margin: 0 auto; padding: 28px 20px 64px; }
        .of-nav { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; margin-bottom: 24px; font-weight: 700; font-size: 14px; }
        .of-nav a { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--brand-border); }
        .of-card { border: 1px solid var(--brand-border); border-radius: 14px; background: #0d0d0d; padding: 14px 16px; }
        .of-muted { color: var(--brand-muted); font-size: 13px; }
        .of-btn { min-height: 40px; padding: 0 16px; border-radius: 999px; font-weight: 700; font-size: 14px; border: 1px solid var(--brand-border); background: #151515; color: #fff; cursor: pointer; }
        .of-btn-red { background: var(--brand-primary); border-color: var(--brand-primary); }
        .of-in { min-height: 42px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--brand-border); background: #0b0b0b; color: #fff; font-size: 15px; width: 100%; box-sizing: border-box; }
        .of-tag { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; background: #222; }
        .of-table { width: 100%; border-collapse: collapse; font-size: 15px; }
        .of-table td, .of-table th { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--brand-border); vertical-align: top; }
      `}</style>
      <div className="of-wrap">
        <div className="ms-eyebrow">Catering desk · Owner only</div>
        {owner && (
          <nav className="of-nav">
            <Link href="/office">Pipeline</Link>
            <Link href="/office/weekly">Weekly results</Link>
            <Link href="/office/links">Links &amp; QR codes</Link>
            <form action={logout} style={{ marginLeft: 'auto' }}><button className="of-btn" type="submit">Sign out</button></form>
          </nav>
        )}
        {children}
      </div>
    </div>
  )
}
