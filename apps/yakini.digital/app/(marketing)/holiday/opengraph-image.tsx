import { ImageResponse } from 'next/og'

// Share card for the Holiday Giveaway (texts, Facebook, Instagram, X). Festive palette to
// match the page: evergreen night + deep wine, gold foil, warm string lights, a wrapped gift.
export const alt = 'Yakini Digital & BRSA Foundation Holiday Giveaway: 5 Businesses + 1 Future Founder. Free Yakini software and a website revamp. Apply or nominate by Dec 15, 2026.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const GOLD = '#E2B95C'
const BULBS = ['#FFD98A', '#E8424F', '#FFF1C9', '#3FAF6E', '#FFB547']

export default function OgImage() {
  // string lights: two gentle swags of bulbs across the top
  const bulbs = Array.from({ length: 22 }, (_, i) => {
    const t = (i % 11) / 10
    const x = (i < 11 ? 0 : 600) + 30 + t * 540
    const y = 22 + Math.sin(t * Math.PI) * 34
    return { x, y, c: BULBS[i % BULBS.length] }
  })
  const snow = Array.from({ length: 28 }, (_, i) => ({ x: (i * 173) % 1200, y: 60 + ((i * 97) % 540), s: 3 + (i % 4) }))
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'Georgia, serif', color: '#FBF3E4',
        background: 'radial-gradient(900px 520px at 8% 0%, rgba(142,27,44,0.85), rgba(142,27,44,0) 70%), radial-gradient(800px 600px at 100% 40%, rgba(18,92,60,0.75), rgba(18,92,60,0) 70%), linear-gradient(180deg, #0B2219, #0A1A14 55%, #1A0A0F)' }}>
        {snow.map((f, i) => (
          <div key={`s${i}`} style={{ position: 'absolute', left: f.x, top: f.y, width: f.s, height: f.s, borderRadius: 99, background: 'rgba(255,253,246,0.7)' }} />
        ))}
        {bulbs.map((b, i) => (
          <div key={`b${i}`} style={{ position: 'absolute', left: b.x - 9, top: b.y - 9, width: 18, height: 22, borderRadius: 99, background: b.c, boxShadow: `0 0 18px 6px ${b.c}` }} />
        ))}
        <div style={{ position: 'absolute', left: 72, top: 118, display: 'flex', flexDirection: 'column', width: 720 }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 6, color: '#F3D78E', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>HOLIDAY GIVEAWAY · 2026</div>
          <div style={{ display: 'flex', marginTop: 18, fontSize: 104, lineHeight: 1, fontWeight: 700, color: '#F3D78E' }}>5 Businesses</div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, fontSize: 70, lineHeight: 1, fontStyle: 'italic' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 62, height: 62, borderRadius: 99, marginRight: 16, background: 'linear-gradient(135deg, #FFF3CF, #D9A94A 60%, #9C6F22)', color: '#4A0A14', fontSize: 46, fontStyle: 'normal', fontWeight: 700 }}>+</div>
            1 Future Founder
          </div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 30, fontStyle: 'italic', color: '#F3D78E' }}>blessed this holiday season.</div>
          <div style={{ display: 'flex', marginTop: 16, fontSize: 26, color: 'rgba(251,243,228,0.88)', fontFamily: 'Arial, sans-serif' }}>Free Yakini software + a website revamp.</div>
        </div>
        {/* wrapped gift */}
        <div style={{ position: 'absolute', right: 96, top: 210, width: 250, height: 210, display: 'flex', borderRadius: 14, background: 'linear-gradient(135deg, #B4243A, #6E0F1F)', boxShadow: '0 30px 60px rgba(0,0,0,0.45)' }}>
          <div style={{ position: 'absolute', left: 107, top: 0, width: 36, height: 210, background: 'linear-gradient(90deg, #9C6F22, #F7E2A4, #9C6F22)' }} />
          <div style={{ position: 'absolute', left: 0, top: 88, width: 250, height: 34, background: 'linear-gradient(180deg, #9C6F22, #F7E2A4, #9C6F22)' }} />
        </div>
        <div style={{ position: 'absolute', right: 80, top: 176, width: 282, height: 46, display: 'flex', borderRadius: 10, background: '#C42F45' }}>
          <div style={{ position: 'absolute', left: 123, top: 0, width: 36, height: 46, background: 'linear-gradient(90deg, #9C6F22, #F7E2A4, #9C6F22)' }} />
        </div>
        <div style={{ position: 'absolute', right: 166, top: 132, width: 56, height: 50, display: 'flex', borderRadius: 99, border: `12px solid ${GOLD}`, transform: 'rotate(-25deg)' }} />
        <div style={{ position: 'absolute', right: 222, top: 132, width: 56, height: 50, display: 'flex', borderRadius: 99, border: `12px solid ${GOLD}`, transform: 'rotate(25deg)' }} />
        <div style={{ position: 'absolute', left: 72, right: 72, bottom: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Arial, sans-serif', fontSize: 24 }}>
          <div style={{ display: 'flex', color: 'rgba(251,243,228,0.85)' }}>Yakini Digital × BRSA Foundation</div>
          <div style={{ display: 'flex', padding: '13px 26px', borderRadius: 99, background: 'linear-gradient(135deg, #F7E2A4, #D9A94A)', color: '#3D0812', fontWeight: 700 }}>Closes Dec 15 · yakini.digital/holiday</div>
        </div>
      </div>
    ),
    size,
  )
}
