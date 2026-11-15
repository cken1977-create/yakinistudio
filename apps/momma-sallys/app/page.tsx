import Link from 'next/link'
import { Photo, type PhotoKey } from '@/components/Photos'

const CATS: { href: string; title: string; es: string; text: string; cta: string; photo: PhotoKey }[] = [
  { href: '/food-truck', title: 'Food Truck', es: 'Camión', text: 'BBQ plates off the pit — brisket, sausage, chicken & pulled pork.', cta: 'Menu & location', photo: 'brisketPlate' },
  { href: '/catering', title: 'Catering', es: 'Banquetes', text: 'Grazing tables, buffets and charcuterie for any crowd.', cta: 'Plan catering', photo: 'grazing' },
  { href: '/events', title: 'Events', es: 'Eventos', text: 'Party spreads and homemade desserts, cobbler to banana pudding.', cta: 'See events', photo: 'cobbler' },
]
import { PaymentOptions } from '@/components/PaymentOptions'
import { ThanksgivingSpecial } from '@/components/ThanksgivingSpecial'
import { Reveal, RevealStyles } from '@/components/Reveal'
import { config } from '@/config/brand'
import { HeroVideo, LoopClip, ParallaxDriver } from '@/components/Alive'
import { EmberCanvas } from '@/components/EmberCanvas'
import { PHONE_DISPLAY, PHONE_TEL, SMS_LINK, HAS_PAY, PUBLIC_EMAIL } from '@/config/site'

const REEL = [
  { key: 'brisket-bark', title: 'Smoked brisket', text: 'Dark, peppery bark, straight off the pit.', alt: 'Close-up of smoked brisket with dark peppery bark' },
  { key: 'brisket-plate', title: 'The brisket plate', text: 'Beans, potatoes, green beans, cornbread & sauce.', alt: 'Brisket plate with beans, potatoes, green beans, cornbread and a cup of sauce' },
  { key: 'peach-cobbler', title: 'Peach cobbler', text: 'Homemade, for events & catering.', alt: 'Cups of peach cobbler with cinnamon sticks' },
] as const

const TICKER = ['Brisket', 'Sausage', 'Chicken', 'Pulled Pork', 'Mac & Cheese', 'Beans', 'Potato Salad', 'Green Beans', 'Corn', 'Banana Pudding', 'Catering', 'Events']

