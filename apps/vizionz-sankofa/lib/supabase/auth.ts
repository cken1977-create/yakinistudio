// VIZIONZ SANKOFA · Server-side auth helpers
// Called from server components and server actions to enforce
// authentication on admin surfaces.

import { redirect } from 'next/navigation'
import { createClient } from './server'

/**
 * Require an authenticated operator session.
 * Redirects to /admin/login if no session exists.
 * Returns the authenticated user on success.
 *
 * Usage at the top of any admin server component:
 *   const user = await requireOperator()
 */
export async function requireOperator() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/admin/login')
  }

  return user
}

/**
 * Get the current operator session if it exists.
 * Returns null if no session — does NOT redirect.
 * Use this when a page should render differently for
 * authenticated vs unauthenticated visitors but never blocks.
 */
export async function getOperator() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
