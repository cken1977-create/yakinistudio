// VIZIONZ SANKOFA · /admin/grants/[id] — one grant
// Key dates and amounts, timeline (+ Log), tasks and files.
// Executives / operators edit; leadership reads; case managers never see grants.

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireOperatorOrEmployee, getAccessRole, touchLastActive } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { RecordPanel } from '@/components/admin/crm/RecordPanel'
import { Facts, RecordHeader } from '@/components/admin/crm/RecordHeader'
import { loadPanel } from '@/lib/crm/load'
import { Pill, formatDay, todayMountain } from '@/components/admin/ui'
import { GRANT_STATUS_COLORS, GRANT_STATUS_LABELS, type GrantStatus } from '../types'

export const dynamic = 'force-dynamic'

const money = (n: number | null) => (n === null || n === undefined ? null : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`)

export default async function GrantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const user = await requireOperatorOrEmployee()
  const role = getAccessRole(user)
  if (role === 'case_manager' || !role) redirect('/admin/access-denied')
  void touchLastActive(user.id)
  const supabase = await createClient()
  const { data } = await supabase.from('grants')
    .select('id, name, status, funder_id, amount_requested, amount_awarded, amount_spent, application_due_at, submitted_at, decided_at, period_start, period_end, next_report_due, description, external_grant_id, funder:funder_id(id, name)')
    .eq('id', id).maybeSingle()
  if (!data) notFound()
  const g = data as unknown as {
    id: string; name: string; status: GrantStatus; amount_requested: number | null; amount_awarded: number | null; amount_spent: number | null
    application_due_at: string | null; submitted_at: string | null; decided_at: string | null; period_start: string | null; period_end: string | null
    next_report_due: string | null; description: string | null; external_grant_id: string | null
    funder: { id: string; name: string } | { id: string; name: string }[] | null
  }
  const funder = Array.isArray(g.funder) ? g.funder[0] : g.funder
  const panel = await loadPanel(supabase, user, role, 'grant', id, g.name)
  const color = GRANT_STATUS_COLORS[g.status]

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'Grants', href: '/admin/grants' }, { label: g.name }]} fallbackHref="/admin/grants" fallbackLabel="Grants" />
      <RecordHeader kicker="Grant" title={g.name} accent="#007A33"
        pills={<Pill fg={color?.fg} bg={color?.bg}>{GRANT_STATUS_LABELS[g.status] ?? g.status}</Pill>} />
      <Facts items={[
        ['Funder', funder ? <Link href={`/admin/organizations/${funder.id}`} style={{ color: '#0A2548' }}>{funder.name}</Link> : null],
        ['Requested', money(g.amount_requested)],
        ['Awarded', money(g.amount_awarded)],
        ['Spent', money(g.amount_spent)],
        ['Application due', g.application_due_at ? formatDay(g.application_due_at) : null],
        ['Next report due', g.next_report_due ? formatDay(g.next_report_due) : null],
        ['Period', g.period_start || g.period_end ? `${formatDay(g.period_start)} – ${formatDay(g.period_end)}` : null],
        ['Grant ID', g.external_grant_id],
      ]} />
      {g.description && <p style={{ fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '16px 0 0' }}>{g.description}</p>}
      <p style={{ fontSize: '13px', margin: '12px 0 0' }}><Link href="/admin/grants" style={{ color: '#0A2548' }}>Edit amounts and dates on the Grants list →</Link></p>
      <RecordPanel {...panel} today={todayMountain()} />
    </div>
  )
}
