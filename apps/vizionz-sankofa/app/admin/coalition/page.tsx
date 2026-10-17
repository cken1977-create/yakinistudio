// VIZIONZ SANKOFA · /admin/coalition — Coalition Partners
//
// The organizations VS works alongside (organizations.relationship_kind =
// partner or both): MOU / agreement tracking, partner check-ins, and the
// programs they help run. Partner organizations themselves are added and
// edited under Funders & Partners; this screen tracks the working relationship.

import Link from 'next/link'
import { requireOperatorOrEmployee, touchLastActive, getAccessRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { Notice, PageIntro, Stat, StatStrip, isMissingTable, todayMountain } from '@/components/admin/ui'
import { CoalitionListClient, type PartnerSummary } from './CoalitionListClient'
import {
  EXPIRING_WINDOW_DAYS,
  LIVE_AGREEMENT_STATUSES,
  daysUntil,
  type AgreementStatus,
  type PartnerOrg,
} from './types'
import { PARTNER_ORG_COLUMNS } from './types'

export const dynamic = 'force-dynamic'

export default async function CoalitionPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const canSeeCheckins = role === 'executive' || role === 'operator' || role === 'leadership_readonly'
  const canEdit = role === 'executive' || role === 'operator'
  const today = todayMountain()

  const supabase = await createClient()
  const { data: orgData } = await supabase
    .from('organizations')
    .select(PARTNER_ORG_COLUMNS)
    .in('relationship_kind', ['partner', 'both'])
    // Retired partners (status inactive) stay in the database with their
    // agreements and check-ins, but leave the coalition list.
    .or('status.is.null,status.neq.inactive')
    .order('name', { ascending: true })
  const orgs = (orgData ?? []) as unknown as PartnerOrg[]
  const ids = orgs.map((o) => o.id)

  let missing = false
  const agreementsByOrg = new Map<string, { status: AgreementStatus; expires_on: string | null }[]>()
  const lastCheckin = new Map<string, string>()
  const programCount = new Map<string, number>()

  if (ids.length > 0) {
    const [ag, pr, ck] = await Promise.all([
      supabase.from('vs_partner_agreements').select('organization_id, status, expires_on').in('organization_id', ids),
      supabase.from('vs_partner_programs').select('organization_id, status').in('organization_id', ids),
      canSeeCheckins
        ? supabase
            .from('vs_partner_checkins')
            .select('organization_id, occurred_on')
            .in('organization_id', ids)
            .order('occurred_on', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ])
    if (isMissingTable(ag.error) || isMissingTable(pr.error) || isMissingTable(ck.error)) missing = true
    for (const a of (ag.data ?? []) as { organization_id: string; status: AgreementStatus; expires_on: string | null }[]) {
      const list = agreementsByOrg.get(a.organization_id) ?? []
      list.push({ status: a.status, expires_on: a.expires_on })
      agreementsByOrg.set(a.organization_id, list)
    }
    for (const p of (pr.data ?? []) as { organization_id: string; status: string }[]) {
      if (p.status === 'active' || p.status === 'planned') programCount.set(p.organization_id, (programCount.get(p.organization_id) ?? 0) + 1)
    }
    for (const c of (ck.data ?? []) as { organization_id: string; occurred_on: string }[]) {
      if (!lastCheckin.has(c.organization_id)) lastCheckin.set(c.organization_id, c.occurred_on)
    }
  }

  const partners: PartnerSummary[] = orgs.map((o) => {
    const ags = agreementsByOrg.get(o.id) ?? []
    const live = ags.filter((a) => LIVE_AGREEMENT_STATUSES.includes(a.status))
    const liveNotExpired = live.filter((a) => {
      const d = daysUntil(a.expires_on, today)
      return d === null || d >= 0
    })
    const soonest = liveNotExpired
      .map((a) => a.expires_on)
      .filter((d): d is string => !!d)
      .sort()[0] ?? null
    const soonDays = daysUntil(soonest, today)
    const touch = daysUntil(o.next_touch_due, today)
    return {
      org: o,
      agreementCount: ags.length,
      hasLiveMou: liveNotExpired.length > 0,
      pendingAgreement: ags.some((a) => ['drafting', 'in_review', 'sent'].includes(a.status)),
      expiringOn: soonDays !== null && soonDays <= EXPIRING_WINDOW_DAYS ? soonest : null,
      lastCheckin: lastCheckin.get(o.id) ?? null,
      checkinOverdue: touch !== null && touch < 0,
      sharedPrograms: programCount.get(o.id) ?? 0,
    }
  })

  const withMou = partners.filter((p) => p.hasLiveMou).length
  const expiring = partners.filter((p) => p.expiringOn).length
  const overdue = partners.filter((p) => p.checkinOverdue).length

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'Coalition Partners' }]} fallbackHref="/admin" fallbackLabel="Operations" />
      <PageIntro kicker="Coalition" title="Coalition Partners">
        The organizations Vizionz Sankofa works alongside. Track each MOU or agreement, log
        partner check-ins, and see which programs each partner helps run.
        {canEdit && (
          <>
            {' '}
            To add a new partner organization, use{' '}
            <Link href="/admin/organizations?kind=partner" style={{ color: '#5B2C8F' }}>
              Funders &amp; Partners
            </Link>
            .
          </>
        )}
      </PageIntro>

      {missing && (
        <Notice>
          The coalition tables are not in the database yet. Apply migration{' '}
          <code>20261017000700_vs_coalition_partners.sql</code> to track agreements, check-ins and shared programs.
        </Notice>
      )}

      <StatStrip>
        <Stat label="Partners" value={partners.length} accent="#5B2C8F" />
        <Stat label="With a live MOU" value={missing ? '—' : withMou} accent="#007A33" />
        <Stat label={`Expiring in ${EXPIRING_WINDOW_DAYS} days`} value={missing ? '—' : expiring} accent="#B45F00" />
        <Stat label="Check-ins overdue" value={overdue} accent="#CE1126" />
      </StatStrip>

      <CoalitionListClient partners={partners} showCheckins={canSeeCheckins} />
    </div>
  )
}
