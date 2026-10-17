// VIZIONZ SANKOFA · Client flow at a glance (executive / leadership home)
import type { SupabaseClient } from '@supabase/supabase-js'

const ORDER = ['intake', 'review', 'consent_signed', 'enrolled', 'receiving_services', 'readiness_evaluation', 'certified', 'exited']
const LABEL: Record<string, string> = {
  intake: 'Intake', review: 'Review', consent_signed: 'Consent signed', enrolled: 'Enrolled',
  receiving_services: 'Receiving services', readiness_evaluation: 'Readiness eval.', certified: 'Certified', exited: 'Exited',
}
type Row = { current_stage: string; participants: number; avg_days_in_stage: number | null; stalled_over_30_days: number; returning_clients: number }

export async function StageSummary({ supabase, large = false }: { supabase: SupabaseClient; large?: boolean }) {
  const { data, error } = await supabase.from('vs_stage_summary').select('*')
  if (error) return null
  const by = new Map(((data ?? []) as Row[]).map((r) => [r.current_stage, r]))
  return (
    <section style={{ marginBottom: '32px', fontFamily: 'Georgia, serif' }}>
      <h2 style={{ fontSize: large ? '26px' : '22px', margin: '0 0 12px', fontFamily: '"DM Serif Display", Georgia, serif' }}>Where clients are</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {ORDER.map((s) => {
          const r = by.get(s)
          return (
            <div key={s} style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.08)', borderTop: '3px solid #CE1126', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(10,10,10,0.6)' }}>{LABEL[s]}</div>
              <div style={{ fontSize: large ? '32px' : '28px', fontWeight: 600 }}>{r?.participants ?? 0}</div>
              <div style={{ fontSize: '12px', color: 'rgba(10,10,10,0.55)' }}>
                {r?.avg_days_in_stage != null ? `avg ${r.avg_days_in_stage} days` : '—'}
                {r && r.stalled_over_30_days > 0 ? ` · ${r.stalled_over_30_days} stalled` : ''}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
