import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { ui } from '@/components/ui'
import { currentUser } from '@/lib/server/auth'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'

/** My sites (spec 10.1): most people have one, so a single site opens straight in the editor. */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Your sites', robots: { index: false, follow: false } }

const STATUS: Record<string, string> = { prospect: 'Draft', trial: 'Trial', active: 'Active', past_due: 'Payment due', canceled: 'Canceled' }

export default async function Sites() {
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const user = await currentUser()
  if (!user) redirect(signinPath('/sites'))
  const sites = await rt.store.sitesForUser(user.id)
  if (sites.length === 1) redirect(`/sites/${sites[0].siteId}/edit`)
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-10 sm:py-16">
      <h1 className="font-serif text-4xl">Your sites</h1>
      {sites.length === 0 ? (
        <div className="mt-6 space-y-4 text-paper/85">
          <p>There are no sites on <strong>{user.email}</strong> yet. Start one from the free demo, then tap “Make it mine”.</p>
          <a href="https://yakini.digital/demo" className={ui.primary}>Try the free demo</a>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {sites.map((s) => (
            <li key={s.siteId}><a href={`/sites/${s.siteId}/edit`} className="flex min-h-14 items-center justify-between rounded-2xl border border-paper/15 px-5 hover:border-gold">
              <span className="font-semibold">{s.name}</span><span className="text-sm text-muted">{STATUS[s.status] ?? s.status}</span>
            </a></li>
          ))}
        </ul>
      )}
      <form method="post" action="/api/auth/signout" className="mt-10"><button type="submit" className={ui.secondary}>Sign out</button></form>
    </main>
  )
}
