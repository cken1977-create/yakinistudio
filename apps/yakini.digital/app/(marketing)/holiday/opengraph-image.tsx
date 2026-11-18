import { ImageResponse } from 'next/og'

// Share card for the Holiday Giveaway ad traffic (Facebook, Instagram, X, texts).
export const alt = 'Yakini Digital & BRSA Foundation Holiday Giveaway: free Yakini software and a website revamp for 5 businesses. Apply or nominate by Dec 15, 2026.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: 'linear-gradient(135deg, #060B24 0%, #0B1A4F 60%, #060B24 100%)', color: '#F4F7FF', fontFamily: 'Georgia, serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 24, letterSpacing: 6, color: '#C6F432', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: '#C6F432' }} />
          HOLIDAY GIVEAWAY · 2026
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 40, fontStyle: 'italic', color: '#C9D4FF', lineHeight: 1.2 }}>“Somebody blessed me, so I want to bless somebody else.”</div>
          <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', fontSize: 84, lineHeight: 1.0, fontWeight: 700 }}>
            <div style={{ display: 'flex' }}>We’re blessing <span style={{ color: '#C6F432', marginLeft: 22 }}>5 businesses</span></div>
            <div style={{ display: 'flex' }}>this holiday season.</div>
          </div>
          <div style={{ marginTop: 22, fontSize: 30, color: 'rgba(244,247,255,0.8)', fontFamily: 'Arial, sans-serif' }}>
            Free Yakini software + a website revamp. Apply or nominate someone who deserves it.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Arial, sans-serif', fontSize: 26 }}>
          <div style={{ display: 'flex', color: 'rgba(244,247,255,0.85)' }}>Yakini Digital × BRSA Foundation</div>
          <div style={{ display: 'flex', background: '#C6F432', color: '#060B24', padding: '14px 26px', borderRadius: 999, fontWeight: 700 }}>Closes Dec 15 · yakini.digital/holiday</div>
        </div>
      </div>
    ),
    size,
  )
}
