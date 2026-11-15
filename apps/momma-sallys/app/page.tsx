import Link from 'next/link'
import { Photo, type PhotoKey } from '@/components/Photos'
import { PaymentOptions } from '@/components/PaymentOptions'
import { ThanksgivingSpecial } from '@/components/ThanksgivingSpecial'
import { Reveal, RevealStyles } from '@/components/Reveal'
import { TruckVideo, LoopClip } from '@/components/Alive'
import { StickyBar, Steam, PlateBuilder, CateringChapter, SeasonGate, QuoteReveal, RouteLine, ParkTruck } from '@/components/Chapters'
import { config } from '@/config/brand'
import { THANKSGIVING_SHOW_UNTIL } from '@/config/thanksgiving'
import { PHONE_DISPLAY, PHONE_TEL, SMS_LINK, HAS_PAY } from '@/config/site'

const CATS: { href: string; title: string; es: string; text: string; cta: string; photo: PhotoKey }[] = [
  { href: '/food-truck', title: 'Food Truck', es: 'Camión', text: 'BBQ plates off the pit — brisket, sausage, chicken & pulled pork.', cta: 'Menu & location', photo: 'brisketPlate' },
  { href: '/catering', title: 'Catering', es: 'Banquetes', text: 'Grazing tables, buffets and charcuterie for any crowd.', cta: 'Plan catering', photo: 'grazing' },
  { href: '/events', title: 'Events', es: 'Eventos', text: 'Party spreads and homemade desserts, cobbler to banana pudding.', cta: 'See events', photo: 'cobbler' },
]

/** 01 — the four meats. Real photos only; meats without a photo yet ship as named tiles (SLOT). */
const MEAT_CARDS: { id: string; clip?: string; poster?: string; alt?: string; line: string; lineEs: string }[] = [
  { id: 'Brisket', clip: 'brisket-bark', poster: '/photos/enhanced/brisket-closeup.webp', alt: 'Smoked brisket with dark peppery bark', line: 'Dark bark, smoked low and slow.', lineEs: 'Corteza oscura, ahumado lento.' },
  { id: 'Sausage', clip: 'sausage-plate', poster: '/photos/enhanced/sausage-brisket-plate.webp', alt: 'Sausage and brisket plate with corn, mac & cheese and green beans', line: 'Sliced sausage with snap.', lineEs: 'Salchicha en rodajas.' },
  { id: 'Chicken', line: 'Off the pit.', lineEs: 'Del asador.' },
  { id: 'Pulled Pork', line: 'Off the pit.', lineEs: 'Del asador.' },
]

/** 04 — sides: crops of her real plates where that side is visible; the rest are named tiles (SLOT). */
const SIDE_PHOTOS: Record<string, string> = {
  'Mac & Cheese': '/photos/enhanced/side-mac.webp',
  Corn: '/photos/enhanced/side-corn.webp',
  'Green Beans': '/photos/enhanced/side-green-beans.webp',
  Beans: '/photos/enhanced/side-beans.webp',
}

function Chapter({ n, en, es, id, children }: { n: string; en: string; es: string; id?: string; children: React.ReactNode }) {
  return (
    <section className="h-sec c-ch" id={id} aria-labelledby={`ch-${n}`}>
      <div className="ms-wrap">
        <Reveal>
          <div className="c-ch-head">
            <span className="c-ch-n">{n}</span>
            <div>
              <h2 id={`ch-${n}`}>{en}</h2>
              <div className="ms-es c-ch-es">{es}</div>
            </div>
          </div>
        </Reveal>
        {children}
      </div>
    </section>
  )
}

