import Link from 'next/link'
import { PaymentOptions } from '@/components/PaymentOptions'
import { config } from '@/config/brand'
import { PHONE_DISPLAY, PHONE_TEL, SMS_LINK, HAS_PAY } from '@/config/site'

export default function HomePage() {
  const menu = config.menu!
  const plates = menu.categories[0]

  return (
    <>
      <style>{`
        .h-hero { position: relative; min-height: calc(100svh - 60px); display: flex; align-items: flex-end; padding: 96px 0 56px;
          background: linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.55) 45%, rgba(0,0,0,.95) 100%), url('/backdrop-pit.png') center / cover no-repeat; }
        .h-hero h1 { font-size: clamp(42px, 11vw, 92px); letter-spacing: -.02em; line-height: 1.02; margin-bottom: 18px; max-width: 14ch; }
        .h-hero h1 em { color: var(--brand-primary); font-style: italic; }
        .h-ctas { display: grid; gap: 12px; margin-top: 28px; }
        @media (min-width: 640px) { .h-ctas { display: flex; flex-wrap: wrap; } }
        .h-sec { padding: 72px 0; border-top: 1px solid var(--brand-border); }
        .h-sec h2 { font-size: clamp(32px, 7vw, 54px); letter-spacing: -.02em; margin-bottom: 10px; }
        .h-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-top: 32px; }
        .h-card { border: 1px solid var(--brand-border); border-radius: 18px; padding: 24px; background: #0b0b0b; }
        .h-card h3 { font-size: 22px; margin-bottom: 8px; }
        .h-price { font-family: var(--font-display); font-size: 22px; color: #fff; white-space: nowrap; }
        .h-row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px dotted var(--brand-border); }
        .h-plate { background: linear-gradient(180deg, rgba(0,0,0,.6), rgba(0,0,0,.92)), url('/backdrop-platter.png') center / cover no-repeat; }
      `}</style>

      {/* HERO */}
      <section className="h-hero">
        <div className="ms-wrap" style={{ width: '100%' }}>
          <div className="ms-eyebrow">Texas BBQ Food Truck · Abilene, TX</div>
          <h1>Smoked low &amp; slow. <em>Served hot.</em></h1>
          <p style={{ fontSize: 18, color: '#ddd', maxWidth: 560, lineHeight: 1.6 }}>
            Brisket, sausage, chicken &amp; pulled pork off the pit — with real sides, sauce and something sweet.
          </p>
          <p className="ms-es" style={{ fontSize: 15, marginTop: 6 }}>Barbacoa texana ahumada lentamente. Menú en inglés y español.</p>
          <div className="h-ctas">
            <Link href="/menu" className="ms-btn ms-btn-white">View Menu · Ver Menú</Link>
            <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call {PHONE_DISPLAY}</a>
            {HAS_PAY && <Link href="/pay" className="ms-btn ms-btn-ghost">Pay · Pagar</Link>}
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
          <h2>Rolling around Abilene.</h2>
          <p style={{ color: '#ddd', maxWidth: 560, fontSize: 17 }}>
            The truck moves, and hours vary by day. Give us a call for today&rsquo;s location and hours.
          </p>
          <p className="ms-es" style={{ marginTop: 6 }}>Llámanos para la ubicación y el horario de hoy.</p>
          <div className="h-ctas">
            <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call for Today&rsquo;s Location</a>
            <a href={SMS_LINK} className="ms-btn ms-btn-ghost">Text Us</a>
          </div>
          <div style={{ marginTop: 32, maxWidth: 560 }}><PaymentOptions /></div>
        </div>
      </section>

      {/* CATERING */}
      <section className="h-sec" id="catering">
        <div className="ms-wrap">
          <div className="ms-eyebrow">Catering</div>
          <h2>{config.services.subheadline}</h2>
          <div className="h-grid">
            {config.services.items.map(s => (
              <div className="h-card" key={s.title}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                <h3>{s.title}</h3>
                <p style={{ color: 'var(--brand-muted)', fontSize: 15 }}>{s.description}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 28, color: '#ddd' }}>Tell us the date, headcount and what you&rsquo;re craving — we&rsquo;ll put it together.</p>
          <p className="ms-es" style={{ marginTop: 4, fontSize: 14 }}>¿Un evento? Llámanos con la fecha y el número de invitados.</p>
          <div className="h-ctas">
            <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call About Catering</a>
            <a href={SMS_LINK} className="ms-btn ms-btn-ghost">Text Us</a>
          </div>
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
