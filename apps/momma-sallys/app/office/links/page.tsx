import Image from 'next/image'
import { requireOwner } from '@/lib/funnel/owner'
import { LIVE_BASE, SOURCE_LABEL, TAGGED_LINKS } from '@/config/funnel'

export const dynamic = 'force-dynamic'

export default async function LinksPage() {
  await requireOwner()
  return (
    <>
      <h1 style={{ fontSize: 'clamp(30px, 6vw, 44px)', margin: '0 0 6px' }}>Links &amp; QR codes</h1>
      <p className="of-muted" style={{ fontSize: 15, margin: '0 0 20px' }}>Each place gets its own link so the weekly results can show where your leads come from. Use the matching QR code or link in each spot.</p>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {TAGGED_LINKS.map((t) => {
          const url = `${LIVE_BASE}/catering?src=${t.source}`
          return (
            <div key={t.source} className="of-card" style={{ display: 'grid', gap: 8 }}>
              <b>{SOURCE_LABEL[t.source]}</b>
              <span className="of-muted">{t.where}</span>
              <code style={{ fontSize: 13, wordBreak: 'break-all' }}>{url}</code>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['black', 'red'] as const).map((c) => (
                  <a key={c} href={`/qr/catering-${t.source}-${c}.png`} download style={{ display: 'grid', gap: 4, textAlign: 'center' }}>
                    <Image src={`/qr/catering-${t.source}-${c}.png`} alt={`${SOURCE_LABEL[t.source]} QR code (${c})`} width={110} height={110} style={{ background: '#fff', borderRadius: 8 }} />
                    <span className="of-muted">Download {c}</span>
                  </a>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
