import type { Metadata } from 'next'
import Link from 'next/link'
import { config } from '@/config/brand'
import { PHONE_TEL, SMS_LINK } from '@/config/site'
import { PageHero } from '@/components/PageHero'
import { Gallery } from '@/components/Photos'
import { PaymentOptions } from '@/components/PaymentOptions'

export const metadata: Metadata = { title: "Food Truck · Camión de comida — Momma Sally's BBQ, Abilene TX" }

export default function FoodTruckPage() {
  const plates = config.menu!.categories[0]
  return (
    <>
      <PageHero eyebrow="Food Truck · Camión de comida" title="Plates off the pit." bg="/photos/sausage-brisket-plate.webp"
        lead="Brisket, sausage, chicken and pulled pork — plates include sides."
        es="Brisket, salchicha, pollo y cerdo deshebrado — los platos incluyen acompañamientos." />
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
            <h2 style={{ fontSize: 'clamp(30px, 7vw, 48px)', marginBottom: 10 }}>Rolling around Abilene.</h2>
            <p style={{ color: '#ddd' }}>The truck moves and hours vary by day. Call or text for today&rsquo;s location and hours.</p>
            <p className="ms-es" style={{ marginTop: 4 }}>Llámanos o envía un texto para la ubicación y el horario de hoy.</p>
            <div style={{ display: 'grid', gap: 12, marginTop: 20, maxWidth: 420 }}>
              <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call for Today&rsquo;s Location</a>
              <a href={SMS_LINK} className="ms-btn ms-btn-ghost">Text Us</a>
            </div>
          </div>
          <PaymentOptions />
        </div>
      </section>
    </>
  )
}
