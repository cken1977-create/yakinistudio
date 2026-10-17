// VIZIONZ SANKOFA · Case-manager "My Day" (server component)
// Today's list from the case manager's own caseload (RLS-scoped):
// follow-ups due, no contact in NO_CONTACT_DAYS, stuck in a stage, returning.

import Link from 'next/link'
import type { SupabaseClient } from '@supabase/supabase-js'
import { LogContactForm } from './LogContactForm'

const NO_CONTACT_DAYS = 14
const STUCK_DAYS = 30

const STAGE_LABEL: Record<string, string> = {
  intake: 'Intake', review: 'Review', consent_signed: 'Consent signed', enrolled: 'Enrolled',
  receiving_services: 'Receiving services', readiness_evaluation: 'Readiness evaluation',
  certified: 'Certified', exited: 'Exited',
}

type P = { id: string; first_name: string; last_name: string; preferred_name: string | null; current_stage: string; stage_changed_at: string; is_returning: boolean }
type N = { participant_id: string; occurred_at: string; next_action: string | null; next_action_due: string | null; next_action_completed: boolean | null }

export async function MyDay({ supabase }: { supabase: SupabaseClient }) {
  const { data: pData } = await supabase
    .from('participants')
    .select('id, first_name, last_name, preferred_name, current_stage, stage_changed_at, is_returning')
    .neq('current_stage', 'exited')
    .order('last_name')
  const people = (pData ?? []) as P[]
  const ids = people.map((p) => p.id)
  const { data: nData } = ids.length
    ? await supabase
        .from('case_notes')
        .select('participant_id, occurred_at, next_action, next_action_due, next_action_completed')
        .in('participant_id', ids)
        .order('occurred_at', { ascending: false })
    : { data: [] }
  const latest = new Map<string, N>()
  for (const n of (nData ?? []) as N[]) if (!latest.has(n.participant_id)) latest.set(n.participant_id, n)

  const now = Date.now()
  const today = new Date().toISOString().slice(0, 10)
  const days = (iso: string) => Math.floor((now - new Date(iso).getTime()) / 86400000)

  const rows = people.map((p) => {
    const n = latest.get(p.id)
    const flags: string[] = []
    if (n?.next_action && !n.next_action_completed && n.next_action_due && n.next_action_due <= today) flags.push(n.next_action_due < today ? 'Follow-up overdue' : 'Follow-up today')
    if (!n || days(n.occurred_at) >= NO_CONTACT_DAYS) flags.push(n ? `No contact ${days(n.occurred_at)} days` : 'Never contacted')
    if (days(p.stage_changed_at) >= STUCK_DAYS) flags.push(`${days(p.stage_changed_at)} days in ${STAGE_LABEL[p.current_stage] ?? p.current_stage}`)
    if (p.is_returning) flags.push('Returning client')
    return { p, n, flags }
  })
  const needs = rows.filter((r) => r.flags.length > 0).sort((a, b) => b.flags.length - a.flags.length)
  const clients = people.map((p) => ({ id: p.id, label: `${p.preferred_name || p.first_name} ${p.last_name}` }))

  const cell = { padding: '10px 12px', borderBottom: '1px solid rgba(10,10,10,0.06)', fontSize: '15px', verticalAlign: 'top' } as const

  return (
    <section style={{ marginBottom: '32px', fontFamily: 'Georgia, serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)', gap: '24px', alignItems: 'start' }}>
        <div>
          <h2 style={{ fontSize: '26px', margin: '0 0 12px', fontFamily: '"DM Serif Display", Georgia, serif' }}>My Day</h2>
          <p style={{ margin: '0 0 12px', color: 'rgba(10,10,10,0.65)' }}>
            {people.length} active client{people.length === 1 ? '' : 's'} in your caseload · {needs.length} need attention
          </p>
          {needs.length === 0 ? (
            <p style={{ background: '#fff', padding: '16px', border: '1px solid rgba(10,10,10,0.08)', borderRadius: '4px' }}>Nothing urgent today.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid rgba(10,10,10,0.08)' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: '13px', color: 'rgba(10,10,10,0.6)' }}>
                  <th style={cell}>Client</th><th style={cell}>Last contact</th><th style={cell}>Next action</th><th style={cell}>Why</th>
                </tr>
              </thead>
              <tbody>
                {needs.map(({ p, n, flags }) => (
                  <tr key={p.id}>
                    <td style={cell}><Link href={`/admin/participants/${p.id}`} style={{ color: '#0A2548' }}>{p.preferred_name || p.first_name} {p.last_name}</Link><div style={{ fontSize: '13px', color: 'rgba(10,10,10,0.55)' }}>{STAGE_LABEL[p.current_stage] ?? p.current_stage}</div></td>
                    <td style={cell}>{n ? `${days(n.occurred_at)} days ago` : '—'}</td>
                    <td style={cell}>{n?.next_action ? `${n.next_action}${n.next_action_due ? ` (${n.next_action_due})` : ''}` : '—'}</td>
                    <td style={{ ...cell, color: '#CE1126' }}>{flags.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <LogContactForm clients={clients} />
        </div>
      </div>
    </section>
  )
}
