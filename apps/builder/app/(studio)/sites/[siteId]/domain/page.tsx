import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { currentUser } from '@/lib/server/auth'
import { checkSiteDomains, DOMAIN_RESULTS } from '@/lib/server/domains'
import { DOMAIN_INPUT_MESSAGE } from '@/lib/domain/parse'
import { canPublish, siteMember } from '@/lib/server/publish'
import { getRuntime } from '@/lib/server/runtime'
import { phase3Settings } from '@/lib/server/settings'
import { signinPath } from '@/lib/server/signin'

/** Your own domain (Phase 5a): connect, see the DNS records to add, check, remove. Works without JavaScript. */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Your own domain', robots: { index: false, follow: false } }

type Props = { params: Promise<{ siteId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
const btn = 'inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold'
const MESSAGES: Record<string, string> = { ...DOMAIN_RESULTS, ...DOMAIN_INPUT_MESSAGE, confirm_remove: 'Tick the box to confirm, then press Remove domain.', bad_input: 'Please try that again.' }
const STATUS: Record<string, string> = {
  active: 'Working', misconfigured: 'Waiting for your DNS records', verifying: 'Waiting for the TXT record',
  pending: 'Setting up', error: 'We couldn’t check it just now',
}
const AUTO_CHECK_MS = 60_000
const nowMs = () => Date.now()

export default async function DomainPage({ params, searchParams }: Props) {
  const { siteId } = await params
  const q = await searchParams
  const result = typeof q.result === 'string' ? q.result : undefined
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const m = await siteMember(rt, siteId)
  if (!m) { if (!(await currentUser())) redirect(signinPath(`/sites/${siteId}/domain`)); notFound() }
  const manage = canPublish(m.role)
  let rows = await rt.store.customDomains(siteId)
  const now = nowMs()
  // Opening the page checks again when the last check is more than a minute old.
  const stale = rows.some((r) => r.status !== 'active' && (!r.lastCheckedAt || now - r.lastCheckedAt.getTime() > AUTO_CHECK_MS))
  if (manage && stale) rows = await checkSiteDomains(rt, siteId).catch(() => rows)
  const main = rows[0]
  const live = main?.status === 'active'
  const free = m.info.slug && !m.info.slug.startsWith('draft-') ? `${m.info.slug}.${phase3Settings().rootDomain}` : null
  const records = rows.flatMap((r) => (r.status === 'active' ? [] : (r.check?.records ?? []).map((rec) => ({ ...rec, name: r.hostname }))))
  const seen = new Set<string>()
  const uniqueRecords = records.filter((r) => { const k = `${r.type}|${r.host}|${r.value}`; if (seen.has(k)) return false; seen.add(k); return true })

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <a href={`/sites/${siteId}/publish`} className="inline-flex min-h-11 items-center text-paper/85 underline-offset-4 hover:text-gold hover:underline">← Back to Publish</a>
      <h1 className="mt-4 font-serif text-4xl">Your own domain</h1>
      <p className="mt-2 text-paper/85">Use a domain you own, like yourbusiness.com, as your site’s address.{free ? ` Your free address ${free} keeps working and sends visitors to it.` : ''}</p>
      {result && MESSAGES[result] ? <p role="status" className="mt-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">{MESSAGES[result]}</p> : null}

      {!main ? (
        <section className="mt-8 rounded-2xl border border-paper/15 p-6" aria-labelledby="add-h">
          <h2 id="add-h" className="text-xl font-semibold">Connect a domain</h2>
          {!manage ? <p className="mt-2">Only the owner can connect a domain.</p> : !m.info.hasPlan && m.role !== 'operator' ? (
            <>
              <p className="mt-2 text-paper/85">Your own domain comes with every plan.</p>
              <a href={`/sites/${siteId}/plan`} className={`${btn} mt-4 bg-gold text-ink`}>Choose a plan</a>
            </>
          ) : (
            <form method="post" action={`/api/sites/${siteId}/domain`} className="mt-3">
              <input type="hidden" name="action" value="connect" />
              <label htmlFor="domain" className="block font-semibold">Your domain</label>
              <p id="domain-help" className="mt-1 text-sm text-muted">Type it like yourbusiness.com (we add www too), or shop.yourbusiness.com for just one part.</p>
              <input id="domain" name="domain" required maxLength={253} autoComplete="off" autoCapitalize="none" spellCheck={false} inputMode="url" aria-describedby="domain-help"
                className="mt-2 block min-h-12 w-full rounded-xl border border-paper/25 bg-transparent px-4 text-lg" placeholder="yourbusiness.com" />
              <button className={`${btn} mt-4 bg-gold text-ink`}>Connect domain</button>
              <p className="mt-3 text-sm text-muted">Don’t have one yet? Buy it from any domain seller, then come back here.</p>
            </form>
          )}
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-paper/15 p-6" aria-labelledby="dom-h">
            <h2 id="dom-h" className="text-xl font-semibold [overflow-wrap:anywhere]">{main.hostname}</h2>
            <ul className="mt-3 space-y-1">
              {rows.map((r) => (
                <li key={r.hostname} data-testid="domain-status" className="[overflow-wrap:anywhere]">
                  {r.hostname}: <strong className={r.status === 'active' ? 'text-gold' : ''}>{STATUS[r.status] ?? r.status}</strong>
                  {r.isPrimary ? <span className="text-paper/80"> (main address)</span> : null}
                </li>
              ))}
            </ul>
            {live ? (
              <p className="mt-4">Your site is at <a href={`https://${main.hostname}`} className="text-gold underline underline-offset-4">https://{main.hostname}</a>. The secure lock (HTTPS) is set up for you.</p>
            ) : main.check?.reason ? <p className="mt-3 text-paper/85">{main.check.reason}</p> : null}
            {manage ? (
              <form method="post" action={`/api/sites/${siteId}/domain`} className="mt-5">
                <input type="hidden" name="action" value="check" />
                <button className={`${btn} ${live ? 'border border-paper/25 hover:border-gold' : 'bg-gold text-ink'}`}>Check now</button>
                {!live ? <p className="mt-2 text-sm text-muted">We also check every night and switch your site over by itself once it works.</p> : null}
              </form>
            ) : null}
          </section>

          {uniqueRecords.length ? (
            <section className="mt-6 rounded-2xl border border-paper/15 p-6" aria-labelledby="rec-h">
              <h2 id="rec-h" className="text-xl font-semibold">Add these records</h2>
              <p className="mt-1 text-paper/85">Sign in where you bought your domain, open its DNS settings, and add each record exactly as shown. If a record with the same type and host is already there, change it instead.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[20rem] text-left text-sm" data-testid="dns-records">
                  <thead><tr className="border-b border-paper/15"><th scope="col" className="py-2 pr-3">Type</th><th scope="col" className="py-2 pr-3">Host / Name</th><th scope="col" className="py-2">Value</th></tr></thead>
                  <tbody>
                    {uniqueRecords.map((r) => (
                      <tr key={`${r.type}${r.host}${r.value}`} className="border-b border-paper/10 align-top">
                        <td className="py-2 pr-3 font-semibold">{r.type}</td>
                        <td className="py-2 pr-3"><code className="break-all select-all">{r.host}</code></td>
                        <td className="py-2"><code className="break-all select-all">{r.value}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-muted">“@” means the domain itself; some providers want it left blank. Changes can take a few minutes, sometimes up to a day.</p>
            </section>
          ) : null}

          {manage ? (
            <form method="post" action={`/api/sites/${siteId}/domain`} className="mt-6 rounded-2xl border border-paper/15 p-6">
              <input type="hidden" name="action" value="remove" />
              <h2 className="text-lg font-semibold">Remove this domain</h2>
              <p className="mt-1 text-sm text-muted">Your site stays live at your free address. Your domain itself stays yours.</p>
              <label className="mt-3 flex min-h-11 items-center gap-3"><input type="checkbox" name="confirm" value="yes" className="h-5 w-5 accent-[#C9A14A]" /> I want to remove {main.hostname}</label>
              <button className={`${btn} mt-3 border border-paper/25 hover:border-gold`}>Remove domain</button>
            </form>
          ) : null}
        </>
      )}
    </main>
  )
}
