import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { Gallery, Photo } from '@/components/Photos'
import { ContactCTA } from '@/components/ContactCTA'

export const metadata: Metadata = { title: "Events · Eventos — Momma Sally's BBQ, Abilene TX" }

export default function EventsPage() {
  return (
    <>
      <PageHero eyebrow="Events · Eventos" title="Spreads worth celebrating." bg="/photos/peach-cobbler.webp"
        lead="Birthdays, showers, weddings and get-togethers — BBQ, buffets and homemade desserts."
        es="Cumpleaños, baby showers, bodas y reuniones — barbacoa, bufés y postres caseros." />
      <section className="ms-wrap" style={{ padding: '48px 20px' }}>
        <Gallery items={['cobbler', 'pudding', 'buffet']} />
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 12, maxWidth: 640 }}>
          <Photo k="eventSpread" sizes="(min-width: 900px) 320px, 50vw" />
          <Photo k="charcuterie" sizes="(min-width: 900px) 320px, 50vw" />
        </div>
      </section>
      <section style={{ padding: '48px 0', borderTop: '1px solid var(--brand-border)' }}>
        <div className="ms-wrap">
          <div className="ms-eyebrow">Book Your Event · Reserva</div>
          <h2 style={{ fontSize: 'clamp(30px, 7vw, 48px)', marginBottom: 10 }}>Let&rsquo;s plan your party.</h2>
          <p style={{ color: '#ddd', marginBottom: 4 }}>Call, text or email with your date and guest count.</p>
          <p className="ms-es" style={{ marginBottom: 20 }}>Llama, envía un texto o correo con la fecha y el número de invitados.</p>
          <ContactCTA subject="Event booking" label="Book:" />
        </div>
      </section>
    </>
  )
}
