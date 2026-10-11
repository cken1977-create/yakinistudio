import type { Metadata } from 'next'
import { config } from '@/config/brand'
import { PageHero } from '@/components/PageHero'
import { Gallery } from '@/components/Photos'
import { ContactCTA } from '@/components/ContactCTA'

export const metadata: Metadata = { title: "Catering — Momma Sally's BBQ, Abilene TX" }

export default function CateringPage() {
  return (
    <>
      <PageHero eyebrow="Catering" title="We cater your desire." bg="/photos/grazing-table.webp"
        lead="Grazing tables, BBQ buffets and charcuterie spreads for parties, offices, work crews and family gatherings."
        es="Mesas de botanas, bufés de barbacoa y charcutería para fiestas, oficinas y reuniones familiares." />
      <section className="ms-wrap" style={{ padding: '48px 20px' }}>
        <Gallery items={['grazing', 'buffet', 'charcuterie']} aspect="3 / 4" />
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 40 }}>
          {config.services.items.map(s => (
            <div key={s.title} style={{ border: '1px solid var(--brand-border)', borderRadius: 16, padding: 22, background: '#0b0b0b' }}>
              <div style={{ fontSize: 26 }}>{s.icon}</div>
              <h3 style={{ fontSize: 21, margin: '6px 0' }}>{s.title}</h3>
              <p style={{ color: 'var(--brand-muted)', fontSize: 15 }}>{s.description}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: '48px 0', borderTop: '1px solid var(--brand-border)' }}>
        <div className="ms-wrap">
          <div className="ms-eyebrow">Catering Inquiry · Cotización</div>
          <h2 style={{ fontSize: 'clamp(30px, 7vw, 48px)', marginBottom: 10 }}>Tell us about your event.</h2>
          <p style={{ color: '#ddd', marginBottom: 4 }}>Share the date, headcount and what you&rsquo;re craving — we&rsquo;ll put it together.</p>
          <p className="ms-es" style={{ marginBottom: 20 }}>Compártenos la fecha, el número de invitados y lo que se te antoja.</p>
          <ContactCTA subject="Catering inquiry" />
        </div>
      </section>
    </>
  )
}
