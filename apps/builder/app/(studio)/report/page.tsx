import type { Metadata } from 'next'
import { REPORT_ERRORS, REPORT_REASONS, type ReportError } from '@/lib/report'
import { freshFormStamp } from '@/lib/server/form-stamp'
import { ui } from '@/components/ui'

/**
 * Report a site (spec 5.11, Flow I): anyone, no sign-in, works with JavaScript off, noindex.
 * The reporter sees a reference code; nobody is emailed automatically except Yakini's own team.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Report a site', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export default async function ReportPage({ searchParams }: Props) {
  const q = await searchParams
  const done = one(q.done)
  const site = one(q.site) ?? ''
  const err = one(q.error) as ReportError | undefined
  if (done && /^[A-Z0-9]{8}$/.test(done)) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-5 py-12">
        <h1 className="font-serif text-4xl">Thank you</h1>
        <p className="mt-4 text-lg text-paper/85">Your report is with the Yakini team. Your reference is <strong className="font-semibold text-gold" data-testid="report-ref">{done}</strong>.</p>
        <p className="mt-3 text-paper/80">We look at every report. If you left an email, we’ll write only if we need to ask you something.</p>
      </main>
    )
  }
  const stamp = freshFormStamp() ?? ''
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-12">
      <h1 className="font-serif text-4xl">Report this site</h1>
      <p className="mt-3 text-paper/85">Tell us what’s wrong. The Yakini team looks at every report. You don’t need an account.</p>
      {err && REPORT_ERRORS[err] ? <p role="alert" className={`mt-6 ${ui.error}`}>{REPORT_ERRORS[err]}</p> : null}
      {!UUID.test(site) ? (
        <p className="mt-8 text-paper/80">Please use the “Report this site” link at the bottom of the site you want to report.</p>
      ) : (
        <form method="post" action="/api/report" className="mt-8 space-y-6">
          <input type="hidden" name="site" value={site} />
          <input type="hidden" name="ts" value={stamp} />
          <fieldset>
            <legend className={ui.label}>What’s the problem?</legend>
            <div className="mt-3 space-y-2">
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className="flex min-h-11 items-center gap-3 rounded-xl border border-paper/20 px-4">
                  <input type="radio" name="reason" value={r.value} required className="h-5 w-5 accent-[#C9A227]" />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="details" className={ui.label}>What did you see?</label>
            <textarea id="details" name="details" required maxLength={2000} rows={5} className={ui.input} />
          </div>
          <div>
            <label htmlFor="email" className={ui.label}>Your email <span className="font-normal text-paper/70">(optional)</span></label>
            <input id="email" name="email" type="email" maxLength={254} autoComplete="email" className={ui.input} aria-describedby="email-hint" />
            <p id="email-hint" className="mt-2 text-sm text-paper/70">Only if you want us to be able to reach you.</p>
          </div>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="owner" value="yes" className="h-5 w-5 accent-[#C9A227]" />
            <span>I own or represent the business shown</span>
          </label>
          <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="company_website">Leave this empty</label>
            <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <button type="submit" className={ui.primary}>Send report</button>
        </form>
      )}
    </main>
  )
}
