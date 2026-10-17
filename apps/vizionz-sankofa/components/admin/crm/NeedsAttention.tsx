// VIZIONZ SANKOFA · "Needs attention" panel for the executive / operator home
// Overdue tasks across the office, grant and report deadlines in the next
// 14 days, partner check-ins overdue, agreements expiring, new Get Help
// requests and clients with no recent contact. Every query is RLS-scoped.

import Link from 'next/link'
import type { SupabaseClient } from '@supabase/supabase-js'
import { addDays, needsAttention } from '@/lib/crm/model'
import { loadStaff } from '@/lib/crm/load'
import { Pill, SectionLabel, TONES, todayMountain } from '../ui'

export async function NeedsAttention({ supabase }: { supabase: SupabaseClient }) {
  const today = todayMountain()
  const horizon = addDays(today, 14)
  const staleCutoff = new Date(Date.now() - 14 * 86400000).toISOString()
  const [tasks, grants, partners, agreements, intakes, active, recentNotes, staff] = await Promise.all([
    supabase.from('vs_tasks').select('id, title, due_on, assigned_to').eq('status', 'open').lt('due_on', today).order('due_on').limit(25),
    supabase.from('grants').select('id, name, status, application_due_at, next_report_due')
      .or(`and(status.eq.drafting,application_due_at.lte.${horizon}),and(status.eq.awarded,next_report_due.lte.${horizon})`).limit(25),
    supabase.from('organizations').select('id, name, next_touch_due').in('relationship_kind', ['partner', 'both', 'agency'])
      .lt('next_touch_due', today).neq('status', 'inactive').limit(25),
    supabase.from('vs_partner_agreements').select('organization_id, title, expires_on').in('status', ['signed', 'active'])
      .lte('expires_on', addDays(today, 30)).gte('expires_on', today).limit(25),
    supabase.from('intake_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('participants').select('id').eq('status', 'active').limit(2000),
    supabase.from('case_notes').select('participant_id').gte('occurred_at', staleCutoff).limit(5000),
    loadStaff(supabase),
  ])
  const contacted = new Set(((recentNotes.data ?? []) as Array<{ participant_id: string }>).map((n) => n.participant_id))
  const staleClients = ((active.data ?? []) as Array<{ id: string }>).filter((p) => !contacted.has(p.id)).length
  const name = (id: string) => staff.find((s) => s.user_id === id)?.display_name ?? 'Unassigned'

  const items = needsAttention({
    today,
    overdueTasks: ((tasks.data ?? []) as Array<{ id: string; title: string; due_on: string; assigned_to: string }>).map((t) => ({ ...t, assignee: name(t.assigned_to) })),
    grants: (grants.data ?? []) as Array<{ id: string; name: string; status: string; application_due_at: string | null; next_report_due: string | null }>,
    partnersOverdue: (partners.data ?? []) as Array<{ id: string; name: string; next_touch_due: string }>,
    agreementsExpiring: (agreements.data ?? []) as Array<{ organization_id: string; title: string; expires_on: string }>,
    newIntakes: intakes.count ?? 0,
    staleClients,
  })

  return (
    <section data-testid="needs-attention" style={{ marginBottom: '40px' }}>
      <SectionLabel right={<Link href="/admin/my-day" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0A2548', textDecoration: 'none' }}>My Day →</Link>}>
        Needs attention today · {items.length}
      </SectionLabel>
      {items.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.08)', borderRadius: '8px', padding: '16px 18px', fontSize: '15px' }}>
          Nothing urgent. No overdue tasks, deadlines in the next two weeks, or overdue check-ins.
        </div>
      ) : (
        <ul style={{ margin: 0, padding: 0, background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
          {items.slice(0, 12).map((i, idx) => (
            <li key={i.key} style={{ listStyle: 'none', borderTop: idx ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
              <Link href={i.href} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', textDecoration: 'none', color: 'inherit', flexWrap: 'wrap', minHeight: '44px' }}>
                <Pill {...TONES[i.tone]}>{i.tone === 'red' ? 'Late' : i.tone === 'amber' ? 'Soon' : 'Check'}</Pill>
                <span style={{ fontSize: '15px', fontWeight: 600, flex: '1 1 220px', overflowWrap: 'anywhere' }}>{i.label}</span>
                <span style={{ fontSize: '13px', color: 'rgba(10,10,10,0.55)' }}>{i.detail}</span>
              </Link>
            </li>
          ))}
          {items.length > 12 && <li style={{ listStyle: 'none', padding: '10px 16px', fontSize: '13px', color: 'rgba(10,10,10,0.55)' }}>and {items.length - 12} more</li>}
        </ul>
      )}
    </section>
  )
}
