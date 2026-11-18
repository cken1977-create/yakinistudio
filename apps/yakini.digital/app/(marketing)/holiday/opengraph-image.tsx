import { ImageResponse } from 'next/og'

// Share card for the Holiday Giveaway ad traffic (Facebook, Instagram, X, texts).
export const alt = 'Yakini Digital & BRSA Foundation Holiday Giveaway: 5 Businesses + 1 Future Founder. Free Yakini software and a website revamp. Apply or nominate by Dec 15, 2026.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LIME = '#C6F432'

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 72px', background: 'linear-gradient(135deg, #060B24 0%, #0B1A4F 60%, #060B24 100%)', color: '#F4F7FF', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, letterSpacing: 6, color: LIME, fontWeight: 700 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: LIME, marginRight: 16 }} />
          HOLIDAY GIVEAWAY · 2026
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 92, lineHeight: 1, fontWeight: 700, color: LIME }}>5 Businesses</div>
          <div style={{ display: 'flex', fontSize: 92, lineHeight: 1, fontWeight: 700, marginTop: 6 }}>+ 1 Future Founder</div>
          <div style={{ display: 'flex', marginTop: 26, fontSize: 32, color: 'rgba(244,247,255,0.88)' }}>
            Free Yakini software + a website revamp. Apply or nominate someone.
          </div>
          <div style={{ display: 'flex', marginTop: 14, fontSize: 28, fontStyle: 'italic', color: '#C9D4FF' }}>
            “Somebody blessed me, so I want to bless somebody else.”
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26 }}>
          <div style={{ display: 'flex', color: 'rgba(244,247,255,0.85)' }}>Yakini Digital × BRSA Foundation</div>
          <div style={{ display: 'flex', background: LIME, color: '#060B24', padding: '14px 26px', borderRadius: 999, fontWeight: 700 }}>Closes Dec 15 · yakini.digital/holiday</div>
        </div>
      </div>
    ),
    size,
  )
}
