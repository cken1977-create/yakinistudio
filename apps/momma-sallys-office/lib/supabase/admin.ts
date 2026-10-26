// MOMMA SALLY'S OFFICE · service-role client (ported from Vizionz Sankofa)
// SERVER-ONLY. Bypasses RLS. Used only by the Square sync, webhooks, cron,
// and the owner's "add crew" action (after requireOwner()). Never import
// from a "use client" file.
import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service client is not configured')
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return cached
}
