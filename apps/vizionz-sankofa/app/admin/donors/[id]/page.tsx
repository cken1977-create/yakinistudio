// VIZIONZ SANKOFA · /admin/donors/[id] — one donor
// Giving summary and recent gifts (including in-kind), timeline (+ Log),
// tasks and files. Executives / operators edit; leadership reads;
// case managers never see donors.

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { requireOperatorOrEmployee, getAccessRole, touchLastActive } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { RecordPanel } from '@/components/admin/crm/RecordPanel'
import { Facts, RecordHeader } from '@/components/admin/crm/RecordHeader'
import { loadPanel } from '@/lib/crm/load'
import { Card, Meta, Pill, SectionLabel, TONES, formatDay, todayMountain } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

const money = (cents: number | null | undefined) => `$${((cents ?? 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

export default async function DonorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const user = await requireOperatorOrEmployee()
  const role = getAccessRole(user)
  if (role === 'case_manager' || !role) redirect('/admin/access-denied')
  void touchLastActive(user.id)
  const supabase = await createClient()
  const { data } = await supabase.from('donors')
    .select('id, display_name, email, phone, donor_type, status, city, state, recurring, first_gift_date, last_gift_date, total_lifetime_amount_cents, total_gifts_count, notes')
    .eq('id', id).maybeSingle()
  if (!data) notFound()
  const d = data as unknown as {
    id: string; display_name: string; email: string | null; phone: string | null; donor_type: string; status: string; city: string | null; state: string | null
    recurring: boolean; first_gift_date: string | null; last_gift_date: string | null; total_lifetime_amount_cents: number; total_gifts_count: number; notes: string | null
  }
  const [gifts, panel] = await Promise.all([
    supabase.from('donor_gifts').select('id, amount_cents, gift_date, method, designation, notes').eq('donor_id', id).order('gift_date', { ascending: false }).limit(25),
    loadPanel(supabase, user, role, 'donor', id, d.display_name),
  ])
  const giftRows = (gifts.data ?? []) as Array<{ id: string; amount_cents: number; gift_date: string; method: string; designation: string | null; notes: string | null }>

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'Donors', href: '/admin/donors' }, { label: d.display_name }]} fallbackHref="/admin/donors" fallbackLabel="Donors" />
      <RecordHeader kicker={`Donor · ${d.donor_type}`} title={d.display_name} accent="#B45F00"
        pills={<>{d.recurring && <Pill {...TONES.green}>Recurring</Pill>}{d.status !== 'active' && <Pill {...TONES.grey}>{d.status.replace('_', ' ')}</Pill>}</>} />
      <Facts items={[
        ['Lifetime giving', money(d.total_lifetime_amount_cents)],
        ['Gifts', String(d.total_gifts_count ?? 0)],
        ['Last gift', d.last_gift_date ? formatDay(d.last_gift_date) : null],
        ['Phone', d.phone ? <a href={`tel:${d.phone}`} style={{ color: '#0A2548' }}>{d.phone}</a> : null],
        ['Email', d.email ? <a href={`mailto:${d.email}`} style={{ color: '#0A2548' }}>{d.email}</a> : null],
        ['City', [d.city, d.state].filter(Boolean).join(', ') || null],
      ]} />
      {d.notes && <p style={{ fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '16px 0 0' }}>{d.notes}</p>}
      <div style={{ marginTop: '28px' }}>
        <SectionLabel right={<Link href="/admin/donors" style={{ fontSize: '12px', color: '#0A2548' }}>Record gifts on the Donors list →</Link>}>Recent gifts</SectionLabel>
        {giftRows.length === 0 ? <p style={{ fontSize: '14px', color: 'rgba(10,10,10,0.55)', margin: 0 }}>No gifts recorded.</p> : (
          <div style={{ display: 'grid', gap: '6px' }}>
            {giftRows.map((g) => (
              <Card key={g.id} style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>{money(g.amount_cents)} {g.method === 'in_kind' && <Pill {...TONES.purple}>In-kind</Pill>}</span>
                <Meta>{[formatDay(g.gift_date), g.method.replace('_', ' '), g.designation].filter(Boolean).join(' · ')}</Meta>
              </Card>
            ))}
          </div>
        )}
      </div>
      <RecordPanel {...panel} today={todayMountain()} />
    </div>
  )
}
