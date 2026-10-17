// VIZIONZ SANKOFA · Intelligence · Known-person dictionary for PII stripping
//
// Loads the names of every person VS holds (participants, intakes, family
// members, staff, individual donors) with the service-role client, so a
// name is stripped from AI requests even when the asker can't see that
// record. Names never leave the server. Cached for 5 minutes per instance.
// Fails closed: if names can't be loaded, the AI call does not happen.

import { createAdminClient } from '@/lib/supabase/admin'

const TTL_MS = 5 * 60 * 1000
const PAGE = 1000
let cache: { at: number; names: string[] } | null = null

async function pageAll(table: string, columns: string): Promise<Record<string, unknown>[]> {
  const supabase = createAdminClient()
  const out: Record<string, unknown>[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE - 1)
    if (error) throw new Error(`known-names: ${table}: ${error.message}`)
    const rows = (data ?? []) as unknown as Record<string, unknown>[]
    out.push(...rows)
    if (rows.length < PAGE) break
  }
  return out
}

export async function loadKnownNames(): Promise<string[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.names
  const [participants, intakes, family, staff, donors] = await Promise.all([
    pageAll('participants', 'first_name, last_name, preferred_name'),
    pageAll('intake_requests', 'full_name'),
    pageAll('participant_family_members', 'member_name'),
    pageAll('staff', 'first_name, last_name'),
    pageAll('donors', 'first_name, last_name, display_name, donor_type'),
  ])
  const names: string[] = []
  const s = (v: unknown) => (typeof v === 'string' ? v : '')
  for (const p of participants) {
    names.push(`${s(p.first_name)} ${s(p.last_name)}`, s(p.preferred_name))
  }
  for (const i of intakes) names.push(s(i.full_name))
  for (const f of family) names.push(s(f.member_name))
  for (const st of staff) names.push(`${s(st.first_name)} ${s(st.last_name)}`)
  for (const d of donors) {
    if (d.donor_type === 'individual' || d.donor_type === 'family' || d.donor_type === 'anonymous') {
      names.push(`${s(d.first_name)} ${s(d.last_name)}`, s(d.display_name))
    }
  }
  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n.length >= 3))]
  cache = { at: Date.now(), names: unique }
  return unique
}
