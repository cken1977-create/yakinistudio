// Festive art for /holiday: night sky with warm bokeh and gentle snow, a string of lights,
// a stack of gifts and a gold bow. Server-rendered SVG/CSS only (no images, no JS), so it's
// light on phones. All motion is switched off for prefers-reduced-motion in the page CSS.

const rnd = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}
const fx = (n: number, d = 2) => Number(n.toFixed(d))

const BOKEH_COLORS = [
  'rgba(255,200,110,0.55)', 'rgba(255,170,80,0.45)', 'rgba(214,58,74,0.40)',
  'rgba(255,226,160,0.50)', 'rgba(88,170,120,0.32)', 'rgba(255,190,120,0.42)',
]

/** Fixed festive backdrop: deep evergreen/wine night, glowing bokeh, falling snow. */
export function FestiveSky() {
  const bokeh = Array.from({ length: 16 }, (_, i) => ({
    left: fx(rnd(i, 1) * 100), top: fx(rnd(i, 2) * 100), size: Math.round(36 + rnd(i, 3) * 150),
    color: BOKEH_COLORS[i % BOKEH_COLORS.length], dur: fx(7 + rnd(i, 4) * 9), delay: fx(-rnd(i, 5) * 12),
    blur: fx(1 + rnd(i, 6) * 6, 1),
  }))
  const snow = Array.from({ length: 42 }, (_, i) => ({
    left: fx(rnd(i, 7) * 100), size: fx(2 + rnd(i, 8) * 4.5, 1), op: fx(0.35 + rnd(i, 9) * 0.55),
    dur: fx(11 + rnd(i, 10) * 14), delay: fx(-rnd(i, 11) * 25), sway: i % 2 ? 'a' : 'b',
  }))
  return (
    <div className="hx-sky" aria-hidden="true">
      <div className="hx-sky-glow" />
      {bokeh.map((b, i) => (
        <span key={`b${i}`} className="hx-bokeh" style={{
          left: `${b.left}%`, top: `${b.top}%`, width: b.size, height: b.size,
          background: `radial-gradient(circle, ${b.color} 0%, transparent 68%)`,
          filter: `blur(${b.blur}px)`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`,
        }} />
      ))}
      <div className="hx-snow">
        {snow.map((s, i) => (
          <span key={`s${i}`} className={`hx-flake hx-flake-${s.sway}`} style={{
            left: `${s.left}%`, width: s.size, height: s.size, opacity: s.op,
            animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

const BULBS = ['#FFD98A', '#E8424F', '#FFF1C9', '#3FAF6E', '#FFB547']

/** A swag of string lights across the top of the hero (wide and narrow versions). */
export function StringLights() {
  const make = (w: number, swags: number, sag: number, perSwag: number, r: number) => {
    const seg = w / swags
    let d = ''
    const bulbs: { x: number; y: number; c: string; delay: number }[] = []
    for (let s = 0; s < swags; s++) {
      const x0 = s * seg, x1 = x0 + seg, cx = x0 + seg / 2, y0 = 6, cy = y0 + sag * 2
      d += `${s === 0 ? `M${x0},${y0}` : ''} Q${cx},${cy} ${x1},${y0} `
      for (let k = 1; k <= perSwag; k++) {
        const t = k / (perSwag + 1)
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1
        const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y0
        const n = s * perSwag + k
        bulbs.push({ x: fx(x, 1), y: fx(y + r * 1.6, 1), c: BULBS[n % BULBS.length], delay: fx(rnd(n, 12) * 3, 2) })
      }
    }
    return (
      <svg viewBox={`0 0 ${w} ${sag + 40}`} preserveAspectRatio="xMidYMin meet" aria-hidden="true">
        <path d={d} fill="none" stroke="#2B3A2E" strokeWidth="2" />
        {bulbs.map((b, i) => (
          <g key={i} className="hx-bulb" style={{ animationDelay: `${b.delay}s`, color: b.c }}>
            <circle className="hx-bulb-glow" cx={b.x} cy={b.y} r={r * 3} fill={b.c} />
            <rect x={b.x - r * 0.45} y={b.y - r * 1.9} width={r * 0.9} height={r * 0.8} rx="1" fill="#3B3B30" />
            <ellipse cx={b.x} cy={b.y} rx={r * 0.8} ry={r} fill={b.c} />
          </g>
        ))}
      </svg>
    )
  }
  return (
    <div className="hx-lights" aria-hidden="true">
      <div className="hx-lights-wide">{make(1400, 5, 34, 7, 5)}</div>
      <div className="hx-lights-narrow">{make(400, 2, 22, 6, 4.2)}</div>
    </div>
  )
}

/** Stack of three wrapped gifts with gold ribbons, a bow and a few sparkles. */
export function GiftStack() {
  return (
    <div className="hx-gifts" aria-hidden="true">
      <svg viewBox="0 0 360 340" className="hx-gifts-svg">
        <defs>
          <linearGradient id="hxRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B4243A" /><stop offset="1" stopColor="#6E0F1F" /></linearGradient>
          <linearGradient id="hxGreen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1F6B47" /><stop offset="1" stopColor="#0B3A26" /></linearGradient>
          <linearGradient id="hxCream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF6E2" /><stop offset="1" stopColor="#E9D6AE" /></linearGradient>
          <linearGradient id="hxGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F7E2A4" /><stop offset=".5" stopColor="#D9A94A" /><stop offset="1" stopColor="#9C6F22" /></linearGradient>
          <radialGradient id="hxGlow"><stop offset="0" stopColor="rgba(255,214,140,0.55)" /><stop offset="1" stopColor="rgba(255,214,140,0)" /></radialGradient>
        </defs>
        <ellipse cx="180" cy="318" rx="160" ry="16" fill="rgba(0,0,0,0.35)" />
        <circle cx="180" cy="190" r="170" fill="url(#hxGlow)" />
        {/* big red gift */}
        <rect x="40" y="170" width="170" height="145" rx="8" fill="url(#hxRed)" />
        <rect x="30" y="148" width="190" height="34" rx="6" fill="#C42F45" />
        <rect x="113" y="148" width="24" height="167" fill="url(#hxGold)" />
        <rect x="40" y="226" width="170" height="20" fill="url(#hxGold)" opacity=".95" />
        <path d="M125 148 C 95 108, 58 118, 72 140 C 82 154, 108 150, 125 148 Z" fill="url(#hxGold)" />
        <path d="M125 148 C 155 108, 192 118, 178 140 C 168 154, 142 150, 125 148 Z" fill="url(#hxGold)" />
        <circle cx="125" cy="147" r="9" fill="#F7E2A4" />
        {/* green gift */}
        <rect x="200" y="210" width="125" height="105" rx="8" fill="url(#hxGreen)" />
        <rect x="193" y="194" width="139" height="26" rx="5" fill="#25784F" />
        <rect x="255" y="194" width="16" height="121" fill="url(#hxGold)" />
        <path d="M263 194 C 240 166, 214 174, 224 190 C 231 200, 250 197, 263 194 Z" fill="url(#hxGold)" />
        <path d="M263 194 C 286 166, 312 174, 302 190 C 295 200, 276 197, 263 194 Z" fill="url(#hxGold)" />
        {/* cream gift on top */}
        <rect x="150" y="84" width="96" height="70" rx="6" fill="url(#hxCream)" transform="rotate(-6 198 119)" />
        <rect x="190" y="80" width="14" height="78" fill="#B4243A" transform="rotate(-6 198 119)" />
        <rect x="148" y="112" width="100" height="12" fill="#B4243A" transform="rotate(-6 198 119)" />
        {/* sparkles */}
        {[[54, 78, 1], [316, 120, 0.8], [292, 40, 0.6], [24, 220, 0.7], [340, 250, 0.55]].map(([x, y, s], i) => (
          <path key={i} className="hx-spark" style={{ animationDelay: `${i * 0.7}s` }}
            d={`M${x} ${y - 14 * s} L${x + 3.5 * s} ${y - 3.5 * s} L${x + 14 * s} ${y} L${x + 3.5 * s} ${y + 3.5 * s} L${x} ${y + 14 * s} L${x - 3.5 * s} ${y + 3.5 * s} L${x - 14 * s} ${y} L${x - 3.5 * s} ${y - 3.5 * s} Z`}
            fill="#FCE7AE" />
        ))}
      </svg>
    </div>
  )
}

/** Gold bow that sits on the top edge of the form card. */
export function Bow({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 70" aria-hidden="true">
      <defs><linearGradient id="hxBowG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F7E2A4" /><stop offset=".5" stopColor="#D9A94A" /><stop offset="1" stopColor="#9C6F22" /></linearGradient></defs>
      <path d="M60 34 C 40 2, 6 6, 12 28 C 17 44, 44 40, 60 34 Z" fill="url(#hxBowG)" />
      <path d="M60 34 C 80 2, 114 6, 108 28 C 103 44, 76 40, 60 34 Z" fill="url(#hxBowG)" />
      <path d="M56 36 L 40 68 L 50 64 L 56 70 L 60 40 Z" fill="#B88A35" />
      <path d="M64 36 L 80 68 L 70 64 L 64 70 L 60 40 Z" fill="#B88A35" />
      <ellipse cx="60" cy="34" rx="10" ry="9" fill="#F3D78E" stroke="#9C6F22" strokeWidth="1.5" />
    </svg>
  )
}

/** Small gold line icons for the "what they receive" cards. */
export function GiftIcon({ kind }: { kind: 'software' | 'web' | 'person' | 'seed' }) {
  const common = { fill: 'none', stroke: '#E2B95C', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg className="hx-icon" viewBox="0 0 32 32" aria-hidden="true">
      {kind === 'software' && (<><rect x="4" y="6" width="24" height="17" rx="2.5" {...common} /><path d="M12 27h8M16 23v4M9 12h8M9 16h12" {...common} /></>)}
      {kind === 'web' && (<><rect x="4" y="5" width="24" height="22" rx="2.5" {...common} /><path d="M4 11h24M8 8h.01M11 8h.01M9 16h9M9 20h14" {...common} /></>)}
      {kind === 'person' && (<><circle cx="16" cy="11" r="5" {...common} /><path d="M6 27c1.5-5 5.5-8 10-8s8.5 3 10 8" {...common} /></>)}
      {kind === 'seed' && (<><path d="M16 28V15" {...common} /><path d="M16 17c0-6 4-9 10-9 0 6-4 9-10 9zM16 20c0-5-3-8-9-8 0 5 3 8 9 8z" {...common} /></>)}
    </svg>
  )
}
