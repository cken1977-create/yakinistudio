import type { Metadata } from 'next'
import { AcademyShell } from '@/components/academy/AcademyShell'
import { UnsubscribeView } from '@/components/academy/UnsubscribeView'
import { UNSUB } from '@/lib/academy/copy'

export const metadata: Metadata = { title: UNSUB['es'].htmlTitle, robots: { index: false, follow: false }, referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }) {
  const t = (await searchParams).t
  return (
    <AcademyShell lang="es" otherLangHref={null}>
      <main className="ya-main"><div className="ya-narrow">
        <UnsubscribeView lang="es" token={typeof t === 'string' && /^[0-9a-f]{48}$/.test(t) ? t : null} />
      </div></main>
    </AcademyShell>
  )
}
