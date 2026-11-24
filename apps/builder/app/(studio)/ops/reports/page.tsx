import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { OpsShell, Result, dangerBtn, field, goBtn, smallBtn } from '@/components/ops'
import { REPORT_REASONS } from '@/lib/report'
import { currentUser } from '@/lib/server/auth'
import { operatorOf } from '@/lib/server/ops'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'

/**
 * Reports and takedown (spec 5.11 step 4, 14.8): each report with its site, source address,
 * ownership confirmation, plan status and history. Dismiss, mark actioned, take down or restore.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Reports', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const REASON = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]))

export default async function Reports({ searchParams }: Props) {
  const q = await searchParams
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const o = await operatorOf(rt)
  if (!o) { if (!(await currentUser())) redirect(signinPath('/ops/reports')); notFound() }
  const all = one(q.status) === 'all'
  const reports = await rt.store.listReports(all ? 'all' : 'open')
  const history = new Map<string, number>()
  for (const r of await rt.store.listReports('all')) history.set(r.siteId, (history.get(r.siteId) ?? 0) + 1)
  const when = (d: Date) => d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC'
  return (
    <OpsShell title="Reports">
      <Result code={one(q.result)} />
      <p className="mt-3 text-sm">
        {all ? <a href="/ops/reports" className="text-gold underline underline-offset-4">Show open only</a> : <a href="/ops/reports?status=all" className="text-gold underline underline-offset-4">Show all</a>}
      </p>
      {reports.length === 0 ? <p className="mt-8 text-paper/80">No {all ? '' : 'open '}reports.</p> : (
        <ol className="mt-6 space-y-5">
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl border border-paper/15 p-5" data-testid="report">
              <p className="font-semibold">{r.tenantName} <span className="ml-2 text-sm font-normal text-muted">{r.host}</span></p>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-paper/70">Reason</dt><dd>{REASON[r.reason] ?? r.reason}</dd>
                <dt className="text-paper/70">Reported</dt><dd>{when(r.createdAt)} · {r.status}</dd>
                <dt className="text-paper/70">Details</dt><dd className="whitespace-pre-wrap break-words">{r.details}</dd>
                <dt className="text-paper/70">Reporter</dt><dd>{r.reporterEmail ?? 'no email'}{r.reporterSaysOwner ? ' · says they own the business' : ''}</dd>
                <dt className="text-paper/70">Built from</dt><dd className="break-all">{r.sourceUrl ?? 'a description (no website)'}</dd>
                <dt className="text-paper/70">Owner confirmed</dt><dd>{r.ownershipAttested ? 'yes' : 'no'}</dd>
                <dt className="text-paper/70">Plan</dt><dd>{r.tenantStatus}</dd>
                <dt className="text-paper/70">Reports on this site</dt><dd>{history.get(r.siteId) ?? 1}</dd>
                <dt className="text-paper/70">Site state</dt><dd>{r.takedownKind === 'auto_hold' ? 'held automatically' : r.takedownKind === 'operator' ? 'taken down' : 'up'}</dd>
              </dl>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                {r.status === 'open' ? (
                  <>
                    <form method="post" action={`/api/ops/reports/${r.id}`}><input type="hidden" name="status" value="dismissed" /><button className={smallBtn}>Dismiss</button></form>
                    <form method="post" action={`/api/ops/reports/${r.id}`}><input type="hidden" name="status" value="actioned" /><button className={smallBtn}>Mark actioned</button></form>
                  </>
                ) : null}
                {o.op.canTakedown && !r.takedownKind ? (
                  <form method="post" action={`/api/ops/sites/${r.siteId}/takedown`} className="flex flex-wrap items-end gap-2">
                    <label className="text-sm">Reason
                      <select name="reason" defaultValue={r.reason} className={field}>
                        {REPORT_REASONS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                      </select>
                    </label>
                    <label className="text-sm">Note<input name="note" maxLength={500} className={field} /></label>
                    <button className={dangerBtn}>Take down</button>
                  </form>
                ) : null}
                {o.op.canTakedown && r.takedownKind ? (
                  <form method="post" action={`/api/ops/sites/${r.siteId}/takedown/lift`}><button className={goBtn}>Restore site</button></form>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </OpsShell>
  )
}
