import type { Metadata } from 'next'
import Link from 'next/link'
import { config } from '@/config/brand'
import { PHONE_TEL, SMS_LINK } from '@/config/site'
import { PageHero } from '@/components/PageHero'
import { Gallery } from '@/components/Photos'
import { PaymentOptions } from '@/components/PaymentOptions'

export const metadata: Metadata = { title: "Food Truck · Camión de comida — Momma Sally's BBQ, West Texas TX" }

export default function FoodTruckPage() {
  const plates = config.menu!.categories[0]
  return (
    <>
      <PageHero eyebrow="Food Truck · Camión de comida" title="Plates off the pit." bg="/photos/open-window-dusk.jpg"
        lead="Brisket, sausage, chicken and pulled pork — plates include sides."
        es="Brisket, salchicha, pollo y cerdo deshebrado — los platos incluyen acompañamientos." />

      {/* Motion: truck in transit */}
      <section style={{ position: 'relative', minHeight: '42svh', overflow: 'hidden', background: '#000' }}>
        <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}>
          <source src="/video/truck-pulling.mp4" type="video/mp4" />
        </video>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.7))' }} />
        <div className="ms-wrap" style={{ position: 'relative', padding: '72px 20px', color: '#fff' }}>
          <div className="ms-eyebrow">On the move · En movimiento</div>
          <h2 style={{ fontSize: 'clamp(28px, 6vw, 48px)', margin: '0 0 12px' }}>We bring the pit to you.</h2>
          <p style={{ maxWidth: 520, color: '#ddd' }}>The truck rolls. Call or text for today’s spot.</p>
        </div>
      </section>

      <section className="ms-wrap" style={{ padding: '48px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
          <Link href="/menu" className="ms-btn ms-btn-white">View Full Menu · Ver Menú</Link>
          {plates.items.filter(i => i.price).map(i => (
            <span key={i.name} className="ms-btn ms-btn-ghost" style={{ cursor: 'default' }}>{i.name} {i.price}</span>
          ))}
        </div>
        <Gallery items={['sausagePlate', 'brisketPlate', 'brisket']} />
      </section>
      <section style={{ padding: '48px 0', borderTop: '1px solid var(--brand-border)' }} id="find-us">
        <div className="ms-wrap" style={{ display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div>
            <div className="ms-eyebrow">Find the Truck · Encuéntranos</div>
            <h2 style={{ fontSize: 'clamp(30px, 7vw, 48px)', marginBottom: 10 }}>Rolling around West Texas.</h2>
            <p style={{ color: '#ddd' }}>Different stops, same great flavor! Call for our daily location.</p>
            <p className="ms-es" style={{ marginTop: 4 }}>Diferentes paradas, ¡el mismo gran sabor! Llámanos para saber nuestra ubicación del día.</p>
            <div style={{ display: 'grid', gap: 12, marginTop: 20, maxWidth: 420 }}>
              <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call for Today’s Location</a>
              <a href={SMS_LINK} className="ms-btn ms-btn-ghost">Text Us</a>
            </div>
          </div>
          <PaymentOptions />
        </div>
      </section>
    </>
  )
}