export default function HomePage() {
  const menu = config.menu!
  const [plates, sidesCat, desserts] = menu.categories
  const meats = plates.items.filter(i => !i.price)
  const plateOffers = plates.items.filter(i => i.price).map((i, idx) => ({ count: (idx + 1) as 1 | 2, name: i.name, es: i.nameTranslated ?? '', price: i.price! }))
  const meatOptions = meats.map(m => ({ id: m.name.toLowerCase().replace(/\s+/g, '-'), name: m.name, es: m.nameTranslated ?? m.name }))
  const ticker = [...sidesCat.items, ...desserts.items]

  return (
    <>
      <style>{`
        .h-hero { position: relative; min-height: calc(100svh - 60px); display: flex; align-items: flex-end; padding: 96px 0 56px; overflow: hidden; background: #000; }
        .h-hero-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .h-hero-live { transition: opacity 1s ease; }
        .h-hero-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.55) 45%, rgba(0,0,0,.95) 100%); }
        .h-hero h1 { font-size: clamp(42px, 11vw, 92px); letter-spacing: -.02em; line-height: 1.02; margin-bottom: 18px; max-width: 14ch; }
        .h-hero h1 em { color: var(--brand-primary); font-style: italic; }
        .h-ctas { display: grid; gap: 12px; margin-top: 28px; }
        @media (min-width: 640px) { .h-ctas { display: flex; flex-wrap: wrap; } }
        .h-sec { padding: 72px 0; border-top: 1px solid var(--brand-border); }
        .h-sec h2 { font-size: clamp(32px, 7vw, 54px); letter-spacing: -.02em; margin-bottom: 10px; }
        .h-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-top: 32px; }
        .h-price { font-family: var(--font-display); font-size: 22px; color: #fff; white-space: nowrap; }
        .h-cat { display: block; border: 1px solid var(--brand-border); border-radius: 20px; padding: 10px; background: #0b0b0b; transition: border-color .15s, transform .2s; }
        .h-cat:hover { border-color: var(--brand-primary); transform: translateY(-3px); }
        .h-plate { background: linear-gradient(180deg, rgba(0,0,0,.6), rgba(0,0,0,.92)), url('/backdrop-platter.png') center / cover no-repeat; }

        /* chapters */
        .c-ch-head { display: flex; gap: 18px; align-items: flex-start; }
        .c-ch-n { font-family: var(--font-display); font-style: italic; font-size: clamp(40px, 8vw, 72px); line-height: .9; color: var(--brand-primary); }
        .c-ch-head h2 { margin: 0; }
        .c-ch-es { font-size: 16px; margin-top: 2px; }

        /* 01 meat cards */
        .c-meats { display: grid; gap: 14px; margin-top: 32px; grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 900px) { .c-meats { grid-template-columns: repeat(4, 1fr); } }
        .c-meat { position: relative; border: 1px solid var(--brand-border); border-radius: 20px; padding: 8px; background: #0b0b0b; transition: border-color .2s, transform .25s; }
        .c-meat:hover { border-color: var(--brand-primary); transform: translateY(-4px); }
        .c-meat .a-clip, .c-tile { aspect-ratio: 3 / 4; border-radius: 14px; }
        .c-meat h3 { font-size: clamp(20px, 3vw, 26px); margin: 12px 6px 0; }
        .c-meat p { margin: 2px 6px 8px; color: var(--brand-muted); font-size: 14px; }
        .c-tile { display: flex; flex-direction: column; justify-content: flex-end; padding: 18px; background: radial-gradient(120% 90% at 30% 20%, #3a0a0d 0%, #120405 60%, #050102 100%); border: 1px dashed rgba(255,255,255,.18); }
        .c-tile strong { font-family: var(--font-display); font-size: clamp(26px, 4vw, 34px); line-height: 1.05; }
        .c-tile span { color: var(--brand-muted); font-style: italic; }

        .a-clip { position: relative; overflow: hidden; background: #140802; }
        .a-clip img, .a-clip video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .a-clip video { opacity: 0; transition: opacity .9s ease; }
        .a-clip video.is-ready { opacity: 1; }
        .c-frame { position: relative; }
        .c-steam { position: absolute; left: 0; right: 0; bottom: 30%; height: 60%; pointer-events: none; z-index: 2; }
        .c-steam i { position: absolute; bottom: 0; width: 34%; height: 70%; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,255,255,.22), rgba(255,255,255,0)); filter: blur(8px); opacity: 0; animation: c-steam 5.5s ease-in infinite; }
        .c-steam i:nth-child(1) { left: 12%; } .c-steam i:nth-child(2) { left: 38%; animation-delay: 1.8s; } .c-steam i:nth-child(3) { left: 62%; animation-delay: 3.6s; }
        @keyframes c-steam { 0% { transform: translateY(20%) scaleX(.7); opacity: 0; } 30% { opacity: .9; } 100% { transform: translateY(-70%) scaleX(1.2); opacity: 0; } }

        /* 02 plate builder */
        .c-pb { display: grid; gap: 28px; margin-top: 32px; align-items: center; }
        @media (min-width: 900px) { .c-pb { grid-template-columns: 1.1fr 1fr; } }
        .c-pb-sizes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .c-pb-size { display: grid; gap: 2px; text-align: left; padding: 18px; border-radius: 18px; border: 1px solid var(--brand-border); background: #0b0b0b; color: #fff; cursor: pointer; font-size: 15px; font-weight: 700; transition: border-color .15s, background .15s, transform .15s; }
        .c-pb-size[aria-pressed="true"] { border-color: var(--brand-primary); background: rgba(179,18,27,.14); transform: scale(1.02); }
        .c-pb-size .ms-es { font-weight: 400; font-size: 13px; }
        .c-pb-price { font-family: var(--font-display); font-size: 40px; line-height: 1; color: #fff; }
        .c-pb-step { margin: 22px 0 10px; font-weight: 700; font-size: 14px; letter-spacing: .06em; text-transform: uppercase; color: var(--brand-muted); }
        .c-pb-meats { display: flex; flex-wrap: wrap; gap: 10px; }
        .c-chip { padding: 10px 16px; border-radius: 999px; border: 1px solid var(--brand-border); background: #0b0b0b; color: #fff; font-size: 15px; cursor: pointer; transition: transform .15s, border-color .15s, background .15s; }
        .c-chip span { opacity: .6; font-size: 13px; }
        .c-chip[aria-pressed="true"] { border-color: var(--brand-primary); background: rgba(179,18,27,.2); transform: scale(1.05); }
        .c-pb-note { margin-top: 14px; color: var(--brand-muted); font-size: 14px; }
        .c-pb-ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
        .c-pb-plate { display: grid; justify-items: center; gap: 16px; }
        .c-plate { position: relative; width: min(340px, 82vw); aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 50% 45%, #fbf7f1 0%, #e9e2d7 62%, #cfc6b8 100%); box-shadow: 0 30px 60px -20px rgba(255,90,30,.25), inset 0 -10px 30px rgba(0,0,0,.15); }
        .c-plate-rim { position: absolute; inset: 9%; border-radius: 50%; border: 2px solid rgba(0,0,0,.06); }
        .c-plate-meat { position: absolute; display: grid; place-items: center; text-align: center; padding: 8px; color: #fff; font-family: var(--font-display); font-size: 20px; line-height: 1.05; border-radius: 46% 54% 50% 50%; background: radial-gradient(circle at 35% 30%, #8a3a1c, #4a1608 70%, #2a0a03); box-shadow: inset 0 3px 8px rgba(255,180,120,.35), 0 8px 18px rgba(0,0,0,.35); animation: c-drop .55s cubic-bezier(.22,1.4,.36,1) both; }
        .c-plate-meat.has-photo { background-size: cover; background-position: center; align-content: end; padding-bottom: 14px; text-shadow: 0 1px 6px rgba(0,0,0,.8); }
        .c-plate-meat small { display: block; font-family: var(--font-body); font-size: 12px; opacity: .8; font-style: italic; }
        .c-plate-meat-solo { left: 18%; top: 16%; width: 64%; height: 46%; }
        .c-plate-meat-0 { left: 12%; top: 16%; width: 40%; height: 42%; }
        .c-plate-meat-1 { right: 12%; top: 16%; width: 40%; height: 42%; animation-delay: .05s; }
        .c-plate-sides { position: absolute; left: 50%; bottom: 17%; transform: translateX(-50%); padding: 8px 14px; border-radius: 999px; background: #f5c542; color: #3a2400; font-weight: 700; font-size: 13px; white-space: nowrap; }
        .c-plate-empty { position: absolute; inset: 0; display: grid; place-items: center; color: #8a7f70; font-weight: 700; }
        @keyframes c-drop { from { transform: translateY(-60px) scale(.8); opacity: 0; } to { transform: none; opacity: 1; } }
        .c-pb-total { display: flex; gap: 14px; align-items: baseline; font-size: 18px; }
        .c-pb-total strong { font-family: var(--font-display); font-size: 44px; }

        /* 03 catering pans */
        .c-cat { margin-top: 28px; }
        .c-pans { position: sticky; top: 64px; z-index: 15; margin-bottom: 20px; padding: 16px 18px; border: 1px solid var(--brand-border); border-radius: 18px; background: rgba(8,8,8,.94); backdrop-filter: blur(8px); }
        .c-pans-count { font-size: 18px; } .c-pans-count strong { font-family: var(--font-display); font-size: 30px; color: var(--brand-primary); }
        .c-pans-row { display: flex; gap: 10px; overflow-x: auto; padding: 12px 2px 2px; scrollbar-width: thin; }
        .c-pan { flex: 0 0 auto; width: 84px; text-align: center; animation: c-pop .35s cubic-bezier(.22,1.4,.36,1) both; }
        .c-pan-tray { position: relative; height: 46px; border-radius: 8px; border: 2px solid #9a9a9a; background: linear-gradient(180deg, #2a2a2a, #161616); overflow: hidden; }
        .c-pan-fill { position: absolute; left: 0; right: 0; bottom: 0; transition: height .6s cubic-bezier(.22,1,.36,1); }
        .c-pan-meat .c-pan-fill { background: linear-gradient(180deg, #8a3a1c, #4a1608); }
        .c-pan-side .c-pan-fill { background: linear-gradient(180deg, #f5c542, #c98a1c); }
        .c-pan-dessert .c-pan-fill { background: linear-gradient(180deg, #f8e3b0, #d8a55a); }
        .c-pan-name { font-size: 12px; margin-top: 6px; line-height: 1.2; }
        .c-pan-name small { display: block; color: var(--brand-muted); font-size: 10px; font-style: italic; }
        .c-pan-tray-slot { display: grid; place-items: center; border-style: dashed; color: var(--brand-muted); font-family: var(--font-display); font-size: 22px; background: transparent; }
        @keyframes c-pop { from { transform: scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }

        /* 04 sides */
        .c-sides { display: grid; gap: 12px; margin-top: 32px; grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 760px) { .c-sides { grid-template-columns: repeat(4, 1fr); } }
        .c-side { position: relative; aspect-ratio: 1; border-radius: 18px; overflow: hidden; border: 1px solid var(--brand-border); background: #0b0b0b; }
        .c-side img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s ease; }
        .c-side:hover img { transform: scale(1.06); }
        .c-side-label { position: absolute; left: 0; right: 0; bottom: 0; padding: 30px 14px 12px; background: linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.85)); }
        .c-side-label strong { display: block; font-family: var(--font-display); font-size: 22px; }
        .c-side-label span { font-size: 13px; color: #ddd; font-style: italic; }
        .c-side.c-tile { aspect-ratio: 1; }
        .c-sweets { display: grid; gap: 16px; margin-top: 28px; align-items: center; }
        @media (min-width: 760px) { .c-sweets { grid-template-columns: 1fr 1.2fr; } }
        .c-sweets .a-clip { aspect-ratio: 4 / 3; border-radius: 18px; }
        .c-marquee { overflow: hidden; margin-top: 36px; border-top: 1px solid var(--brand-border); border-bottom: 1px solid var(--brand-border); padding: 14px 0; }
        .c-marquee-track { display: flex; width: max-content; animation: c-marq 40s linear infinite; }
        .c-marquee-track span { font-family: var(--font-display); font-style: italic; font-size: clamp(20px, 3vw, 30px); white-space: nowrap; padding: 0 16px; }
        .c-marquee-track em { color: var(--brand-muted); font-size: .6em; padding-left: 6px; }
        .c-marquee-track i { color: var(--brand-primary); font-style: normal; padding-left: 26px; font-size: .6em; }
        @keyframes c-marq { to { transform: translateX(-50%); } }

        /* spotlight */
        .c-spot { background: radial-gradient(90% 120% at 10% 0%, rgba(179,18,27,.22), rgba(0,0,0,0) 60%); }
        .c-spot-tag { display: inline-block; padding: 6px 14px; border-radius: 999px; background: var(--brand-primary); font-weight: 700; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 18px; }

        /* 05 route */
        .c-route { position: relative; margin-top: 30px; height: 150px; }
        .c-route-road { position: absolute; left: 0; right: 0; top: 96px; height: 6px; border-radius: 3px; background: repeating-linear-gradient(90deg, #f5c542 0 26px, transparent 26px 46px); opacity: .7; }
        .c-route-truck { position: absolute; top: 18px; width: 150px; left: 0; transform: translateX(-10%); transition: transform 2.6s cubic-bezier(.33,0,.2,1); }
        .c-route.is-in .c-route-truck { transform: translateX(min(60vw, 720px)); }
        .c-route-pins { position: absolute; left: 0; top: 116px; display: flex; flex-wrap: wrap; gap: 8px 18px; font-weight: 700; font-size: 14px; }
        .c-route-pins a { color: var(--brand-primary); }
        .c-wheel { transform-box: fill-box; transform-origin: center; }
        .c-route:not(.is-in) .c-wheel, .c-route.is-in .c-wheel { animation: c-spin .6s linear 4; }
        .c-truck-puff circle { fill: rgba(255,255,255,.25); }
        @keyframes c-spin { to { transform: rotate(360deg); } }

        /* 06 quote */
        .c-quote p { font-family: var(--font-display); font-style: italic; font-size: clamp(26px, 5vw, 44px); line-height: 1.3; }
        .c-quote .c-w { display: inline-block; opacity: .12; transform: translateY(8px); transition: opacity .5s ease, transform .5s ease; }
        .c-quote.is-in .c-w { opacity: 1; transform: none; }

        /* 07 park */
        .c-park { position: relative; height: 140px; margin-top: 28px; overflow: hidden; }
        .c-park-lot { position: absolute; left: 0; right: 0; bottom: 14px; display: flex; gap: 0; justify-content: center; }
        .c-park-lot span { width: 90px; height: 50px; border-left: 3px solid rgba(255,255,255,.35); }
        .c-park-lot span:last-child { border-right: 3px solid rgba(255,255,255,.35); }
        .c-park-truck { position: absolute; bottom: 8px; left: 50%; width: 220px; margin-left: -110px; transform: translateX(-120vw); transition: transform 2.2s cubic-bezier(.2,.8,.2,1); }
        .c-park.is-in .c-park-truck { transform: none; }

        /* sticky bar (replaces the site bar on this page only) */
        body:has(.c-bar) .ms-bar { display: none; }
        .c-bar { position: fixed; z-index: 60; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 8px; padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); background: rgba(0,0,0,.94); border-top: 1px solid var(--brand-border); }
        .c-bar { transition: transform .35s ease, opacity .35s ease; }
        .c-bar.is-hidden { transform: translateY(120%); opacity: 0; pointer-events: none; }
        .c-bar a { min-height: 54px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; line-height: 1.1; }
        .c-bar small { font-size: 11px; font-weight: 500; opacity: .8; font-style: italic; }
        .c-bar-red { background: var(--brand-primary); color: #fff; }
        .c-bar-ghost { border: 2px solid rgba(255,255,255,.6); color: #fff; }
        .c-bar-white { background: #fff; color: #000; }
        @media (min-width: 900px) {
          .c-bar { left: auto; right: 20px; bottom: 20px; grid-template-columns: auto auto auto; padding: 8px; border: 1px solid var(--brand-border); border-radius: 18px; box-shadow: 0 20px 40px rgba(0,0,0,.5); }
          .c-bar a { min-height: 46px; padding: 0 18px; border-radius: 12px; font-size: 14px; }
        }

        /* scroll-in (JS adds .is-in; without JS everything is already visible) */
        .c-inview { }
        @media (prefers-reduced-motion: reduce) {
          .c-steam, .h-hero-live { display: none; }
          .c-marquee-track, .c-plate-meat, .c-pan, .c-wheel { animation: none !important; }
          .c-route-truck, .c-park-truck, .c-quote .c-w, .c-pan-fill { transition: none !important; }
          .c-quote .c-w { opacity: 1; transform: none; }
          .c-park-truck { transform: none; }
        }
      `}</style>
      <noscript><style>{`.ms-reveal { opacity: 1 !important; transform: none !important; } .c-quote .c-w { opacity: 1 !important; transform: none !important; } .c-park-truck { transform: none !important; }`}</style></noscript>

      <RevealStyles />
      <StickyBar />

      {/* HERO — unchanged look; the truck drive-by is now our own file */}
      <section className="h-hero">
        <TruckVideo src="/video/truck-pulling.mp4" poster="/photos/truck-pulling-poster.jpg" />
        <div className="h-hero-shade" />
        <div className="ms-wrap" style={{ width: '100%', position: 'relative' }}>
          <Reveal>
            <div className="ms-eyebrow">Southern Food Truck · West Texas</div>
            <h1>More than BBQ, <em>it&rsquo;s a Southern experience.</em></h1>
          </Reveal>
          <Reveal delay={140}>
            <p style={{ fontSize: 18, color: '#ddd', maxWidth: 560, lineHeight: 1.6 }}>
              Cooked with love, served with soul. Brisket, sausage, chicken &amp; pulled pork off the pit — with real sides, sauce and something sweet.
            </p>
            <p className="ms-es" style={{ fontSize: 15, marginTop: 6 }}>Más que BBQ, es una experiencia sureña. Cocinado con amor, servido con alma. Menú en inglés y español.</p>
          </Reveal>
          <Reveal delay={260}>
            <div className="h-ctas">
              <SeasonGate until={THANKSGIVING_SHOW_UNTIL}>
                <a href="#thanksgiving" className="ms-btn ms-btn-white">Thanksgiving special · $125</a>
              </SeasonGate>
              <Link href="/menu" className="ms-btn ms-btn-ghost">View Menu · Ver Menú</Link>
              <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call {PHONE_DISPLAY}</a>
              {HAS_PAY && <Link href="/pay" className="ms-btn ms-btn-ghost">Pay · Pagar</Link>}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 01 OFF THE PIT */}
      <Chapter n="01" en="Off the pit." es="Directo del asador.">
        <div className="c-meats">
          {MEAT_CARDS.map((m, i) => {
            const es = meats.find(x => x.name === m.id)?.nameTranslated ?? m.id
            return (
              <Reveal key={m.id} delay={i * 90}>
                <article className="c-meat">
                  {m.clip && m.poster ? (
                    <div className="c-frame">
                      <LoopClip clip={{ mp4: `/alive/${m.clip}.mp4`, webm: `/alive/${m.clip}.webm` }} poster={m.poster} alt={m.alt ?? m.id} />
                      <Steam />
                    </div>
                  ) : (
                    /* SLOT: real photo of this meat not on file yet — named tile, no stock photo. */
                    <div className="c-tile" data-slot={`photo-${m.id.toLowerCase().replace(/\s+/g, '-')}`}>
                      <strong>{m.id}</strong>
                      <span>{es}</span>
                    </div>
                  )}
                  <h3>{m.id} <span className="ms-es" style={{ fontSize: 14, fontFamily: 'var(--font-body)' }}>· {es}</span></h3>
                  <p>{m.line} <span className="ms-es">{m.lineEs}</span></p>
                </article>
              </Reveal>
            )
          })}
        </div>
      </Chapter>

      {/* 02 PLATES */}
      <Chapter n="02" en={`Build your ${plates.name.toLowerCase().replace(/s$/, '')}.`} es="Arma tu plato.">
        <PlateBuilder meats={meatOptions} plates={plateOffers} note={plates.note ?? ''} />
        <div style={{ marginTop: 28, maxWidth: 560 }}><PaymentOptions /></div>
        <p className="ms-es" style={{ marginTop: 10, fontSize: 13 }}>{menu.paymentNote} · Precios sujetos a cambio.</p>
      </Chapter>

      {/* 03 CATERING */}
      <Chapter n="03" en="Feed the whole crowd." es="Alimenta a todos." id="catering">
        <p style={{ color: 'var(--brand-muted)', maxWidth: 620, marginTop: 14 }}>{config.services.subheadline} <span className="ms-es">Te preparamos el banquete que quieras.</span></p>
        <CateringChapter />
      </Chapter>

      {/* 04 SIDES */}
      <Chapter n="04" en="Real sides, not shortcuts." es="Acompañamientos de verdad.">
        <div className="c-sides">
          {sidesCat.items.map((s, i) => (
            <Reveal key={s.name} delay={(i % 4) * 70}>
              {SIDE_PHOTOS[s.name] ? (
                <div className="c-side">
                  <img src={SIDE_PHOTOS[s.name]} alt={s.name} loading="lazy" decoding="async" />
                  <div className="c-side-label"><strong>{s.name}</strong><span>{s.nameTranslated}</span></div>
                </div>
              ) : (
                /* SLOT: no real photo of this side yet. */
                <div className="c-side c-tile" data-slot={`photo-${s.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <strong>{s.name}</strong><span>{s.nameTranslated}</span>
                </div>
              )}
            </Reveal>
          ))}
        </div>
        <div className="c-sweets">
          <Reveal>
            <div className="c-frame">
              <LoopClip clip={{ mp4: '/alive/peach-cobbler.mp4', webm: '/alive/peach-cobbler.webm' }} poster="/photos/enhanced/peach-cobbler.webp" alt="Cups of peach cobbler with cinnamon sticks" />
              <Steam />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="ms-eyebrow">{desserts.name} · {desserts.nameTranslated}</div>
            {desserts.items.map(d => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px dotted var(--brand-border)' }}>
                <div><div style={{ fontWeight: 700 }}>{d.name}</div><div className="ms-es" style={{ fontSize: 13 }}>{d.nameTranslated}</div></div>
                {d.price && <div className="h-price">{d.price}</div>}
              </div>
            ))}
            <p style={{ color: 'var(--brand-muted)', fontSize: 14, marginTop: 12 }}>Peach cobbler for events &amp; catering. <span className="ms-es">Cobbler de durazno para eventos y banquetes.</span></p>
          </Reveal>
        </div>
        <div className="c-marquee" aria-hidden="true">
          <div className="c-marquee-track">
            {[0, 1].map(n => ticker.map(t => <span key={t.name + n}>{t.name}{t.nameTranslated && t.nameTranslated !== t.name && <em>{t.nameTranslated}</em>}<i>✦</i></span>))}
          </div>
        </div>
        <div style={{ marginTop: 28 }}>
          <Link href="/menu" className="ms-btn ms-btn-red">See Full Menu · Menú Completo</Link>
        </div>
      </Chapter>

      {/* SPOTLIGHT — Thanksgiving (hidden after the holiday) */}
      <SeasonGate until={THANKSGIVING_SHOW_UNTIL}>
        <section className="h-sec c-spot" aria-label="Thanksgiving special">
          <div className="ms-wrap">
            <span className="c-spot-tag">Spotlight · Especial</span>
            <ThanksgivingSpecial />
          </div>
        </section>
      </SeasonGate>

      {/* 05 FIND THE TRUCK */}
      <section className="h-sec h-plate c-ch" id="find-us" aria-labelledby="ch-05">
        <div className="ms-wrap">
          <div className="c-ch-head">
            <span className="c-ch-n">05</span>
            <div>
              <h2 id="ch-05">Rolling around West Texas.</h2>
              <div className="ms-es c-ch-es">Encuéntranos.</div>
            </div>
          </div>
          <p style={{ color: '#ddd', maxWidth: 560, fontSize: 17, marginTop: 14 }}>
            Different stops, same great flavor! Call for our daily location.
          </p>
          <p className="ms-es" style={{ marginTop: 6 }}>Diferentes paradas, ¡el mismo gran sabor! Llámanos para saber nuestra ubicación del día.</p>
          <RouteLine />
          <div className="h-ctas">
            <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call for Today&rsquo;s Location</a>
            <a href={SMS_LINK} className="ms-btn ms-btn-ghost">Text Us</a>
          </div>
        </div>
      </section>

      {/* 06 SALLY'S WAY */}
      <Chapter n="06" en="Sally's way." es="A la manera de Sally.">
        <div style={{ maxWidth: 860, marginTop: 20 }}>
          <div className="ms-eyebrow">{config.about.headline}</div>
          <QuoteReveal text={config.about.mission} />
          {/* SLOT: proof strip (reviews / counts) omitted until real numbers are provided. */}
          <div style={{ marginTop: 24 }}>
            <Link href="/about" className="ms-btn ms-btn-ghost">Our Story</Link>
          </div>
        </div>
      </Chapter>

      {/* 07 YOUR TURN */}
      <Chapter n="07" en="Your turn." es="Te toca.">
        <ParkTruck />
        <div className="h-ctas">
          <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call {PHONE_DISPLAY}</a>
          <a href={SMS_LINK} className="ms-btn ms-btn-ghost">Text Us · Envíanos texto</a>
          <a href="#catering" className="ms-btn ms-btn-white">Build catering · Arma tu banquete</a>
        </div>
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
      </Chapter>
    </>
  )
}
