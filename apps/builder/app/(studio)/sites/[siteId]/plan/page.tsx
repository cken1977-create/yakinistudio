import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { productByKey } from '@yakini/pricing/products'
import { BILLING_RESULTS, STATUS_LABEL, usd } from '@/lib/billing-copy'
import { currentUser } from '@/lib/server/auth'
import { currentSub, planChoices, siteKit, syncSubscription } from '@/lib/server/billing'
import { siteMember } from '@/lib/server/publish'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'

/** Your plan (Phase 4, Flow J): choose a plan and pay through PayPal, see it, cancel it. Works without JavaScript. */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Your plan', robots: { index: false, follow: false } }

type Props = { params: Promise<{ siteId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const day = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const btn = 'inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold'

export default async function PlanPage({ params, searchParams }: Props) {
  const { siteId } = await params
  const q = await searchParams
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const m = await siteMember(rt, siteId)
  if (!m) { if (!(await currentUser())) redirect(signinPath(`/sites/${siteId}/plan`)); notFound() }
  const owner = m.role === 'owner'

  // Back from PayPal: read the subscription from PayPal itself, never from the address bar.
  const subId = one(q.subscription_id)
  let returned: 'ok' | 'unknown' | null = null
  if (one(q.paid) === '1' && subId && /^[A-Z0-9-]{3,64}$/i.test(subId) && owner) {
    const r = await syncSubscription(rt, subId, null, m.site.tenantId).catch(() => 'unknown' as const)
    returned = r === 'recorded' || r === 'duplicate' ? 'ok' : 'unknown'
  }
  const [subs, choices] = await Promise.all([rt.store.tenantSubscriptions(m.site.tenantId), planChoices(rt, await siteKit(m))])
  const cur = currentSub(subs)
  // Back from PayPal but not active yet: PayPal is still taking the first payment (a few seconds).
  const confirming = !cur && returned === 'ok' && subs.some((s) => s.providerSubscriptionId === subId && s.status === 'pending')
  const waiting = !cur && !confirming && subs.some((s) => s.status === 'pending')
  const result = one(q.result)

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <a href={`/sites/${siteId}/publish`} className="inline-flex min-h-11 items-center text-paper/85 underline-offset-4 hover:text-gold hover:underline">← Back to Publish</a>
      <h1 className="mt-4 font-serif text-4xl">Your plan</h1>
      {result && BILLING_RESULTS[result] ? <p role="status" className="mt-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">{BILLING_RESULTS[result]}</p> : null}
      {one(q.canceled) === '1' ? <p role="status" className="mt-6 rounded-xl border border-paper/25 px-4 py-3">No payment was made. You can choose a plan any time.</p> : null}
      {returned === 'unknown' || confirming ? (
        <>
          {/* Checks PayPal again every few seconds until the plan is active (works without JavaScript). */}
          <meta httpEquiv="refresh" content="5" />
          <p role="status" className="mt-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3" data-testid="plan-confirming">Thanks! PayPal is confirming your payment. This page updates by itself.</p>
        </>
      ) : null}

      {cur ? (
        <section className="mt-8 rounded-2xl border border-paper/15 p-6" aria-labelledby="cur-h">
          <h2 id="cur-h" className="text-xl font-semibold">{productByKey(cur.productKey)?.name ?? 'Your plan'}</h2>
          <p className="mt-2" data-testid="plan-status">Status: <strong>{STATUS_LABEL[cur.status]}</strong></p>
          {cur.status === 'active' && cur.paidThrough ? <p className="mt-1 text-paper/85">Next payment: {day(cur.paidThrough)}</p> : null}
          {cur.status === 'canceled' && cur.paidThrough ? <p className="mt-1 text-paper/85">Your site stays live until {day(cur.paidThrough)}. Choose a plan again any time.</p> : null}
          {cur.status === 'past_due' ? (
            <p className="mt-3 rounded-xl border border-[#B4442C]/60 bg-[#B4442C]/15 px-4 py-3">PayPal couldn’t take your last payment. Your site is still live. Please update your payment in your PayPal account so it stays up.</p>
          ) : null}
          {returned === 'ok' && cur.status === 'active' ? <p className="mt-3 text-gold">Thanks! You can publish your site now.</p> : null}
          {owner && cur.status !== 'canceled' ? (
            <form method="post" action={`/api/sites/${siteId}/billing/cancel`} className="mt-6 border-t border-paper/15 pt-5">
              <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="confirm" value="yes" className="h-5 w-5 accent-[#C9A14A]" /> I want to cancel my plan</label>
              <button className={`${btn} mt-3 border border-paper/25 hover:border-gold`}>Cancel plan</button>
              <p className="mt-2 text-sm text-muted">Your site stays live until the end of the month you paid for. Nothing is deleted.</p>
            </form>
          ) : null}
          {cur.status === 'active' ? <a href={`/sites/${siteId}/publish`} className={`${btn} mt-6 bg-gold text-ink`}>Go to Publish</a> : null}
        </section>
      ) : (
        <>
          <p className="mt-2 text-paper/85">Choose a plan to put your site live. You pay through PayPal and can cancel any time.</p>
          {waiting ? <p role="status" className="mt-6 rounded-xl border border-paper/25 px-4 py-3">A payment was started but not finished. You can start again below.</p> : null}
          {!owner ? <p className="mt-6 rounded-xl border border-paper/25 px-4 py-3">Only the owner of this site can choose a plan.</p> : null}
          <ul className="mt-8 space-y-4">
            {choices.map((c) => (
              <li key={c.key} className={`rounded-2xl border p-6 ${c.recommended ? 'border-gold' : 'border-paper/15'}`}>
                {c.recommended ? <p className="text-sm font-semibold uppercase tracking-wide text-gold">Recommended for your site</p> : null}
                <h2 className="mt-1 text-xl font-semibold">{c.name}</h2>
                <p className="mt-2 text-lg">{c.setup > 0 ? `${usd(c.setup)} setup today, then ` : ''}{usd(c.monthly)} a month</p>
                {owner ? (
                  <form method="post" action={`/api/sites/${siteId}/billing/checkout`} className="mt-4">
                    <input type="hidden" name="product" value={c.key} />
                    <button disabled={!c.available} className={`${btn} ${c.recommended ? 'bg-gold text-ink' : 'border border-paper/25 hover:border-gold'} disabled:opacity-50`}>Continue to PayPal</button>
                    {!c.available ? <p className="mt-2 text-sm text-muted">This plan isn’t ready yet. Please contact Yakini.</p> : null}
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
