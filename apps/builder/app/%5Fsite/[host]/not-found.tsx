import type { Metadata } from 'next'

export const metadata: Metadata = { title: { absolute: 'This site is unavailable' }, description: null, robots: { index: false, follow: false } }

/** Neutral page for unknown hosts and sites under takedown or auto-hold (spec 11.4, 14.8 #9). No reason, no vendor names. */
export default function SiteUnavailable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-neutral-900">
      <div>
        <h1 className="font-serif text-3xl">This site is unavailable.</h1>
        <p className="mt-3 text-neutral-600">Please check the address and try again.</p>
      </div>
    </main>
  )
}
