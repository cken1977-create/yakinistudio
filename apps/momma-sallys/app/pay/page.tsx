import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PHONE_DISPLAY, PHONE_TEL, HAS_PAY, SQUARE_PAY_URL } from '@/config/site'

export const metadata: Metadata = {
  title: "Pay · Pagar — Momma Sally's BBQ",
  robots: { index: false },
}

/**
 * Stable pay URL for the printed QR code. When NEXT_PUBLIC_SQUARE_PAY_URL
 * is set, this forwards (307, so the target can change later) to Square.
 * Otherwise it shows a friendly "pay at the window" message.
 */
export default function PayPage() {
  if (HAS_PAY) redirect(SQUARE_PAY_URL)

  return (
    <section style={{ padding: '72px 0', minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
      <div className="ms-wrap" style={{ maxWidth: 560, textAlign: 'center' }}>
        <div className="ms-eyebrow">Pay · Pagar</div>
        <h1 style={{ fontSize: 'clamp(36px, 9vw, 60px)', marginBottom: 14 }}>Pay at the window.</h1>
        <p style={{ fontSize: 17, color: '#ddd' }}>
          Online pay is coming soon. For now, pay at the truck window — tap to pay, cash, Visa &amp; Mastercard accepted.
        </p>
        <p className="ms-es" style={{ marginTop: 8 }}>
          Paga en la ventanilla del camión. Aceptamos pago sin contacto, efectivo, Visa y Mastercard.
        </p>
        <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
          <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call {PHONE_DISPLAY}</a>
          <Link href="/menu" className="ms-btn ms-btn-ghost">View Menu · Ver Menú</Link>
        </div>
      </div>
    </section>
  )
}
