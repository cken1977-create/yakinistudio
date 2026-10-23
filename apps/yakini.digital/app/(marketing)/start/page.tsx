import type { Metadata } from 'next'
import { SiteShell } from '@/components/SiteShell'
import { BuildFlow } from '@/components/start/BuildFlow'
import { FLOW_CSS } from '@/components/start/flow-css'
import { safeBuildToken } from '@/lib/orders/saved-build'
import { intakeTestMode, loadCatalog, loadSeats } from '@/lib/orders/submit'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Build your system · Yakini',
  description: 'Pick what your business needs. A real Yakini person builds it with you, on your own domain. One total, and no card is charged today.',
  alternates: { canonical: 'https://yakini.digital/start' },
}

function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw : ''
}

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[]; kit?: string | string[]; build?: string | string[] }>
}) {
  const query = await searchParams
  const [catalog, seats] = await Promise.all([loadCatalog(), loadSeats()])
  const initialPlanId = first(query.plan) || first(query.kit)
  const buildToken = safeBuildToken(first(query.build)) ?? ''

  return (
    <SiteShell>
      <style>{FLOW_CSS}</style>
      {catalog ? (
        <BuildFlow catalog={catalog} seats={seats} initialPlanId={initialPlanId} testMode={intakeTestMode()} buildToken={buildToken} />
      ) : (
        <div className="st">
          <div className="st-wrap">
            <div className="st-kicker"><span className="yk-eyebrow-dot" /> Build it with you</div>
            <h1 className="st-h">The plans are not loading.</h1>
            <p className="st-lead">
              Email <a className="yk-gold" href="mailto:hello@yakini.digital">hello@yakini.digital</a> and a Yakini person will set this up with you. No card is charged from this page.
            </p>
          </div>
        </div>
      )}
    </SiteShell>
  )
}
