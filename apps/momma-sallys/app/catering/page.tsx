import type { Metadata } from 'next'
import Image from 'next/image'
import { Photo } from '@/components/Photos'
import { Reveal, RevealStyles } from '@/components/Reveal'
import { EmberCanvas } from '@/components/EmberCanvas'
import { CateringBuilder } from '@/components/CateringBuilder'
import { QuoteForm } from '@/components/QuoteForm'
import { VisitBeacon } from '@/components/VisitBeacon'
import { CATERING_PACKAGES } from '@/config/catering'
import { BOOK_AHEAD, DEPOSIT_LINE, DEPOSIT_LINE_ES, MIN_GUESTS, OFFER, PRICES_CONFIRMED, REPLY_PROMISE, SERVICE_AREA } from '@/config/funnel'
import { PHONE_DISPLAY, PHONE_TEL } from '@/config/site'

export const metadata: Metadata = {
  title: "Catering & Events — Momma Sally's BBQ, Abilene TX",
  description: 'Grazing tables, BBQ buffets and homemade desserts for offices, crews, parties and family in Abilene and West Texas. Get a quote in about a minute.',
}

const MARQUEE = "MORE THAN BBQ, IT'S A SOUTHERN EXPERIENCE · COOKED WITH LOVE, SERVED WITH SOUL · ABILENE, TX · CATERING · BANQUETES · "

const BRING = [
  { k: 'grazing' as const, title: 'Grazing tables', es: 'Mesas de botanas', body: 'Fruit, cheese, bread and dips, laid out to wow your guests.' },
  { k: 'buffet' as const, title: 'BBQ buffet', es: 'Bufé de barbacoa', body: 'Smoked brisket, sausage and homestyle sides, hot and ready.' },
  { k: 'cobbler' as const, title: 'Homemade desserts', es: 'Postres caseros', body: 'Peach cobbler and banana pudding, made from scratch.' },
]

const STEPS = [
  { n: '1', t: 'Tell us your date and headcount.', es: 'Cuéntanos la fecha y cuántos invitados.' },
  { n: '2', t: `We send your quote ${REPLY_PROMISE}.`, es: 'Te enviamos tu cotización.' },
  ...(DEPOSIT_LINE ? [{ n: '3', t: DEPOSIT_LINE, es: DEPOSIT_LINE_ES }] : []),
  { n: DEPOSIT_LINE ? '4' : '3', t: 'We pull up. You eat.', es: 'Llegamos. Ustedes comen.' },
]

const FAQ = [
  { q: 'Is there a minimum headcount?', a: `Catering starts at ${MIN_GUESTS} guests. Smaller group? Call us and we'll see what we can do.` },
  { q: 'Where do you cater?', a: SERVICE_AREA },
  { q: 'How far ahead should I book?', a: BOOK_AHEAD },
  { q: 'Drop-off, setup or full service?', a: 'All three. Drop-off means we deliver hot and you serve. Buffet setup means we set and label the spread. Full service means our crew serves your guests start to finish.' },
  { q: 'How do deposits and cancellations work?', a: DEPOSIT_LINE || 'We\'ll explain everything in your quote.' },
  { q: 'Can you handle dietary needs?', a: 'Tell us in the form (allergies, no pork, vegetarian guests) and we\'ll plan around it.' },
]

