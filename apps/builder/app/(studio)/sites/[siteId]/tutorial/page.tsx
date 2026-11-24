import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { ui } from '@/components/ui'
import { TOUR_STEPS } from '@/lib/editor/tutorial'
import { TUTORIAL_SHOTS } from '@/lib/editor/tutorial-shots'
import { currentUser } from '@/lib/server/auth'
import { editorAccess } from '@/lib/server/editor'
import { getRuntime } from '@/lib/server/runtime'
import { signinPath } from '@/lib/server/signin'

/**
 * The written tutorial (spec 10.9, R13): the same 8 steps as the guided tour, with words for
 * computers and phones and a "Show me" button that opens the editor at that step of the tour.
 * Plain HTML: readable with JavaScript off, and printable.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'How to use the editor', robots: { index: false, follow: false } }

export default async function Tutorial({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  let rt
  try { rt = getRuntime() } catch { notFound() }
  const a = await editorAccess(rt, siteId)
  if (!a) {
    if (!(await currentUser())) redirect(signinPath(`/sites/${siteId}/tutorial`))
    notFound()
  }
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <a href={`/sites/${siteId}/edit`} className="inline-flex min-h-11 items-center text-paper/85 underline-offset-4 hover:text-gold hover:underline">← Back to the editor</a>
      <h1 className="mt-4 font-serif text-4xl">How to use the editor</h1>
      <p className="mt-2 text-lg text-paper/85">Eight short steps. Tap “Show me” on any step and the editor walks you through it.</p>
      <ol className="mt-8 space-y-8">
        {TOUR_STEPS.map((s, i) => (
          <li key={s.id} id={s.id} className="rounded-2xl border border-paper/15 p-5">
            <h2 className="font-serif text-2xl"><span className="text-gold">{i + 1}.</span> {s.title}</h2>
            <p className="mt-2 text-paper/90">{s.body}</p>
            {s.phoneBody && <p className="mt-2 text-paper/80"><strong className="font-semibold">On a phone:</strong> {s.phoneBody}</p>}
            {(TUTORIAL_SHOTS.has(`${s.id}-1280`) || TUTORIAL_SHOTS.has(`${s.id}-390`)) && (
              <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr]">
                {TUTORIAL_SHOTS.has(`${s.id}-1280`) && <Image src={`/tutorial/${s.id}-1280.png`} alt={`${s.title} on a computer`} width={1280} height={800} className="h-auto w-full rounded-lg border border-paper/10" />}
                {TUTORIAL_SHOTS.has(`${s.id}-390`) && <Image src={`/tutorial/${s.id}-390.png`} alt={`${s.title} on a phone`} width={390} height={844} className="h-auto w-full rounded-lg border border-paper/10" />}
              </div>
            )}
            <a href={`/sites/${siteId}/edit?tour=${s.id}`} className={`${ui.secondary} mt-4`}>Show me</a>
          </li>
        ))}
      </ol>
    </main>
  )
}
