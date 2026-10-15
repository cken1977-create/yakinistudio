import type { Metadata } from 'next'
import { Gallery } from '@/components/Photos'
import { ContactCTA } from '@/components/ContactCTA'
import { Reveal, RevealStyles } from '@/components/Reveal'
import { EmberCanvas } from '@/components/EmberCanvas'
import { CateringBuilder } from '@/components/CateringBuilder'

export const metadata: Metadata = { title: "Catering — Momma Sally's BBQ, Abilene TX" }

const MARQUEE = 'SMOKED LOW & SLOW · ABILENE, TX · CATERING · BANQUETES · '

export default function CateringPage() {
  return (
    <>
      <RevealStyles />
      <style>{`
        .cb-marquee { overflow: hidden; white-space: nowrap; border-top: 1px solid var(--brand-border); border-bottom: 1px solid var(--brand-border); background: #0b0b0b; }
        .cb-marquee-track { display: inline-block; padding: 12px 0; animation: cb-scroll 26s linear infinite; font-family: var(--font-display); font-size: 15px; letter-spacing: .18em; color: var(--brand-primary); }
        @keyframes cb-scroll { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .cb-marquee-track { animation: none; } }
      `}</style>

      {/* HERO with ember layer */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '54svh',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,.3) 0%, rgba(0,0,0,.62) 55%, rgba(0,0,0,.96) 100%), url('/photos/grazing-table.webp') center 35% / cover no-repeat",
          }}
        />
        <EmberCanvas density={42} />
        <div className="ms-wrap" style={{ position: 'relative', width: '100%', padding: '96px 20px 52px' }}>
          <Reveal>
            <div className="ms-eyebrow">Catering · Banquetes</div>
            <h1
              style={{
                fontSize: 'clamp(40px, 9vw, 84px)',
                letterSpacing: '-.02em',
                lineHeight: 1.02,
                margin: '0 0 16px',
                maxWidth: '16ch',
              }}
            >
              We cater your <em style={{ color: 'var(--brand-primary)', fontStyle: 'italic' }}>desire.</em>
            </h1>
            <p style={{ fontSize: 18, color: '#ddd', maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
              Grazing tables, BBQ buffets and charcuterie spreads for parties, offices, work crews
              and family gatherings. Build your menu below — see the price as you go.
            </p>
            <p className="ms-es" style={{ marginTop: 10 }}>
              Arma tu menú abajo y mira el precio en vivo.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Marquee band */}
      <div className="cb-marquee" aria-hidden="true">
        <div className="cb-marquee-track">
          {MARQUEE.repeat(6)}
          {MARQUEE.repeat(6)}
        </div>
      </div>

      {/* BUILDER */}
      <section className="ms-wrap" style={{ padding: '64px 20px' }}>
        <Reveal>
          <div className="ms-eyebrow">Menu Builder · Arma tu menú</div>
          <h2 style={{ fontSize: 'clamp(30px, 7vw, 52px)', letterSpacing: '-.02em', margin: '0 0 8px' }}>
            Price it yourself.
          </h2>
          <p style={{ color: '#ddd', maxWidth: 620, lineHeight: 1.6, margin: '0 0 32px' }}>
            Pick your headcount, package and spread — the estimate updates live. When it looks
            right, text it straight to us.
          </p>
        </Reveal>
        <CateringBuilder />
      </section>

      {/* Gallery */}
      <section style={{ padding: '24px 0 64px', borderTop: '1px solid var(--brand-border)' }}>
        <div className="ms-wrap" style={{ padding: '48px 20px 0' }}>
          <Reveal>
            <div className="ms-eyebrow">Recent spreads · Banquetes recientes</div>
            <h2 style={{ fontSize: 'clamp(28px, 6vw, 44px)', margin: '0 0 24px' }}>
              Off the pit, onto the table.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <Gallery items={['grazing', 'buffet', 'charcuterie']} aspect="3 / 4" />
          </Reveal>
        </div>
      </section>

      {/* Inquiry */}
      <section style={{ padding: '64px 0', borderTop: '1px solid var(--brand-border)' }}>
        <div className="ms-wrap">
          <Reveal>
            <div className="ms-eyebrow">Catering Inquiry · Cotización</div>
            <h2 style={{ fontSize: 'clamp(30px, 7vw, 48px)', marginBottom: 10 }}>
              Tell us about your event.
            </h2>
            <p style={{ color: '#ddd', marginBottom: 4 }}>
              Share the date, headcount and what you&rsquo;re craving — we&rsquo;ll put it together.
            </p>
            <p className="ms-es" style={{ marginBottom: 20 }}>
              Compártenos la fecha, el número de invitados y lo que se te antoja.
            </p>
            <ContactCTA subject="Catering inquiry" />
          </Reveal>
        </div>
      </section>
    </>
  )
}
