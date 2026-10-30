import { redirect } from 'next/navigation'
import { repSession } from '@/lib/server/guard'
import { KITS, isLive, videoUrl } from '@/lib/reps/kits'
import { KitCard, type KitCardData } from './KitCard'

// Rendered per request for a signed-in rep only (middleware also gates /reps).
export const dynamic = 'force-dynamic'

export default async function RepsPage() {
  const rep = await repSession()
  if (!rep) redirect('/reps/login')

  const cards: KitCardData[] = KITS.map(k => ({
    slug: k.slug,
    name: k.name,
    audience: k.audience,
    pitch: k.pitch,
    thumbnail: k.thumbnail ?? null,
    url: isLive(k) ? k.url : null,
    video: isLive(k) ? videoUrl(k) : null,
    blurb: k.blurb ?? `the ${k.name}`,
  }))

  return (
    <>
      <header className="rp-top">
        <div className="rp-top-inner">
          <a href="/reps" className="rp-brand" aria-label="Demo Library">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/yakini-lockup.jpg" alt="Yakini" width={784} height={1168} />
            <span>
              <span className="rp-brand-name">Yakini</span>
              <span className="rp-brand-sub">Demo Library</span>
            </span>
          </a>
          <div className="rp-who">
            <span className="rp-who-email" title={rep.e}>{rep.e}</span>
            <form action="/api/auth/signout?to=reps" method="post">
              <button type="submit" className="rp-btn-ghost">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="rp-wrap">
        <div className="rp-eyebrow">For Yakini reps</div>
        <h1 className="rp-h1">Demo <em>Library</em></h1>
        <p className="rp-lead">
          One card per industry kit. Open the guided tour or the narrated video, or share the public link with a prospect.
          Every link here is a public demo with sample data only. Prospects never need to sign in.
        </p>

        <div className="rp-grid">
          {cards.map(c => <KitCard key={c.slug} kit={c} />)}
        </div>

        <p className="rp-foot">
          Only demo links live here. Customer information is never shown on this page.
          Need a kit that is not listed yet? Ask Clarence.
        </p>
      </main>
    </>
  )
}