export default function HomePage() {
  const menu = config.menu!
  const plates = menu.categories[0]

  return (
    <>
      <style>{`
        .h-ctas { display: grid; gap: 12px; margin-top: 28px; }
        @media (min-width: 640px) { .h-ctas { display: flex; flex-wrap: wrap; } }
        .h-sec { padding: 72px 0; border-top: 1px solid var(--brand-border); }
        .h-sec h2 { font-size: clamp(32px, 7vw, 54px); letter-spacing: -.02em; margin-bottom: 10px; }
        .h-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-top: 32px; }
        .h-card { border: 1px solid var(--brand-border); border-radius: 18px; padding: 24px; background: #0b0b0b; }
        .h-card h3 { font-size: 22px; margin-bottom: 8px; }
        .h-price { font-family: var(--font-display); font-size: 22px; color: #fff; white-space: nowrap; }
        .h-row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px dotted var(--brand-border); }
        .h-cat { display: block; border: 1px solid var(--brand-border); border-radius: 20px; padding: 10px; background: #0b0b0b; transition: border-color .15s; }
        .h-cat:hover { border-color: var(--brand-primary); }
        .a-hero { position: relative; min-height: calc(100svh - 60px); display: flex; align-items: flex-end; padding: 110px 0 72px; overflow: hidden; background: #0a0503; isolation: isolate; --s: 0; }
        .a-hero-media { position: absolute; inset: 0; z-index: -3; transform: scale(calc(1.04 + var(--s) * .08)); transform-origin: 50% 60%; }
        .a-hero-poster, .a-hero-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .a-hero-poster { animation: a-kb 18s ease-in-out infinite alternate; }
        .a-hero-video { opacity: 0; transition: opacity 1.2s ease; }
        .a-hero-video.is-ready { opacity: 1; }
        .a-hero-warm { position: absolute; inset: 0; z-index: -2; pointer-events: none;
          background:
            radial-gradient(120% 80% at 70% 35%, rgba(255,140,40,.18) 0%, rgba(0,0,0,0) 55%),
            radial-gradient(140% 100% at 50% 40%, rgba(0,0,0,0) 35%, rgba(10,4,0,.75) 100%),
            linear-gradient(180deg, rgba(10,4,0,.35) 0%, rgba(20,6,0,.25) 35%, rgba(5,2,0,.82) 78%, #000 100%); }
        .a-hero-grain { position: absolute; inset: -50%; z-index: -1; pointer-events: none; opacity: .09; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          animation: a-grain 1.2s steps(6) infinite; }
        .a-hero canvas { z-index: -1; }
        .a-hero-in { position: relative; width: 100%; transform: translateY(calc(var(--s) * -60px)); opacity: calc(1 - var(--s) * 1.1); }
        .a-title { font-size: clamp(44px, 10.5vw, 108px); letter-spacing: -.025em; line-height: .98; margin: 0 0 22px; max-width: 13ch; text-shadow: 0 4px 40px rgba(0,0,0,.55); }
        .a-line { display: block; overflow: hidden; padding-bottom: .06em; }
        .a-line > * { display: inline-block; animation: a-up 1s cubic-bezier(.22,1,.36,1) both; animation-delay: var(--d, 0s); }
        .a-title em { color: #ffb347; font-style: italic; background: linear-gradient(92deg, #ffd27a 0%, #ff8a3d 45%, #e2382a 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .a-rise { animation: a-fade 1s cubic-bezier(.22,1,.36,1) both; animation-delay: var(--d, 0s); }
        .a-lede { font-size: clamp(17px, 2.2vw, 20px); color: #f1e6dc; max-width: 560px; line-height: 1.6; text-shadow: 0 2px 18px rgba(0,0,0,.6); }
        .a-ctas { display: grid; gap: 12px; margin-top: 28px; }
        @media (min-width: 640px) { .a-ctas { display: flex; flex-wrap: wrap; } }
        .a-glow { box-shadow: 0 0 0 0 rgba(179,18,27,.6); animation: a-pulse 2.6s ease-out 2s infinite; }
        .a-sub { display: flex; gap: 22px; margin-top: 18px; font-weight: 700; font-size: 15px; }
        .a-sub a { color: #ffd9a8; } .a-sub a:hover { color: #fff; }
        .a-eyebrow { color: #ffc56b; text-shadow: 0 1px 12px rgba(0,0,0,.8); }
        @media (max-width: 640px) { .a-hero { padding: 72px 0 40px; } .a-ticket { margin-bottom: 16px; font-size: 13px; } .a-title { margin-bottom: 16px; } .a-ctas { margin-top: 20px; gap: 10px; } }
        .a-ticket { display: inline-flex; align-items: center; gap: 10px; padding: 9px 16px; margin-bottom: 22px; border-radius: 999px; font-size: 14px; font-weight: 600; color: #fff;
          background: rgba(20,8,2,.55); border: 1px solid rgba(255,170,90,.55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); animation: a-fade .9s ease both; }
        .a-ticket strong { color: #ffc56b; font-size: 16px; }
        .a-ticket:hover { border-color: #ffc56b; }
        .a-ticket-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff8a3d; box-shadow: 0 0 12px #ff8a3d; animation: a-blink 1.6s ease-in-out infinite; }
        .a-cue { position: absolute; left: 50%; bottom: 18px; width: 26px; height: 42px; margin-left: -13px; border: 2px solid rgba(255,255,255,.55); border-radius: 14px; }
        .a-cue span { position: absolute; left: 50%; top: 8px; width: 4px; height: 8px; margin-left: -2px; border-radius: 2px; background: #fff; animation: a-cue 1.8s ease-in-out infinite; }
        @media (max-width: 899px) { .a-cue { display: none; } }
        .a-ticker { overflow: hidden; border-top: 1px solid rgba(255,170,90,.25); border-bottom: 1px solid rgba(255,170,90,.25); background: linear-gradient(90deg, #120602, #1d0a03, #120602); padding: 14px 0; }
        .a-ticker-track { display: flex; width: max-content; animation: a-marquee 38s linear infinite; }
        .a-ticker-track > span { display: flex; }
        .a-ticker-track > span > span { font-family: var(--font-display); font-style: italic; font-size: clamp(20px, 3vw, 30px); color: #f6e7d6; white-space: nowrap; padding: 0 18px; }
        .a-ticker i { font-style: normal; color: var(--brand-primary); padding-left: 36px; font-size: .7em; vertical-align: middle; }
        .a-reel h2 { max-width: 16ch; }
        .a-reel-grid { display: grid; gap: 18px; margin-top: 36px; grid-template-columns: 1fr; }
        @media (min-width: 760px) { .a-reel-grid { grid-template-columns: 1.05fr 1.2fr .95fr; align-items: start; } .a-reel-1 { margin-top: 64px; } .a-reel-2 { margin-top: 18px; } }
        .a-reel-item { margin: 0; --p: 0; transform: translateY(calc(var(--p) * -40px)); will-change: transform; }
        .a-reel-1 { transform: translateY(calc(var(--p) * -80px)); }
        .a-clip { position: relative; border-radius: 22px; overflow: hidden; background: #140802; box-shadow: 0 30px 60px -30px rgba(255,110,30,.35), 0 0 0 1px rgba(255,170,90,.15); }
        .a-reel-0 .a-clip { aspect-ratio: 3 / 4; } .a-reel-1 .a-clip { aspect-ratio: 4 / 3; } .a-reel-2 .a-clip { aspect-ratio: 1 / 1; }
        .a-clip img, .a-clip video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .a-clip video { opacity: 0; transition: opacity .8s ease; }
        .a-clip video.is-ready { opacity: 1; }
        .a-clip::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.45)); pointer-events: none; }
        .a-reel figcaption { display: grid; gap: 2px; padding: 14px 4px 0; }
        .a-reel figcaption strong { font-family: var(--font-display); font-size: 24px; }
        .a-reel figcaption span { color: var(--brand-muted); font-size: 15px; }
        @keyframes a-up { from { transform: translateY(105%); } to { transform: none; } }
        @keyframes a-fade { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes a-kb { from { transform: scale(1); } to { transform: scale(1.07) translate(-1%, -1%); } }
        @keyframes a-grain { 0% { transform: translate(0,0); } 20% { transform: translate(-3%,2%); } 40% { transform: translate(2%,-3%); } 60% { transform: translate(-2%,-1%); } 80% { transform: translate(3%,3%); } 100% { transform: translate(0,0); } }
        @keyframes a-pulse { 0% { box-shadow: 0 0 0 0 rgba(255,80,40,.55); } 70% { box-shadow: 0 0 0 16px rgba(255,80,40,0); } 100% { box-shadow: 0 0 0 0 rgba(255,80,40,0); } }
        @keyframes a-blink { 50% { opacity: .35; } }
        @keyframes a-cue { 0% { opacity: 0; transform: translateY(0); } 40% { opacity: 1; } 100% { opacity: 0; transform: translateY(14px); } }
        @keyframes a-marquee { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .a-hero-media, .a-hero-in, .a-reel-item, .a-reel-1 { transform: none !important; opacity: 1 !important; }
          .a-hero-poster, .a-hero-grain, .a-line > *, .a-rise, .a-glow, .a-ticket, .a-ticket-dot, .a-cue span, .a-ticker-track { animation: none !important; }
        }
        .h-plate { background: linear-gradient(180deg, rgba(0,0,0,.6), rgba(0,0,0,.92)), url('/backdrop-platter.png') center / cover no-repeat; }
      `}</style>

      <RevealStyles />
      <noscript><style>{`.ms-reveal { opacity: 1 !important; transform: none !important; }`}</style></noscript>
      <ParallaxDriver />
      {/* HERO — living food film (our own clips, made from Momma Sally's real plates) */}
      <section className="a-hero" aria-labelledby="a-hero-title">
        <HeroVideo
          desktop={{ mp4: '/alive/hero-brisket.mp4', webm: '/alive/hero-brisket.webm' }}
          mobile={{ mp4: '/alive/hero-mobile.mp4', webm: '/alive/hero-mobile.webm' }}
          poster="/alive/hero-brisket-poster.webp"
          posterMobile="/alive/hero-mobile-poster.webp"
          alt=""
        />
        <div className="a-hero-warm" aria-hidden="true" />
        <div className="a-hero-grain" aria-hidden="true" />
        <EmberCanvas density={26} />
        <div className="ms-wrap a-hero-in">
          <a href="#thanksgiving" className="a-ticket">
            <span className="a-ticket-dot" aria-hidden="true" />
            Thanksgiving · 5 half pans <strong>$125</strong>
            <span aria-hidden="true">→</span>
          </a>
          <div className="ms-eyebrow a-rise a-eyebrow" style={{ ['--d' as string]: '.15s' }}>Smoked low &amp; slow · West Texas</div>
          <h1 id="a-hero-title" className="a-title">
            <span className="a-line"><span style={{ ['--d' as string]: '.25s' }}>More than BBQ,</span></span>
            <span className="a-line"><em style={{ ['--d' as string]: '.42s' }}>it&rsquo;s a Southern</em></span>
            <span className="a-line"><em style={{ ['--d' as string]: '.58s' }}>experience.</em></span>
          </h1>
          <p className="a-rise a-lede" style={{ ['--d' as string]: '.8s' }}>
            Cooked with love, served with soul. Brisket, sausage, chicken &amp; pulled pork off the pit — with real sides, sauce and something sweet.
          </p>
          <p className="ms-es a-rise" style={{ ['--d' as string]: '.9s', fontSize: 15, marginTop: 6 }}>Más que BBQ, es una experiencia sureña. Cocinado con amor, servido con alma.</p>
          <div className="a-ctas a-rise" style={{ ['--d' as string]: '1.05s' }}>
            <a href={PHONE_TEL} className="ms-btn ms-btn-red a-glow">Order · Call {PHONE_DISPLAY}</a>
            <Link href="/catering" className="ms-btn ms-btn-white">Catering · Banquetes</Link>
            <Link href="/food-truck" className="ms-btn ms-btn-ghost">Food Truck · Camión</Link>
          </div>
          <div className="a-sub a-rise" style={{ ['--d' as string]: '1.2s' }}>
            <Link href="/menu">View Menu · Ver Menú →</Link>
            {HAS_PAY && <Link href="/pay">Pay · Pagar →</Link>}
          </div>
        </div>
        <a href="#a-reel" className="a-cue" aria-label="Scroll to see the food"><span /></a>
      </section>

      {/* TICKER */}
      <div className="a-ticker" aria-hidden="true">
        <div className="a-ticker-track">
          {[0, 1].map(n => (
            <span key={n}>{TICKER.map(t => <span key={t + n}>{t}<i>✦</i></span>)}</span>
          ))}
        </div>
      </div>

      {/* DISH REEL — scroll-triggered living clips */}
      <section className="h-sec a-reel" id="a-reel" aria-labelledby="a-reel-title">
        <div className="ms-wrap">
          <Reveal>
            <div className="ms-eyebrow">Straight off the pit · Directo del asador</div>
            <h2 id="a-reel-title">Smoke, bark &amp; <em style={{ color: 'var(--brand-primary)' }}>something sweet.</em></h2>
          </Reveal>
          <div className="a-reel-grid">
            {REEL.map((r, i) => (
              <figure key={r.key} className={`a-reel-item a-reel-${i}`} data-parallax>
                <Reveal delay={i * 120}>
                  <LoopClip clip={{ mp4: `/alive/${r.key}.mp4`, webm: `/alive/${r.key}.webm` }} poster={`/alive/${r.key}-poster.webp`} alt={r.alt} />
                  <figcaption>
                    <strong>{r.title}</strong>
                    <span>{r.text}</span>
                  </figcaption>
                </Reveal>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="h-sec" aria-label="Thanksgiving special">
        <div className="ms-wrap">
          <ThanksgivingSpecial />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="h-sec">
        <div className="ms-wrap">
          <Reveal>
            <div className="ms-eyebrow">What We Do · Lo Que Hacemos</div>
            <h2>Food truck, catering &amp; events.</h2>
          </Reveal>
          <div className="h-grid">
            {CATS.map(c => (
              <Link key={c.href} href={c.href} className="h-cat">
                <Photo k={c.photo} aspect="4 / 3" sizes="(min-width: 900px) 33vw, 100vw" />
                <div style={{ padding: '16px 4px 4px' }}>
                  <h3 style={{ fontSize: 26 }}>{c.title} <span className="ms-es" style={{ fontSize: 15, fontFamily: 'var(--font-body)' }}>· {c.es}</span></h3>
                  <p style={{ color: 'var(--brand-muted)', fontSize: 15, marginTop: 4 }}>{c.text}</p>
                  <span style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 14, display: 'inline-block', marginTop: 8 }}>{c.cta} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MENU PREVIEW */}
      <section className="h-sec">
        <div className="ms-wrap">
          <div className="ms-eyebrow">The Menu · El Menú</div>
          <h2>{plates.name}</h2>
          <p style={{ color: 'var(--brand-muted)', maxWidth: 560 }}>{plates.note}</p>
          <div style={{ maxWidth: 640, marginTop: 24 }}>
            {plates.items.map(item => (
              <div className="h-row" key={item.name}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  {item.nameTranslated && <div className="ms-es" style={{ fontSize: 13 }}>{item.nameTranslated}</div>}
                </div>
                {item.price && <div className="h-price">{item.price}</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28 }}>
            <Link href="/menu" className="ms-btn ms-btn-red">See Full Menu · Menú Completo</Link>
          </div>
        </div>
      </section>

      {/* FIND US */}
      <section className="h-sec h-plate" id="find-us">
        <div className="ms-wrap">
          <div className="ms-eyebrow">Find the Truck · Encuéntranos</div>
          <h2>Rolling around West Texas.</h2>
          <p style={{ color: '#ddd', maxWidth: 560, fontSize: 17 }}>
            Different stops, same great flavor! Call for our daily location.
          </p>
          <p className="ms-es" style={{ marginTop: 6 }}>Diferentes paradas, ¡el mismo gran sabor! Llámanos para saber nuestra ubicación del día.</p>
          <div className="h-ctas">
            <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call for Today&rsquo;s Location</a>
            <a href={SMS_LINK} className="ms-btn ms-btn-ghost">Text Us</a>
          </div>
          <div style={{ marginTop: 32, maxWidth: 560 }}><PaymentOptions /></div>
        </div>
      </section>

      {/* STORY */}
      <section className="h-sec">
        <div className="ms-wrap" style={{ maxWidth: 820 }}>
          <div className="ms-eyebrow">{config.about.headline}</div>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(24px, 5vw, 38px)', lineHeight: 1.35 }}>
            &ldquo;{config.about.mission}&rdquo;
          </p>
          <div style={{ marginTop: 24 }}>
            <Link href="/about" className="ms-btn ms-btn-ghost">Our Story</Link>
          </div>
        </div>
      </section>
    </>
  )
}
