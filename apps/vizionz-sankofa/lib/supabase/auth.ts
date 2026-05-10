// VIZIONZ SANKOFA · Server-side auth helpers
// Called from server components and server actions to enforce
// authentication on admin surfaces.
//
// TODO Wave 2: Role-based access. Khadijah + Carly = 'operator' (full
// admin access); other VS employees = 'employee' (CRM surfaces only).
// Implementation path: add user_role to auth.users.raw_user_meta_data
// or create a new vs_operators table, then expose role in
// requireOperator() return signature so admin pages can branch on it.

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
