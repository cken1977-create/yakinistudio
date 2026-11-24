import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { loadSiteDoc } from '@yakini/site-schema'
import { OpsShell, Result, field, goBtn, smallBtn } from '@/components/ops'
import { currentUser } from '@/lib/server/auth'
import { operatorOf } from '@/lib/server/ops'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'

/**
 * Review queue (spec 14.8 #6): the version waiting for a look, next to the source site and the
 * brand it was built with, and why it is here. Approve publishes that version; Reject keeps it on
 * its preview. Nobody is emailed about a decision (R5).
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Reviews', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const WHY: Record<string, string> = {
  impersonation_name: 'Name matches a big brand', impersonation_slug: 'Address matches a big brand', impersonation_source: 'Built from a big brand’s website',
  verification_phrase: 'Asks visitors to verify or pay', open_report: 'Has an open report', share_link: 'Preview link was refused',
}

export default async function Reviews({ searchParams }: Props) {
  const q = await searchParams
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const o = await operatorOf(rt)
  if (!o) { if (!(await currentUser())) redirect(signinPath('/ops/reviews')); notFound() }
  const reviews = await rt.store.listReviews('pending')
  return (
    <OpsShell title="Reviews">
      <Result code={one(q.result)} />
      {reviews.length === 0 ? <p className="mt-8 text-paper/80">Nothing waiting.</p> : (
        <ol className="mt-6 space-y-5">
          {await Promise.all(reviews.map(async (r) => {
            const full = await rt.store.getReview(r.id)
            let colors: string[] = [], name = r.tenantName
            try { const d = loadSiteDoc(full?.doc).doc; colors = Object.values(d.brand.colors); name = d.business.name } catch { /* shown without brand */ }
            const reasons = r.flags.filter((f) => f.rule !== 'address' && f.rule !== 'override_reason')
            const address = r.flags.find((f) => f.rule === 'address')?.match
            const override = r.flags.find((f) => f.rule === 'override_reason')?.match
            return (
              <li key={r.id} className="rounded-2xl border border-paper/15 p-5" data-testid="review">
                <p className="font-semibold">{name} <span className="ml-2 text-sm font-normal text-muted">version {r.versionNumber}</span></p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-paper/70">Why</dt>
                  <dd>{r.trigger === 'override' ? `Publish without a plan${override ? `: “${override}”` : ''}` : ''}{reasons.map((f) => `${WHY[f.rule] ?? f.rule} (${f.match})`).join(' · ')}</dd>
                  {address ? <><dt className="text-paper/70">Address</dt><dd>{address}</dd></> : null}
                  <dt className="text-paper/70">Built from</dt><dd className="break-all">{r.sourceUrl ?? 'a description (no website)'}</dd>
                  <dt className="text-paper/70">Brand</dt>
                  <dd className="flex items-center gap-2">{colors.map((c) => <span key={c} title={c} className="inline-block h-5 w-5 rounded-full border border-paper/30" style={{ background: c }} />)}<span className="text-paper/70">{colors.join(' ')}</span></dd>
                </dl>
                <p className="mt-3"><a href={`/p/${r.siteId}?v=${r.versionId}`} target="_blank" rel="noopener" className="text-gold underline underline-offset-4">Open this version</a></p>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <form method="post" action={`/api/ops/reviews/${r.id}`} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="decision" value="approve" />
                    <button className={goBtn}>Approve</button>
                  </form>
                  <form method="post" action={`/api/ops/reviews/${r.id}`} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="decision" value="reject" />
                    <label className="text-sm">Note<input name="note" maxLength={500} className={field} /></label>
                    <button className={smallBtn}>Reject</button>
                  </form>
                </div>
              </li>
            )
          }))}
        </ol>
      )}
    </OpsShell>
  )
}
