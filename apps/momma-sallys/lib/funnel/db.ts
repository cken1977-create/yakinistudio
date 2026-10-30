// Server-only access to the catering funnel tables in Momma Sally's database.
// Everything goes through one keyed database function (ms_funnel); the tables themselves are closed to
// public keys. Import from route handlers / server components / server actions only.
import 'server-only'

export type Lead = {
  id: string
  created_at: string
  full_name: string
  email: string | null
  phone: string | null
  event_date: string | null
  headcount: number | null
  event_type: string
  budget: string | null
  notes: string | null
  source: string
  lang: 'en' | 'es'
  email_consent: boolean
  consent_text: string | null
  consent_at: string | null
  stage: 'inquiry' | 'proposal_sent' | 'tasting' | 'booked' | 'lost'
  stage_changed_at: string
  lost_reason: string | null
  replied_at: string | null
  unsubscribed_at: string | null
  unsub_token?: string
  quote_amount_cents: number | null
  quote_note: string | null
  deposit_url: string | null
  quote_sent_at: string | null
  deposit_paid_at: string | null
  is_test: boolean
}

export type LeadEvent = { id: string; kind: string; body: string | null; created_at: string }
export type LeadEmail = { id: string; kind: string; to_email: string | null; status: string; send_id: string | null; scheduled_for: string | null; error: string | null; created_at: string }

export class FunnelNotConfigured extends Error {}

function conf() {
  const url = process.env.FUNNEL_DB_URL?.trim()
  const pub = process.env.FUNNEL_DB_PUBLIC_KEY?.trim()
  const key = process.env.MS_FUNNEL_KEY?.trim()
  if (!url || !pub || !key) throw new FunnelNotConfigured('catering funnel database is not configured')
  return { url: url.replace(/\/$/, ''), pub, key }
}

export function funnelConfigured(): boolean {
  try { conf(); return true } catch { return false }
}

export async function funnel<T = unknown>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  const c = conf()
  const r = await fetch(`${c.url}/rest/v1/rpc/ms_funnel`, {
    method: 'POST',
    headers: { apikey: c.pub, Authorization: `Bearer ${c.pub}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_key: c.key, p_op: op, p_args: args }),
    cache: 'no-store',
  })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(`funnel ${op} failed (${r.status}) ${String((j as { message?: string } | null)?.message ?? '').slice(0, 120)}`)
  return j as T
}
