import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fakePayPalState } from '@/lib/server/paypal'
import { isTestMode } from '@/lib/server/runtime'

/** Test mode only: stands in for PayPal's approval page so browser tests never touch PayPal. */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Test payment', robots: { index: false, follow: false } }

export default async function FakePayPal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isTestMode()) notFound()
  const q = await searchParams
  const id = typeof q.subscription_id === 'string' ? q.subscription_id : ''
  const sub = fakePayPalState().subs.get(id)
  if (!sub) notFound()
  const plan = fakePayPalState().plans.get(sub.planId ?? '')
  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <p className="text-sm uppercase tracking-wide text-muted">Test payment page (stands in for PayPal)</p>
      <h1 className="mt-2 font-serif text-3xl">Approve this plan?</h1>
      {plan ? <p className="mt-3 text-paper/85">{plan.name}: ${plan.setup.toFixed(2)} today, then ${plan.monthly.toFixed(2)} a month.</p> : null}
      <form method="post" action="/api/dev/paypal" className="mt-6 flex flex-wrap gap-3">
        <input type="hidden" name="subscription_id" value={sub.id} />
        <button name="decision" value="approve" className="inline-flex min-h-12 items-center rounded-full bg-gold px-6 font-semibold text-ink">Agree and subscribe</button>
        <button name="decision" value="approve-slow" className="inline-flex min-h-12 items-center rounded-full border border-paper/25 px-6 font-semibold">Agree (PayPal still confirming)</button>
        <button name="decision" value="cancel" className="inline-flex min-h-12 items-center rounded-full border border-paper/25 px-6 font-semibold">Cancel and return</button>
      </form>
    </main>
  )
}
