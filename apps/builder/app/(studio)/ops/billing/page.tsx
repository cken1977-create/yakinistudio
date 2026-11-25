import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { productByKey } from '@yakini/pricing/products'
import { OpsShell, Result, goBtn } from '@/components/ops'
import { STATUS_LABEL, usd } from '@/lib/billing-copy'
import { currentUser } from '@/lib/server/auth'
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
  const [plans, subs] = await Promise.all([rt.store.activePlans(), rt.store.listSubscriptions()])
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
