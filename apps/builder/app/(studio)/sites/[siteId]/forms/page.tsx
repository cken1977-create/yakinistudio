import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { currentUser } from '@/lib/server/auth'
import { editorAccess } from '@/lib/server/editor'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'

/**
 * Forms (spec 10.1 /sites/[id]/forms, 11.3): the messages visitors sent from the live site, newest
 * first, read-only. Until the portal link (Phase 6) this is where they live; the owner also gets
 * an email for each one. Reply to people yourself: nothing is sent to them automatically.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Messages', robots: { index: false, follow: false } }

const KIND: Record<string, string> = { contact: 'Message', catering: 'Catering request', booking_request: 'Booking request' }
const LABEL: Record<string, string> = { name: 'Name', email: 'Email', phone: 'Phone', message: 'Message', event_date: 'Date', guest_count: 'Guests', service: 'Interested in' }

export default async function Forms({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const a = await editorAccess(rt, siteId)
  if (!a || a.kind !== 'member') {
    if (!(await currentUser())) redirect(signinPath(`/sites/${siteId}/forms`))
    notFound()
  }
  const rows = await rt.store.listSubmissions(siteId, 50)
  const tz = a.timezone ?? 'UTC'
  const when = (d: Date) => `${d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: tz })}${a.timezone ? '' : ' UTC'}`
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <a href={`/sites/${siteId}/edit`} className="inline-flex min-h-11 items-center text-paper/85 underline-offset-4 hover:text-gold hover:underline">← Back to the editor</a>
      <h1 className="mt-4 font-serif text-4xl">Messages</h1>
      <p className="mt-2 text-paper/85">What visitors sent from your live site. You also get an email for each one. Nobody is sent anything automatically, so reply when you’re ready.</p>
      {rows.length === 0 ? <p className="mt-8 text-paper/80">No messages yet. They’ll show up here once your site is live.</p> : (
        <ol className="mt-8 space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-paper/15 p-4">
              <p className="font-semibold">{KIND[r.kind] ?? 'Message'} <span className="ml-2 text-sm font-normal text-muted">{when(r.createdAt)}</span></p>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {Object.entries(r.payload).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-paper/70">{LABEL[k] ?? k}</dt>
                    <dd className="whitespace-pre-wrap break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
