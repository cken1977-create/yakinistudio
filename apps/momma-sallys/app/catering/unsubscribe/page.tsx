import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { funnel, type Lead } from '@/lib/funnel/db'
import { unsubscribeToken } from '@/lib/funnel/unsub'
import { PHONE_DISPLAY, PHONE_TEL } from '@/config/site'

export const metadata: Metadata = { title: "Unsubscribe — Momma Sally's BBQ", robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

async function confirm(formData: FormData) {
  'use server'
  const t = String(formData.get('t') ?? '')
  const ok = await unsubscribeToken(t, 'link').catch(() => false)
  redirect(`/catering/unsubscribe?t=${encodeURIComponent(t)}&done=${ok ? 1 : 0}`)
}

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t = '', done } = await searchParams
  let lead: Lead | null = null
  if (/^[0-9a-f]{64}$/.test(t)) lead = await funnel<Lead | null>('lead_by_token', { token: t }).catch(() => null)
  const es = lead?.lang === 'es'
  const already = !!lead?.unsubscribed_at
  return (
    <section className="ms-wrap" style={{ padding: '96px 20px', maxWidth: 640, minHeight: '60svh' }}>
      <div className="ms-eyebrow">{es ? 'Correos' : 'Emails'}</div>
      {!lead ? (
        <>
          <h1 style={{ fontSize: 40, margin: '0 0 12px' }}>Link not found</h1>
          <p style={{ color: '#ccc' }}>This unsubscribe link isn&rsquo;t valid anymore. Call or text <a href={PHONE_TEL}>{PHONE_DISPLAY}</a> and we&rsquo;ll take care of it.</p>
        </>
      ) : already || done === '1' ? (
        <>
          <h1 style={{ fontSize: 40, margin: '0 0 12px' }}>{es ? 'Listo, te dimos de baja.' : "You're unsubscribed."}</h1>
          <p style={{ color: '#ccc', lineHeight: 1.6 }}>
            {es ? 'No te enviaremos más correos de seguimiento. ¿Todavía necesitas comida para tu evento? Llama al ' : "We won't send you any more follow-up emails. Still need food for your event? Call "}
            <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 40, margin: '0 0 12px' }}>{es ? '¿Dejar de recibir correos?' : 'Stop getting emails?'}</h1>
          <p style={{ color: '#ccc', lineHeight: 1.6, margin: '0 0 24px' }}>
            {es ? "Ya no te enviaremos correos de seguimiento de Momma Sally's." : "We'll stop sending you follow-up emails from Momma Sally's."}
          </p>
          <form action={confirm}>
            <input type="hidden" name="t" value={t} />
            <button type="submit" className="ms-btn ms-btn-red" style={{ cursor: 'pointer' }}>{es ? 'Sí, darme de baja' : 'Yes, unsubscribe me'}</button>
          </form>
          {done === '0' && <p role="alert" style={{ color: '#ff8a8a' }}>Something went wrong. Please try again or call {PHONE_DISPLAY}.</p>}
        </>
      )}
    </section>
  )
}
