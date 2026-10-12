'use client'

import { useState } from 'react'

const INTAKE_URL = 'https://portal.yakini.digital/intake'
const PHONE_TEL = '+13466232199' // Yakini office line (from site footer)
const PHONE_DISPLAY = '(346) 623-2199'

type L = 'en' | 'es'

const T = {
  en: {
    eyebrow: 'Yakini Digital · For Food Trucks',
    title: 'Your food truck, online in days.',
    sub: 'Yakini Digital builds the system your truck runs on. Works with the Square, Toast or Clover you already use.',
    start: 'Get started', call: 'Call', text: 'Text',
    exEyebrow: 'Live example', exTitle: "Momma Sally's — Abilene, TX",
    exBody: 'A real food truck site we built: bilingual menu, click-to-call, menu QR code, catering and events pages, on its own .com.',
    exCta: 'See mamasallys.com',
    askNicole: 'Ask Nicole about her site — she’s right here.',
    tiersEyebrow: 'Packages', tiersTitle: 'Pick where to start.',
    ask: 'Ask for pricing', everything: 'Everything in',
    custom: 'Need something custom? Custom work is quoted separately.',
    ctaTitle: 'Ready when you are.', ctaBody: 'Tell us about your truck. A few questions, then we open your account.',
  },
  es: {
    eyebrow: 'Yakini Digital · Para Food Trucks',
    title: 'Tu food truck, en línea en días.',
    sub: 'Yakini Digital construye el sistema con el que funciona tu negocio. Funciona con el Square, Toast o Clover que ya usas.',
    start: 'Empezar', call: 'Llamar', text: 'Texto',
    exEyebrow: 'Ejemplo real', exTitle: "Momma Sally's — Abilene, TX",
    exBody: 'Un sitio real que construimos: menú bilingüe, botón para llamar, código QR del menú, páginas de banquetes y eventos, con su propio .com.',
    exCta: 'Ver mamasallys.com',
    askNicole: 'Pregúntale a Nicole sobre su sitio — está aquí.',
    tiersEyebrow: 'Paquetes', tiersTitle: 'Elige por dónde empezar.',
    ask: 'Pregunta por precios', everything: 'Todo lo de',
    custom: '¿Necesitas algo a la medida? El trabajo personalizado se cotiza aparte.',
    ctaTitle: 'Cuando estés listo.', ctaBody: 'Cuéntanos de tu negocio. Unas preguntas y abrimos tu cuenta.',
  },
}

const TIERS: { name: string; base?: string; en: string[]; es: string[] }[] = [
  { name: 'Starter',
    en: ['One-page mobile website', 'Your menu online', 'Menu QR code', 'Click-to-call', 'Your own .com domain'],
    es: ['Sitio web móvil de una página', 'Tu menú en línea', 'Código QR del menú', 'Botón para llamar', 'Tu propio dominio .com'] },
  { name: 'Grow', base: 'Starter',
    en: ['Pay link + scan-to-pay QR (Square)', 'Catering & events page with inquiry', 'Google Business Profile setup', 'Facebook / Instagram setup'],
    es: ['Enlace de pago + QR para pagar (Square)', 'Página de banquetes y eventos con solicitudes', 'Configuración de Perfil de Negocio en Google', 'Configuración de Facebook / Instagram'] },
  { name: 'Full Service', base: 'Grow',
    en: ['Online pre-order / pay-ahead for lunch rushes', 'Customer text list for your daily location', 'Monthly photo & menu updates', 'Priority support'],
    es: ['Pedidos y pagos por adelantado para la hora pico', 'Lista de mensajes de texto con tu ubicación diaria', 'Actualizaciones mensuales de fotos y menú', 'Soporte prioritario'] },
]

