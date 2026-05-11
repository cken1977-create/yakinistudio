// VIZIONZ SANKOFA · Supabase service-role client (Wave 3.3a)
//
// SECURITY NOTE — server-only.
// This file imports SUPABASE_SERVICE_ROLE_KEY which bypasses Row-Level Security.
// It MUST only be imported from server-side modules:
//   - Server actions ("use server" files)
//   - API route handlers (app/api/**)
//   - Server-side library code in lib/processing/**
//
// Never import this from a "use client" component. Never expose the returned
// client to the browser. Doing so would allow anyone to read or write any row
// in the Supabase project regardless of RLS policies.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedAdminClient: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  // Cache the client across invocations within a single Lambda/edge instance.
  // Cold starts create a new client; warm invocations reuse this one.
  if (cachedAdminClient) return cachedAdminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'createAdminClient: NEXT_PUBLIC_SUPABASE_URL is not set. ' +
      'Check Vercel environment variables.'
    )
  }
  if (!serviceRoleKey) {
    throw new Error(
      'createAdminClient: SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Check Vercel environment variables — this is required for server-side ' +
      'operations that bypass Row-Level Security (Storage downloads, batch inserts).'
    )
  }

  cachedAdminClient = createClient(url, serviceRoleKey, {
    auth: {
      // Service-role client represents the system, not a user session.
      // Disable session persistence and auto-refresh to avoid carrying any
      // accidental auth state across requests.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return cachedAdminClient
}
