// Atmosphere for /holiday: a quiet night sky with soft, warm out-of-focus lights and a few
// fine snowflakes. Server-rendered CSS only (no images, no JS), so it's light on phones. All motion is switched off for prefers-reduced-motion in the page CSS.

const rnd = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}
const fx = (n: number, d = 2) => Number(n.toFixed(d))

const BOKEH_COLORS = ['rgba(255,206,130,0.30)', 'rgba(255,186,110,0.24)', 'rgba(255,228,170,0.26)', 'rgba(170,40,60,0.22)']

/** Fixed festive backdrop: deep evergreen/wine night, glowing bokeh, falling snow. */
export function FestiveSky() {
  const bokeh = Array.from({ length: 10 }, (_, i) => ({
    left: fx(rnd(i, 1) * 100), top: fx(rnd(i, 2) * 100), size: Math.round(60 + rnd(i, 3) * 180),
    color: BOKEH_COLORS[i % BOKEH_COLORS.length], dur: fx(7 + rnd(i, 4) * 9), delay: fx(-rnd(i, 5) * 12),
    blur: fx(6 + rnd(i, 6) * 10, 1),
  }))
  const snow = Array.from({ length: 26 }, (_, i) => ({
    left: fx(rnd(i, 7) * 100), size: fx(1.5 + rnd(i, 8) * 2.5, 1), op: fx(0.25 + rnd(i, 9) * 0.4),
    dur: fx(16 + rnd(i, 10) * 16), delay: fx(-rnd(i, 11) * 25), sway: i % 2 ? 'a' : 'b',
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
