import Image from 'next/image'

// Hero centerpiece: a photographed wine-red gift box whose lid lifts on arrival, light
// spills out, and the gift rises out of it as the actual product (Yakini UI cards).
// Pure CSS animation (no JS), so it runs on first paint, also with JavaScript off.
// Under prefers-reduced-motion the page CSS shows the finished composite, static.
// Every number and name in these cards is SAMPLE data: no real EINs, clients or prices.

const CHECKS = ['LLC registered', 'EIN', 'Business bank account', 'Website live', 'AI receptionist']

export function HeroGift() {
  return (
    <div className="hg3" aria-hidden="true">
      <div className="hg3-stage">
        {/* light from inside the box */}
        <div className="hg3-beam" />
        <div className="hg3-bloom" />

        {/* cards rising out of the box (behind the box face until they clear the rim) */}
        <div className="hg3-card-wrap hg3-c1"><div className="hg3-float" style={{ animationDelay: '0s' }}>
          <div className="hg3-card">
            <div className="hg3-head"><span>Business setup</span><em>Sample</em></div>
            <ul className="hg3-checks">
              {CHECKS.map((c, i) => (
                <li key={c} style={{ ['--i' as string]: i } as React.CSSProperties}><span>{c}</span><b>✓</b></li>
              ))}
            </ul>
            <div className="hg3-progress"><i /></div>
          </div>
        </div></div>

        <div className="hg3-card-wrap hg3-c2"><div className="hg3-float" style={{ animationDelay: '-2s' }}>
          <div className="hg3-card hg3-web">
            <div className="hg3-chrome"><i /><i /><i /><span>yourbusiness.com</span><em className="hg3-live">Live</em></div>
            <div className="hg3-site">
              <div className="hg3-site-nav"><b>Rosa’s Bakery</b><span>Menu</span><span>Order</span><span>Visit</span></div>
              <div className="hg3-site-hero">
                <div className="hg3-site-h">Baked fresh,<br /><span>every morning.</span></div>
                <div className="hg3-site-btn">Order ahead →</div>
              </div>
            </div>
          </div>
        </div></div>

        <div className="hg3-card-wrap hg3-c3"><div className="hg3-float" style={{ animationDelay: '-4s' }}>
          <div className="hg3-card">
            <div className="hg3-head"><span>AI receptionist</span><em>Sample</em></div>
            <div className="hg3-call">
              <div className="hg3-wave">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 7) * 0.12}s` }} />)}</div>
              <div className="hg3-call-t"><b>Call answered</b><span>Booked Thu · 10:00 AM</span></div>
            </div>
          </div>
        </div></div>

        {/* the box (photograph) and its lid */}
        <div className="hg3-box">
          <Image src="/holiday/box-base.png" alt="" width={698} height={659} priority sizes="(max-width: 899px) 62vw, 400px" />
        </div>
        <div className="hg3-lid">
          <div className="hg3-lid-float">
            <Image src="/holiday/box-lid.png" alt="" width={856} height={551} priority sizes="(max-width: 899px) 66vw, 430px" />
          </div>
        </div>

        {/* last card lands in front of the box */}
        <div className="hg3-card-wrap hg3-c4"><div className="hg3-float" style={{ animationDelay: '-1s' }}>
          <div className="hg3-card">
            <div className="hg3-head"><span>Today</span><em>Sample</em></div>
            <div className="hg3-row"><span>9:00</span><b>Consultation</b><i className="ok">Booked</i></div>
            <div className="hg3-row"><span>11:30</span><b>Catering order</b><i className="ok">Paid ✓</i></div>
            <div className="hg3-row"><span>2:15</span><b>New lead · website</b><i>Replied</i></div>
          </div>
        </div></div>

        <div className="hg3-glints">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ ['--k' as string]: i } as React.CSSProperties} />)}</div>
      </div>
    </div>
  )
}

/* All sizes are in cqw (percent of the stage width), so the composition scales as one piece
   from a phone to a desktop. Final positions are the base styles; the keyframes animate
   *from* the closed box, so reduced motion simply shows the finished scene. */
export const HERO_GIFT_CSS = `
  .hg3 { width: 100%; container-type: inline-size; }
  .hg3-stage { position: relative; width: 100%; aspect-ratio: 1 / 1.08; }
  .hg3-box { position: absolute; left: 21cqw; bottom: 0; width: 58cqw; z-index: 4; filter: drop-shadow(0 4cqw 6cqw rgba(0,0,0,0.6)); }
  .hg3-box img, .hg3-lid img { width: 100%; height: auto; display: block; }
  .hg3-lid { position: absolute; left: 66cqw; top: 27cqw; width: 34cqw; z-index: 1; transform: rotate(16deg); transform-origin: 50% 50%;
    animation: hg3-lid 1.6s cubic-bezier(.3,.0,.15,1) .55s both; filter: drop-shadow(0 3cqw 4cqw rgba(0,0,0,0.55)); }
  .hg3-lid-float { animation: hg3-idle 7s ease-in-out 2.4s infinite; }
  @keyframes hg3-lid {
    0%   { transform: translate(-33cqw, 26cqw) rotate(0deg) scale(1.84); }
    22%  { transform: translate(-33cqw, 23cqw) rotate(-2deg) scale(1.84); }
    100% { transform: rotate(16deg); }
  }
  .hg3-beam { position: absolute; left: 22cqw; width: 56cqw; bottom: 46cqw; height: 60cqw; z-index: 0; pointer-events: none;
    background: radial-gradient(60% 100% at 50% 100%, rgba(255,214,140,0.42), rgba(255,200,120,0.12) 55%, transparent 75%);
    clip-path: polygon(18% 100%, 82% 100%, 100% 0, 0 0); filter: blur(1.4cqw); mix-blend-mode: screen;
    animation: hg3-light 1.4s ease-out 1s both; }
  .hg3-bloom { position: absolute; left: 30cqw; width: 40cqw; bottom: 40cqw; height: 14cqw; z-index: 5; border-radius: 50%; pointer-events: none;
    background: radial-gradient(closest-side, rgba(255,236,190,0.75), rgba(255,200,120,0.25) 60%, transparent); mix-blend-mode: screen; filter: blur(1cqw);
    animation: hg3-bloom 2.2s ease-out .9s both; opacity: .55; }
  @keyframes hg3-light { from { opacity: 0; transform: scaleY(0.2); transform-origin: 50% 100%; } to { opacity: 1; transform: none; } }
  @keyframes hg3-bloom { 0% { opacity: 0; transform: scale(.4); } 35% { opacity: 1; transform: scale(1.25); } 100% { opacity: .55; transform: none; } }

  .hg3-card-wrap { position: absolute; z-index: 2; animation: hg3-rise 1.25s cubic-bezier(.16,.84,.3,1) both; }
  .hg3-float { animation: hg3-idle 8s ease-in-out infinite; }
  @keyframes hg3-idle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-0.9cqw); } }
  @keyframes hg3-rise { 0% { opacity: 0; transform: translate(var(--fx, 0), var(--fy, 40cqw)) scale(.55); } 25% { opacity: 1; } 100% { opacity: 1; transform: none; } }
  .hg3-c1 { left: 0; top: 12cqw; width: 40cqw; --fx: 20cqw; --fy: 44cqw; animation-delay: 1.25s; }
  .hg3-c2 { right: 0; top: 0; width: 50cqw; --fx: -14cqw; --fy: 52cqw; animation-delay: 1.5s; }
  .hg3-c3 { left: 43cqw; top: 35cqw; width: 40cqw; --fx: -6cqw; --fy: 22cqw; animation-delay: 1.8s; z-index: 3; }
  .hg3-c4 { left: -2cqw; bottom: 3cqw; width: 44cqw; z-index: 6; --fx: -12cqw; --fy: 6cqw; animation: hg3-slide 1.1s cubic-bezier(.16,.84,.3,1) 2.15s both; }
  @keyframes hg3-slide { from { opacity: 0; transform: translate(-8cqw, 4cqw) scale(.92); } to { opacity: 1; transform: none; } }

  .hg3-card { font-family: var(--font-body); font-size: 2.35cqw; line-height: 1.35; color: #EEF1FA; border-radius: 2.6cqw; padding: 2.6cqw 2.8cqw;
    background: linear-gradient(160deg, rgba(28,34,52,0.82), rgba(12,16,28,0.86)); border: 1px solid rgba(255,255,255,0.14);
    box-shadow: 0 3cqw 7cqw rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
  .hg3-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.6cqw; font-size: 2.15cqw; font-weight: 600; letter-spacing: .02em; color: #FFFFFF; }
  .hg3-head em { font-style: normal; font-family: var(--font-mono); font-size: 1.55cqw; letter-spacing: .14em; text-transform: uppercase; color: rgba(238,241,250,0.5); }
  .hg3-checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 1cqw; }
  .hg3-checks li { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1cqw; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .hg3-checks li:last-child { border-bottom: 0; padding-bottom: 0; }
  .hg3-checks b { display: grid; place-items: center; width: 3.2cqw; height: 3.2cqw; border-radius: 50%; font-size: 1.9cqw; color: #0B1437; background: #C6F432;
    animation: hg3-tick .45s cubic-bezier(.2,1.6,.4,1) both; animation-delay: calc(2.6s + var(--i) * .22s); }
  @keyframes hg3-tick { from { transform: scale(0); opacity: 0; } to { transform: none; opacity: 1; } }
  .hg3-progress { margin-top: 1.8cqw; height: .7cqw; border-radius: 1cqw; background: rgba(255,255,255,0.1); overflow: hidden; }
  .hg3-progress i { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #C6F432, #E2B95C); transform-origin: left; animation: hg3-bar 1.3s ease-out 2.6s both; }
  @keyframes hg3-bar { from { transform: scaleX(0); } to { transform: none; } }

  .hg3-web { padding: 0; overflow: hidden; }
  .hg3-chrome { display: flex; align-items: center; gap: .8cqw; padding: 1.5cqw 2cqw; background: rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.08); font-family: var(--font-mono); font-size: 1.6cqw; color: rgba(238,241,250,0.65); }
  .hg3-chrome i { width: 1.2cqw; height: 1.2cqw; border-radius: 50%; background: rgba(255,255,255,0.22); }
  .hg3-chrome span { margin-left: 1cqw; flex: 1; }
  .hg3-live { font-style: normal; padding: .3cqw 1.2cqw; border-radius: 9cqw; background: rgba(198,244,50,0.16); color: #C6F432; }
  .hg3-site { background: linear-gradient(135deg, #F7EFE2, #EAD9BE); color: #2B1B14; }
  .hg3-site-nav { display: flex; gap: 2cqw; align-items: center; padding: 1.6cqw 2.4cqw; font-size: 1.7cqw; color: #6B5040; }
  .hg3-site-nav b { margin-right: auto; font-family: var(--font-display); font-size: 2.5cqw; color: #4A0A14; }
  .hg3-site-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 2cqw; padding: 1cqw 2.4cqw 3cqw; min-height: 15cqw;
    background: radial-gradient(80% 120% at 85% 20%, rgba(180,36,58,0.22), transparent 60%); }
  .hg3-site-h { font-family: var(--font-display); font-size: 4.4cqw; line-height: 1; color: #2B1B14; }
  .hg3-site-h span { font-style: italic; color: #8E1B2C; }
  .hg3-site-btn { flex-shrink: 0; padding: 1cqw 1.8cqw; border-radius: 9cqw; background: #8E1B2C; color: #FFF6E2; font-size: 1.6cqw; font-weight: 600; }

  .hg3-call { display: flex; align-items: center; gap: 2cqw; }
  .hg3-wave { display: flex; align-items: center; gap: .45cqw; height: 6cqw; }
  .hg3-wave i { width: .6cqw; height: 100%; border-radius: 1cqw; background: linear-gradient(#C6F432, #E2B95C); transform-origin: center; animation: hg3-wave 1.1s ease-in-out infinite; }
  @keyframes hg3-wave { 0%, 100% { transform: scaleY(0.25); } 50% { transform: scaleY(1); } }
  .hg3-call-t { display: grid; gap: .3cqw; }
  .hg3-call-t b { font-weight: 600; color: #FFFFFF; }
  .hg3-call-t span { color: rgba(238,241,250,0.7); font-size: 2.05cqw; }

  .hg3-row { display: grid; grid-template-columns: 5.5cqw 1fr auto; gap: 1.4cqw; align-items: center; padding: .9cqw 0; border-top: 1px solid rgba(255,255,255,0.07); font-size: 2.1cqw; }
  .hg3-row:first-of-type { border-top: 0; }
  .hg3-row span { font-family: var(--font-mono); font-size: 1.75cqw; color: rgba(238,241,250,0.55); }
  .hg3-row b { font-weight: 500; color: #EEF1FA; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hg3-row i { font-style: normal; font-size: 1.7cqw; padding: .3cqw 1.2cqw; border-radius: 9cqw; background: rgba(255,255,255,0.08); color: rgba(238,241,250,0.8); }
  .hg3-row i.ok { background: rgba(198,244,50,0.14); color: #C6F432; }

  .hg3-glints { position: absolute; inset: 0; z-index: 7; pointer-events: none; }
  .hg3-glints i { position: absolute; left: calc(36cqw + var(--k) * 3.4cqw); bottom: 44cqw; width: .7cqw; height: .7cqw; border-radius: 50%; background: #FFE9B8;
    box-shadow: 0 0 1.4cqw .4cqw rgba(255,214,140,0.8); opacity: 0; animation: hg3-glint 3.6s ease-out infinite; animation-delay: calc(1.2s + var(--k) * .37s); }
  @keyframes hg3-glint { 0% { opacity: 0; transform: translateY(0) scale(.6); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-34cqw) scale(1); } }

  @media (prefers-reduced-motion: reduce) {
    .hg3 *, .hg3 *::before, .hg3 *::after { animation: none !important; }
    .hg3-glints { display: none; }
  }
`
