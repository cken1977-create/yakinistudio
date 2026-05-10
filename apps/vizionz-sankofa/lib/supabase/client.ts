// VIZIONZ SANKOFA · Supabase browser client
// Used in client components for reads against RLS-protected tables
// and for storage uploads after authentication.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
