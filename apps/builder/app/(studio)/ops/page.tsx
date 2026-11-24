import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { OpsShell, Result, goBtn } from '@/components/ops'
import { currentUser } from '@/lib/server/auth'
import { operatorOf } from '@/lib/server/ops'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'

/** Operator desk (spec 5.10, Flow H): reports, the first-publish review queue, Check stored sites. */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Operator desk', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function OpsDesk({ searchParams }: Props) {
  const q = await searchParams
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const o = await operatorOf(rt)
  if (!o) { if (!(await currentUser())) redirect(signinPath('/ops')); notFound() }
  const [reports, reviews] = await Promise.all([rt.store.listReports('open'), rt.store.listReviews('pending')])
  const checked = one(q.checked), failed = one(q.failed)
  return (
    <OpsShell title="Operator desk">
      <Result code={one(q.result)} />
      {checked && /^\d+$/.test(checked) && failed && /^\d+$/.test(failed) ? (
        <p className="mt-3 text-paper/85" data-testid="schema-result">Checked {checked} stored versions: {failed === '0' ? 'every one opens.' : `${failed} can’t be opened. See the audit log for which.`}</p>
      ) : null}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        <li className="rounded-2xl border border-paper/15 p-5">
          <p className="text-3xl font-semibold">{reports.length}</p>
          <p className="text-paper/80">open reports</p>
          <a href="/ops/reports" className="mt-3 inline-flex min-h-11 items-center text-gold underline underline-offset-4">Open reports</a>
        </li>
        <li className="rounded-2xl border border-paper/15 p-5">
          <p className="text-3xl font-semibold">{reviews.length}</p>
          <p className="text-paper/80">sites waiting for a look</p>
          <a href="/ops/reviews" className="mt-3 inline-flex min-h-11 items-center text-gold underline underline-offset-4">Open reviews</a>
        </li>
      </ul>
      <section className="mt-10 rounded-2xl border border-paper/15 p-5">
        <h2 className="text-xl font-semibold">Check stored sites</h2>
        <p className="mt-2 text-paper/80">Opens every stored version with today’s site format, read-only, and reports any that can’t be opened. Run it after a site-format update.</p>
        <form method="post" action="/api/ops/schema-check" className="mt-4">
          <button type="submit" className={goBtn}>Check stored sites</button>
        </form>
      </section>
    </OpsShell>
  )
}