export default function FoodTrucksPage() {
  const [lang, setLang] = useState<L>('en')
  const t = T[lang]
  return (
    <div className="ft">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        .ft { --gold:#C9A14A; --black:#0B0B0B; --cream:#F3EBDD; background:var(--black); color:var(--cream); font-family:'Montserrat',system-ui,sans-serif; min-height:100vh; }
        .ft * { box-sizing:border-box; }
        .ft a { color:inherit; text-decoration:none; }
        .w { max-width:960px; margin:0 auto; padding:0 20px; }
        .top { display:flex; justify-content:space-between; align-items:center; height:64px; }
        .tog { display:flex; border:1px solid rgba(201,161,74,.5); border-radius:999px; overflow:hidden; }
        .tog button { background:none; border:0; color:var(--cream); font:600 13px Montserrat,sans-serif; padding:8px 14px; cursor:pointer; }
        .tog button.on { background:var(--gold); color:var(--black); }
        .eb { font-size:11px; font-weight:700; letter-spacing:.24em; text-transform:uppercase; color:var(--gold); margin-bottom:12px; }
        h1 { font-size:clamp(36px,9vw,64px); font-weight:800; line-height:1.05; letter-spacing:-.02em; margin:0 0 16px; }
        h2 { font-size:clamp(26px,6vw,40px); font-weight:700; line-height:1.15; margin:0 0 12px; }
        p { line-height:1.6; margin:0; }
        .btns { display:grid; gap:10px; margin-top:24px; }
        @media (min-width:640px){ .btns { display:flex; flex-wrap:wrap; } }
        .b { display:inline-flex; justify-content:center; align-items:center; min-height:52px; padding:0 24px; border-radius:999px; font-weight:700; font-size:16px; }
        .bg { background:var(--gold); color:var(--black) !important; }
        .bo { border:2px solid rgba(243,235,221,.5); }
        .sec { padding:56px 0; border-top:1px solid rgba(201,161,74,.2); }
        .card { border:1px solid rgba(201,161,74,.35); border-radius:18px; padding:24px; background:#141311; }
        .tiers { display:grid; gap:16px; margin-top:24px; }
        @media (min-width:860px){ .tiers { grid-template-columns:repeat(3,1fr); } }
        .tiers ul { list-style:none; padding:0; margin:14px 0 18px; display:grid; gap:9px; font-size:15px; }
        .tiers li::before { content:'✓ '; color:var(--gold); font-weight:700; }
        .muted { color:rgba(243,235,221,.7); }
      `}</style>

      <header className="w top">
        <a href="https://yakini.digital" aria-label="Yakini Digital"><img src="/yakini-logo-horizontal.svg" alt="Yakini Digital" height={34} style={{ height: 34, width: 'auto' }} /></a>
        <div className="tog" role="group" aria-label="Language">
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
        </div>
      </header>

      <section className="w" style={{ padding: '40px 20px 56px' }}>
        <div className="eb">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p style={{ fontSize: 18, maxWidth: 620 }} className="muted">{t.sub}</p>
        <div className="btns">
          <a className="b bg" href={INTAKE_URL}>{t.start} →</a>
          <a className="b bo" href={`tel:${PHONE_TEL}`}>{t.call} {PHONE_DISPLAY}</a>
          <a className="b bo" href={`sms:${PHONE_TEL}`}>{t.text}</a>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div className="card">
            <div className="eb">{t.exEyebrow}</div>
            <h2>{t.exTitle}</h2>
            <p className="muted">{t.exBody}</p>
            <div className="btns"><a className="b bg" href="https://mamasallys.com" target="_blank" rel="noopener">{t.exCta} ↗</a></div>
            <p style={{ marginTop: 16, fontWeight: 600 }}>{t.askNicole}</p>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div className="eb">{t.tiersEyebrow}</div>
          <h2>{t.tiersTitle}</h2>
          <div className="tiers">
            {TIERS.map(tier => (
              <div className="card" key={tier.name} style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: 0, fontSize: 22, color: 'var(--gold)' }}>{tier.name}</h3>
                <ul>
                  {tier.base && <li style={{ fontWeight: 700 }}>{t.everything} {tier.base}</li>}
                  {tier[lang].map(f => <li key={f}>{f}</li>)}
                </ul>
                <a className="b bo" style={{ marginTop: 'auto' }} href={INTAKE_URL}>{t.ask}</a>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 18, fontSize: 14 }}>{t.custom}</p>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <h2>{t.ctaTitle}</h2>
          <p className="muted">{t.ctaBody}</p>
          <div className="btns">
            <a className="b bg" href={INTAKE_URL}>{t.start} →</a>
            <a className="b bo" href={`tel:${PHONE_TEL}`}>{t.call}</a>
            <a className="b bo" href={`sms:${PHONE_TEL}`}>{t.text}</a>
          </div>
        </div>
      </section>

      <footer className="sec">
        <div className="w" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 14 }}>
          <span>Yakini Digital</span>
          <a href="https://yakini.digital" style={{ color: 'var(--gold)' }}>yakini.digital</a>
        </div>
      </footer>
    </div>
  )
}
