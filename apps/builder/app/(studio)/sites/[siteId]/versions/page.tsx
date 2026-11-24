import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { RestoreButton, SaveVersion } from '@/components/editor/Versions'
import { currentUser } from '@/lib/server/auth'
import { canManageVersions, editorAccess } from '@/lib/server/editor'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'

/** Version history (spec 10.5): every saved version, newest first; owners and editors can restore one. */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Versions', robots: { index: false, follow: false } }

const KIND: Record<string, string> = { checkpoint: 'Saved', published: 'Published', review: 'Waiting for review' }

export default async function Versions({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const a = await editorAccess(rt, siteId)
  if (!a || a.kind !== 'member') {
    if (!(await currentUser())) redirect(signinPath(`/sites/${siteId}/versions`))
    notFound()
  }
  const versions = await rt.store.listVersions(siteId)
  const manage = canManageVersions(a)
  const tz = a.timezone ?? 'UTC'
  const when = (d: Date) => `${d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: tz })}${a.timezone ? '' : ' UTC'}`

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <a href={`/sites/${siteId}/edit`} className="inline-flex min-h-11 items-center text-paper/85 underline-offset-4 hover:text-gold hover:underline">← Back to the editor</a>
      <h1 className="mt-4 font-serif text-4xl">Versions</h1>
      <p className="mt-2 text-paper/85">A version is saved automatically every 20 changes or 10 minutes. Restoring one replaces your draft (your current draft is saved as a version first). Publishing is separate.</p>
      {manage && <SaveVersion siteId={siteId} />}
      {versions.length === 0 ? <p className="mt-8 text-paper/80">No versions yet.</p> : (
        <ol className="mt-8 divide-y divide-paper/10 rounded-2xl border border-paper/15">
          {versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">Version {v.number} <span className="ml-2 text-sm font-normal text-muted">{KIND[v.kind] ?? v.kind}</span></p>
                <p className="text-sm text-paper/80">{when(v.createdAt)}{v.note ? ` · ${v.note}` : ''}</p>
              </div>
              {manage && <RestoreButton siteId={siteId} versionId={v.id} number={v.number} rev={a.rev} />}
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
