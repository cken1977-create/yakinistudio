import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { productByKey } from '@yakini/pricing/products'
import { OpsShell, Result, field, goBtn } from '@/components/ops'
import { STATUS_LABEL, usd } from '@/lib/billing-copy'
import { currentUser } from '@/lib/server/auth'
import { FOUNDING_PROMO } from '@/lib/server/billing'
import { operatorOf } from '@/lib/server/ops'
import { paypalStatus } from '@/lib/server/paypal'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'

/** Operator billing desk (Phase 4): PayPal connection, plans at today's prices, every subscription. */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Billing', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const day = (d: Date | null) => (d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '—')

export default async function OpsBilling({ searchParams }: Props) {
  const q = await searchParams
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const o = await operatorOf(rt)
  if (!o) { if (!(await currentUser())) redirect(signinPath('/ops/billing')); notFound() }
  const pp = paypalStatus()
  const [plans, subs, promo, claims] = await Promise.all([rt.store.activePlans(), rt.store.listSubscriptions(), rt.store.promo(FOUNDING_PROMO), rt.store.promoClaims(FOUNDING_PROMO)])
  const held = claims.filter((c) => !c.releasedAt)
  return (
    <OpsShell title="Billing">
      <Result code={one(q.result)} />
      <section className="mt-8 rounded-2xl border border-paper/15 p-5" aria-labelledby="pp-h">
        <h2 id="pp-h" className="text-xl font-semibold">PayPal</h2>
        <p className="mt-2">Mode: <strong data-testid="paypal-mode">{rt.testMode ? 'test stand-in' : pp.mode === 'live' ? 'live (real money)' : 'sandbox (test money)'}</strong></p>
        {!rt.testMode && pp.missing.length ? (
          <p className="mt-2 text-[#F2A38F]">Missing settings in Vercel: {pp.missing.join(', ')}</p>
        ) : <p className="mt-2 text-paper/85">All PayPal settings are present.</p>}
        <form method="post" action="/api/ops/billing/plans" className="mt-4">
          <button className={goBtn}>Set up plans in PayPal</button>
          <p className="mt-2 text-sm text-muted">Creates one plan per product at today’s prices. Safe to press again: matching plans are kept; changed prices get a new plan.</p>
        </form>
      </section>

      {promo ? (
        <section className="mt-8 rounded-2xl border border-gold/50 p-5" aria-labelledby="offer-h">
          <h2 id="offer-h" className="text-xl font-semibold">{promo.label} offer</h2>
          <p className="mt-2" data-testid="offer-status">{promo.active ? 'On' : 'Off'} · {promo.used} of {promo.maxClaims} spots taken · free until {promo.freeUntil}</p>
          <p className="mt-1 text-sm text-muted">Businesses with a spot pay the setup fee at sign-up; monthly billing starts the day after the free period. Spots not paid within a day go back to the pool.</p>
          <form method="post" action="/api/ops/billing/promo" className="mt-4 grid gap-3 sm:grid-cols-3 sm:items-end">
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="active" defaultChecked={promo.active} className="h-5 w-5 accent-[#C9A14A]" /> Offer is on</label>
            <label className="text-sm">Spots<input name="max" type="number" min={0} max={10000} defaultValue={promo.maxClaims} className={field} /></label>
            <label className="text-sm">Free until<input name="freeUntil" type="date" defaultValue={promo.freeUntil} className={field} /></label>
            <button className={`${goBtn} sm:col-span-3 sm:w-fit`}>Save offer</button>
          </form>
          {held.length ? (
            <ul className="mt-4 space-y-1 text-sm">
              {held.map((c) => <li key={c.tenantId}>{c.tenantName} · {c.subscriptionId ?? 'not paid yet'} · {day(c.claimedAt)}</li>)}
            </ul>
          ) : <p className="mt-4 text-sm text-paper/85">No spots taken yet.</p>}
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="plans-h">
        <h2 id="plans-h" className="text-xl font-semibold">Plans ({plans.length})</h2>
        {plans.length === 0 ? <p className="mt-2 text-paper/85">No plans yet. Press “Set up plans in PayPal”.</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead><tr className="text-muted"><th className="py-2 pr-3">Product</th><th className="py-2 pr-3">Setup</th><th className="py-2 pr-3">Monthly</th><th className="py-2">PayPal plan</th></tr></thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.providerPlanId} className="border-t border-paper/10">
                    <td className="py-2 pr-3">{productByKey(p.productKey)?.name ?? p.productKey}</td>
                    <td className="py-2 pr-3">{usd(p.setup)}</td><td className="py-2 pr-3">{usd(p.monthly)}</td>
                    <td className="py-2 font-mono text-xs">{p.providerPlanId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8" aria-labelledby="subs-h">
        <h2 id="subs-h" className="text-xl font-semibold">Subscriptions ({subs.length})</h2>
        {subs.length === 0 ? <p className="mt-2 text-paper/85">No subscriptions yet.</p> : (
          <ul className="mt-3 space-y-3">
            {subs.map((s) => (
              <li key={s.providerSubscriptionId} className="rounded-xl border border-paper/15 p-4">
                <p className="font-semibold">{s.tenantName}</p>
                <p className="text-sm text-paper/85">{productByKey(s.productKey)?.name ?? s.productKey} · {STATUS_LABEL[s.status] ?? s.status} · paid through {day(s.paidThrough)}</p>
                <p className="font-mono text-xs text-muted">{s.providerSubscriptionId}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </OpsShell>
  )
}
