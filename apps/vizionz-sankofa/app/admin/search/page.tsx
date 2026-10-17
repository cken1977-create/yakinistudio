// VIZIONZ SANKOFA · /admin/search — one search box for the office
// People, organizations, clients (name only), donors, grants, tasks and
// documents. Runs vs_global_search as the signed-in user, so each table's
// row-level security decides what comes back. Every search is audited.

import Link from 'next/link'
import { requireOperatorOrEmployee, getAccessRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { subjectHref } from '@/lib/crm/model'
import { Card, EmptyState, Meta, Notice, PageIntro, Pill, SectionLabel, TONES, inputStyle, primaryBtn } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

type Hit = { kind: 'contact' | 'organization' | 'participant' | 'donor' | 'grant' | 'task' | 'document'; id: string; title: string; subtitle: string | null }
const GROUPS: Array<[Hit['kind'], string]> = [
  ['contact', 'People'], ['organization', 'Organizations'], ['participant', 'Clients'], ['task', 'Tasks'],
  ['grant', 'Grants'], ['donor', 'Donors'], ['document', 'Documents'],
]

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: raw } = await searchParams
  const q = (raw ?? '').trim().slice(0, 100)
  const user = await requireOperatorOrEmployee()
  const role = getAccessRole(user)
  const supabase = await createClient()

  let hits: Hit[] = []
  let failed = false
  if (q.length >= 2 && role) {
    const { data, error } = await supabase.rpc('vs_global_search', { p_query: q, p_limit: 8 })
    failed = !!error
    hits = (data ?? []) as Hit[]
    const counts = Object.fromEntries(GROUPS.map(([k]) => [k, hits.filter((h) => h.kind === k).length]))
    await supabase.rpc('vs_log_event', { p_action: 'view', p_table_name: 'global_search', p_record_id: null, p_details: { query: q, counts } })
  }

  return (
    <div>
      <PageIntro kicker="Office CRM" title="Search" />
      <form action="/admin/search" role="search" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <input name="q" type="search" defaultValue={q} autoFocus aria-label="Search everything" minLength={2}
          placeholder="Name, organization, grant, task or document…" style={{ ...inputStyle, flex: '1 1 260px', width: 'auto', fontSize: '16px' }} />
        <button type="submit" style={{ ...primaryBtn(), minHeight: '44px' }}>Search</button>
      </form>
      {!role && <Notice>Your account has no data-access role yet, so search is off.</Notice>}
      {failed && <Notice tone="red">Search isn’t available yet (needs migration 2000).</Notice>}
      {q.length >= 2 && role && !failed && (hits.length === 0 ? (
        <EmptyState title={`Nothing found for “${q}”`}>Try part of a name, or check the spelling.</EmptyState>
      ) : (
        <div data-testid="search-results" style={{ display: 'grid', gap: '24px' }}>
          {GROUPS.filter(([k]) => hits.some((h) => h.kind === k)).map(([k, label]) => (
            <section key={k}>
              <SectionLabel>{label}</SectionLabel>
              <ul style={{ margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
                {hits.filter((h) => h.kind === k).map((h) => (
                  <li key={`${k}-${h.id}`} style={{ listStyle: 'none' }}>
                    <Link href={subjectHref(h.kind, h.id)} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Card style={{ padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{h.title}</span>
                        {h.subtitle && <Meta>{h.subtitle.replace(/_/g, ' ')}</Meta>}
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p style={{ fontSize: '12px', color: 'rgba(10,10,10,0.5)', margin: 0 }}>
            <Pill {...TONES.grey}>Note</Pill> Results only include records your role may see. Searches are logged.
          </p>
        </div>
      ))}
    </div>
  )
}