export default function CateringPage() {
  return (
    <>
      <RevealStyles />
      <VisitBeacon path="/catering" />
      <style>{`
        .cb-marquee { overflow: hidden; white-space: nowrap; border-top: 1px solid var(--brand-border); border-bottom: 1px solid var(--brand-border); background: #0b0b0b; }
        .cb-marquee-track { display: inline-block; padding: 12px 0; animation: cb-scroll 26s linear infinite; font-family: var(--font-display); font-size: 15px; letter-spacing: .18em; color: var(--brand-primary); }
        @keyframes cb-scroll { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .cb-marquee-track { animation: none; } }
        .cf-grid3 { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
        .cf-card { border: 1px solid var(--brand-border); border-radius: 18px; overflow: hidden; background: #0b0b0b; }
        .cf-card-body { padding: 16px 18px 20px; }
        .cf-step { display: flex; gap: 14px; align-items: flex-start; padding: 16px 0; border-bottom: 1px solid var(--brand-border); }
        .cf-step-n { flex: 0 0 40px; height: 40px; border-radius: 999px; background: var(--brand-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; }
        .cf-split { display: grid; gap: 36px; grid-template-columns: 1fr; align-items: start; }
        @media (min-width: 900px) { .cf-split { grid-template-columns: 1.15fr .85fr; } }
        .cf-faq details { border-bottom: 1px solid var(--brand-border); padding: 16px 0; }
        .cf-faq summary { cursor: pointer; font-weight: 700; font-size: 17px; }
        .cf-faq p { color: #ccc; line-height: 1.6; margin: 10px 0 0; }
      `}</style>

      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '62svh', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ position: 'absolute', inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.3) 0%, rgba(0,0,0,.62) 55%, rgba(0,0,0,.96) 100%), url('/photos/grazing-table.webp') center 35% / cover no-repeat" }} />
        <EmberCanvas density={42} />
        <div className="ms-wrap" style={{ position: 'relative', width: '100%', padding: '96px 20px 52px' }}>
          <Reveal>
            <div className="ms-eyebrow">Catering &amp; Events · Banquetes y eventos</div>
            <h1 style={{ fontSize: 'clamp(40px, 9vw, 84px)', letterSpacing: '-.02em', lineHeight: 1.02, margin: '0 0 16px', maxWidth: '16ch' }}>
              We cater your <em style={{ color: 'var(--brand-primary)', fontStyle: 'italic' }}>desire.</em>
            </h1>
            <p style={{ fontSize: 18, color: '#ddd', maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
              Grazing tables, BBQ buffets and homemade desserts for offices, crews, parties and family. Abilene and West Texas.
            </p>
            <p className="ms-es" style={{ marginTop: 10 }}>Mesas de botanas, bufés de barbacoa y postres caseros para tu evento.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 26 }}>
              <a href="#quote" className="ms-btn ms-btn-red">Get my quote · Cotizar</a>
              <a href={PHONE_TEL} className="ms-btn ms-btn-ghost">Call {PHONE_DISPLAY}</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* OFFER BAR */}
      {OFFER.enabled && (
        <div style={{ background: 'var(--brand-primary)', color: '#fff' }}>
          <div className="ms-wrap" style={{ padding: '18px 20px', display: 'grid', gap: 4 }}>
            <strong style={{ fontSize: 18, lineHeight: 1.4 }}>{OFFER.headline}</strong>
            <span style={{ fontSize: 14, opacity: 0.92, fontStyle: 'italic' }}>{OFFER.es}</span>
            {OFFER.endsLine && <span style={{ fontSize: 13, opacity: 0.9 }}>{OFFER.endsLine}</span>}
          </div>
        </div>
      )}

      <div className="cb-marquee" aria-hidden="true">
        <div className="cb-marquee-track">{MARQUEE.repeat(6)}{MARQUEE.repeat(6)}</div>
      </div>

      {/* WHAT WE BRING */}
      <section className="ms-wrap" style={{ padding: '64px 20px 24px' }}>
        <Reveal>
          <div className="ms-eyebrow">What we bring · Lo que llevamos</div>
          <h2 style={{ fontSize: 'clamp(30px, 7vw, 52px)', letterSpacing: '-.02em', margin: '0 0 24px' }}>Off the pit, onto the table.</h2>
        </Reveal>
        <div className="cf-grid3">
          {BRING.map((b) => (
            <div key={b.k} className="cf-card">
              <Photo k={b.k} aspect="4 / 3" sizes="(min-width: 900px) 360px, 100vw" />
              <div className="cf-card-body">
                <h3 style={{ fontSize: 24, margin: '0 0 4px' }}>{b.title}</h3>
                <div className="ms-es" style={{ marginBottom: 8 }}>{b.es}</div>
                <p style={{ color: '#ccc', margin: 0, lineHeight: 1.55 }}>{b.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS + FORM */}
      <section id="quote" className="ms-wrap" style={{ padding: '56px 20px 64px', scrollMarginTop: 80 }}>
        <div className="cf-split">
          <div>
            <Reveal>
              <div className="ms-eyebrow">Get a quote · Cotización</div>
              <h2 style={{ fontSize: 'clamp(30px, 7vw, 52px)', letterSpacing: '-.02em', margin: '0 0 8px' }}>Tell us about your event.</h2>
              <p style={{ color: '#ddd', maxWidth: 620, lineHeight: 1.6, margin: '0 0 28px' }}>
                About a minute. Nicole puts your quote together herself.
                <span className="ms-es" style={{ display: 'block', marginTop: 4 }}>Toma un minuto. Nicole prepara tu cotización personalmente.</span>
              </p>
            </Reveal>
            <QuoteForm />
          </div>
          <aside>
            <div className="ms-eyebrow">How it works · Cómo funciona</div>
            {STEPS.map((s) => (
              <div key={s.n} className="cf-step">
                <div className="cf-step-n">{s.n}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.4 }}>{s.t}</div>
                  <div className="ms-es" style={{ fontSize: 14 }}>{s.es}</div>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </section>

      {/* PACKAGES (no prices until Nicole confirms them) */}
      <section style={{ padding: '56px 0', borderTop: '1px solid var(--brand-border)', background: '#070707' }}>
        <div className="ms-wrap">
          <div className="ms-eyebrow">Packages · Paquetes</div>
          <h2 style={{ fontSize: 'clamp(28px, 6vw, 44px)', margin: '0 0 8px' }}>Pick a starting point.</h2>
          <p style={{ color: '#ccc', margin: '0 0 24px' }}>
            {PRICES_CONFIRMED ? 'Starting prices below. Your quote is built for your event.' : 'Every quote is built for your event and headcount. Ask for yours above.'}
          </p>
          {PRICES_CONFIRMED ? (
            <CateringBuilder />
          ) : (
            <div className="cf-grid3">
              {CATERING_PACKAGES.map((p) => (
                <div key={p.id} className="cf-card" style={{ padding: '20px 20px 22px', borderColor: p.featured ? 'var(--brand-primary)' : undefined }}>
                  <h3 style={{ fontSize: 24, margin: '0 0 2px' }}>{p.name}</h3>
                  <div className="ms-es" style={{ marginBottom: 10 }}>{p.es}</div>
                  <p style={{ color: '#ccc', margin: '0 0 6px', lineHeight: 1.55 }}>{p.blurb}</p>
                  <p className="ms-es" style={{ margin: 0, fontSize: 14 }}>{p.esBlurb}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MEET NICOLE */}
      <section className="ms-wrap" style={{ padding: '64px 20px' }}>
        <div className="cf-split" style={{ alignItems: 'center' }}>
          <div>
            <div className="ms-eyebrow">Meet Nicole · Conoce a Nicole</div>
            <h2 style={{ fontSize: 'clamp(28px, 6vw, 44px)', margin: '0 0 12px' }}>Cooked with love, served with soul.</h2>
            <p style={{ color: '#ccc', lineHeight: 1.7, margin: '0 0 8px' }}>
              Momma Sally&rsquo;s is Nicole&rsquo;s Southern food truck, feeding Abilene crews every week. The same pit, the same recipes and the same care go into every event we cater.
            </p>
            <p className="ms-es" style={{ margin: 0 }}>La misma receta y el mismo cariño en cada evento.</p>
          </div>
          <div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 18, overflow: 'hidden', maxWidth: 420, width: '100%', justifySelf: 'center' }}>
            <Image src="/photos/nicole-chef-coat.webp" alt="Nicole of Momma Sally's in her chef coat" fill sizes="(min-width: 900px) 420px, 90vw" style={{ objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      {/* PROOF: left out on purpose until Nicole OKs real reviews. No made-up testimonials. */}

      {/* FAQ */}
      <section style={{ padding: '56px 0', borderTop: '1px solid var(--brand-border)' }}>
        <div className="ms-wrap cf-faq" style={{ maxWidth: 820 }}>
          <div className="ms-eyebrow">Questions · Preguntas</div>
          <h2 style={{ fontSize: 'clamp(28px, 6vw, 44px)', margin: '0 0 12px' }}>Good to know.</h2>
          {FAQ.map((x) => (
            <details key={x.q}>
              <summary>{x.q}</summary>
              <p>{x.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ position: 'relative', padding: '72px 0', overflow: 'hidden', borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.75), rgba(0,0,0,.92)), url('/photos/event-spread.webp') center / cover no-repeat" }} />
        <div className="ms-wrap" style={{ position: 'relative', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(30px, 7vw, 52px)', margin: '0 0 12px' }}>Let&rsquo;s feed your people.</h2>
          <p className="ms-es" style={{ margin: '0 0 24px' }}>Vamos a darle de comer a tu gente.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <a href="#quote" className="ms-btn ms-btn-red">Get my quote · Cotizar</a>
            <a href={PHONE_TEL} className="ms-btn ms-btn-ghost">Call or text {PHONE_DISPLAY}</a>
          </div>
        </div>
      </section>
    </>
  )
}
