import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { loadSiteDoc, SiteDocError, type Business } from '@yakini/site-schema'
import { ui } from '@/components/ui'
import { TimeZoneSelect } from '@/components/TimeZoneSelect'
import { CLAIM_ERRORS, DAYS, OWNERSHIP_TEXT, US_STATES } from '@/lib/claim'
import { currentUser } from '@/lib/server/auth'
import { openDraft } from '@/lib/server/draft-access'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'
import { memberSite } from '@/lib/server/site-access'

/**
 * Flow B, "Make it mine" (spec 5.4 steps 3-5): a signed-in person holding this browser's draft
 * cookie confirms the business is theirs and, if they like, adds phone, address and hours. One
 * screen, all optional except the checkbox. Works with JavaScript off.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Make it yours', robots: { index: false, follow: false } }

type Props = {
  params: Promise<{ siteId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** +19155550123 → (915) 555-0123, for the form. */
const showPhone = (e164: string | undefined) => {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164 ?? '')
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : ''
}

export default async function Claim({ params, searchParams }: Props) {
  const [{ siteId }, q] = await Promise.all([params, searchParams])
  let rt
  try { rt = getRuntime() } catch { notFound() }

  const user = await currentUser()
  if (!user) redirect(signinPath(`/claim/${siteId}`))

  const draft = await openDraft(rt, siteId)
  if (!draft) {
    // Already theirs (claimed in another tab, or a reload after claiming): go straight to the editor.
    if (await memberSite(rt, siteId, user)) redirect(`/sites/${siteId}/edit`)
    return <Gone />
  }

  let business: Business
  try {
    business = loadSiteDoc(draft.doc).doc.business
  } catch (e) {
    if (e instanceof SiteDocError) notFound()
    throw e
  }
  const code = one(q.e) ?? ''
  const error = (CLAIM_ERRORS as Record<string, string>)[code] ?? null
  const hours = new Map((business.hours ?? []).map((h) => [h.day, h]))
  const a = business.address

  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-10 sm:py-16">
      <a href={`/d/${siteId}`} className="inline-flex min-h-11 items-center text-paper/85 underline-offset-4 hover:text-gold hover:underline">← Back to your draft</a>
      <h1 className="mt-6 font-serif text-4xl leading-tight">Make it yours</h1>
      <p className="mt-3 text-lg text-paper/85">
        You’re signed in as <strong className="font-semibold">{user.email}</strong>. Confirm this is your business, and add anything you’d like customers to see. You can change all of it later.
      </p>
      {error && <p role="alert" className={`mt-6 ${ui.error}`}>{error}</p>}

      <form method="post" action={`/api/drafts/${siteId}/claim`} className="mt-10 space-y-8">
        <input type="hidden" name="rev" value={draft.rev} />

        <div>
          <label htmlFor="phone" className={ui.label}>Business phone <span className="font-normal text-muted">(optional)</span></label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={40} defaultValue={showPhone(business.phone)}
            placeholder="(915) 555-0123" className={ui.input} />
        </div>

        <fieldset className="space-y-4 rounded-2xl border border-paper/15 p-5">
          <legend className="px-1 text-sm font-semibold">Address <span className="font-normal text-muted">(optional)</span></legend>
          <div>
            <label htmlFor="line1" className={ui.label}>Street</label>
            <input id="line1" name="line1" maxLength={120} autoComplete="address-line1" defaultValue={a?.line1 ?? ''} className={ui.input} />
          </div>
          <div>
            <label htmlFor="line2" className={ui.label}>Suite or unit <span className="font-normal text-muted">(optional)</span></label>
            <input id="line2" name="line2" maxLength={120} autoComplete="address-line2" defaultValue={a?.line2 ?? ''} className={ui.input} />
          </div>
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="city" className={ui.label}>City</label>
              <input id="city" name="city" maxLength={80} autoComplete="address-level2" defaultValue={a?.city ?? ''} className={ui.input} />
            </div>
            <div className="col-span-3 sm:col-span-1">
              <label htmlFor="state" className={ui.label}>State</label>
              <select id="state" name="state" autoComplete="address-level1" defaultValue={a?.region ?? ''} className={ui.input}>
                <option value=""> </option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-3 sm:col-span-2">
              <label htmlFor="postal" className={ui.label}>ZIP</label>
              <input id="postal" name="postal" inputMode="numeric" autoComplete="postal-code" pattern="\d{5}(-\d{4})?" maxLength={10} defaultValue={a?.postal ?? ''} className={ui.input} />
            </div>
          </div>
          <p className={ui.hint}>Food trucks can leave this empty and add today’s spot later.</p>
        </fieldset>

        <fieldset className="rounded-2xl border border-paper/15 p-5">
          <legend className="px-1 text-sm font-semibold">Hours <span className="font-normal text-muted">(optional)</span></legend>
          <p className={ui.hint}>Leave a day empty to skip it. Tick “Closed” for days you’re closed.</p>
          <div className="mt-4 space-y-4">
            {DAYS.map((d) => {
              const h = hours.get(d.id)
              const open = h && 'open' in h ? h.open : ''
              const close = h && 'close' in h ? h.close : ''
              return (
                <div key={d.id} className="grid grid-cols-[6.5rem_1fr_1fr] items-end gap-3 sm:grid-cols-[7rem_1fr_1fr_auto]">
                  <span className="pb-3 text-base font-semibold">{d.label}</span>
                  <label className="text-sm text-paper/85">Opens
                    <input type="time" name={`${d.id}-open`} defaultValue={open} className={`${ui.input} py-2`} />
                  </label>
                  <label className="text-sm text-paper/85">Closes
                    <input type="time" name={`${d.id}-close`} defaultValue={close} className={`${ui.input} py-2`} />
                  </label>
                  <label className="col-start-2 flex min-h-11 items-center gap-2 text-base sm:col-start-auto">
                    <input type="checkbox" name={`${d.id}-closed`} defaultChecked={Boolean(h && 'closed' in h)} className="h-5 w-5 accent-[#C9A14A]" /> Closed
                  </label>
                </div>
              )
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="timezone" className={ui.label}>Time zone</label>
          <TimeZoneSelect id="timezone" initial="" className={ui.input} />
          <p className={ui.hint}>Used for “today” updates and your visit counts.</p>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-gold/50 p-5 text-base">
          <input type="checkbox" name="attest" required className="mt-1 h-5 w-5 shrink-0 accent-[#C9A14A]" />
          <span>{OWNERSHIP_TEXT}</span>
        </label>

        <button type="submit" className={`${ui.primary} w-full sm:w-auto`}>Make it mine</button>
      </form>
    </main>
  )
}

function Gone() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div>
        <h1 className="font-serif text-3xl">We couldn’t find this draft here</h1>
        <p className="mt-3 text-paper/85">Drafts stay in the browser that made them for 14 days. Open it on that device, or start a new one from the demo.</p>
        <p className="mt-6"><a href="https://yakini.digital/demo" className={ui.primary}>Back to the demo</a></p>
      </div>
    </main>
  )
}
