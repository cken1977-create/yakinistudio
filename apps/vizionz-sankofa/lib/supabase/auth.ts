// VIZIONZ SANKOFA · Server-side auth + role-aware access control
// Wave 2.5: vs_operators table is the source of truth for role.
//
// Three roles enforced (matching vs_operator_role enum):
//   - 'operator' — full authority (Khadijah, Carly, Clarence)
//   - 'employee' — limited authority (CRM, intake triage, no destructive
//                  actions, no Legacyline promotion)
//   - 'pending'  — signed-in but not yet authorized
//
// Substrate-honest discipline: every server action and admin page calls
// one of these helpers. Bypassing them = bypassing access control. UI
// hiding a button is not security; the server action's role check is.
//
// Pattern: the returned object intersects auth.users.User with role +
// operator row, so existing call sites that use user.id / user.email
// keep working; new call sites can read user.role / user.operator.

import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from './server'

// ─── Types ──────────────────────────────────────────────────────────

export type VsOperatorRole = 'operator' | 'employee' | 'pending'

export type VsOperatorRow = {
  user_id: string
  email: string
  display_name: string | null
  role: VsOperatorRole
  invited_by: string | null
  invited_at: string
  activated_at: string | null
  last_active_at: string | null
  revoked_at: string | null
  revoked_reason: string | null
  created_at: string
  updated_at: string
}

// Intersection type: User + role/operator means existing call sites
// (user.id, user.email) keep working; new ones can branch on user.role.
export type AuthenticatedOperator = User & {
  role: 'operator' | 'employee'
  operator: VsOperatorRow
}

// ─── Internal: load the operator row for the current session ───────

async function loadCurrentOperator(): Promise<
  | { kind: 'unauthenticated' }
  | { kind: 'no_operator_row'; user: User }
  | { kind: 'revoked'; user: User; operator: VsOperatorRow }
  | { kind: 'pending'; user: User; operator: VsOperatorRow }
  | {
      kind: 'authorized'
      user: User
      operator: VsOperatorRow
      role: 'operator' | 'employee'
    }
> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { kind: 'unauthenticated' }
  }

  const { data: operatorRow, error } = await supabase
    .from('vs_operators')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !operatorRow) {
    return { kind: 'no_operator_row', user }
  }

  const operator = operatorRow as VsOperatorRow

  if (operator.revoked_at) {
    return { kind: 'revoked', user, operator }
  }

  if (operator.role === 'pending') {
    return { kind: 'pending', user, operator }
  }

  // role is 'operator' or 'employee' and not revoked
  return {
    kind: 'authorized',
    user,
    operator,
    role: operator.role as 'operator' | 'employee',
  }
}

// ─── Public surface: required-auth helpers (redirect on failure) ───

/**
 * Require the current session to belong to a full operator.
 *
 * - Unauthenticated → redirect to /admin/login
 * - No operator row → redirect to /admin/access-pending
 * - Revoked → redirect to /admin/access-pending
 * - Pending role → redirect to /admin/access-pending
 * - Employee role → redirect to /admin/access-denied (operator-only page)
 * - Operator role → returns AuthenticatedOperator
 *
 * Use this at the top of server components / actions that require full
 * operator authority (delete, promote to Legacyline, manage other users).
 */
export async function requireOperator(): Promise<AuthenticatedOperator> {
  const session = await loadCurrentOperator()

  switch (session.kind) {
    case 'unauthenticated':
      redirect('/admin/login')
    case 'no_operator_row':
    case 'revoked':
    case 'pending':
      redirect('/admin/access-pending')
    case 'authorized':
      if (session.role !== 'operator') {
        redirect('/admin/access-denied')
      }
      return Object.assign(session.user, {
        role: session.role,
        operator: session.operator,
      }) as AuthenticatedOperator
  }
}

/**
 * Require the current session to belong to an operator OR employee.
 *
 * - Unauthenticated → redirect to /admin/login
 * - No operator row / revoked / pending → redirect to /admin/access-pending
 * - Operator or Employee → returns AuthenticatedOperator
 *
 * Use this at the top of server actions that both roles can perform
 * (mark contacted, save notes, refresh status, view intake queue).
 * Server actions still enforce role-specific restrictions in their own
 * body — this helper only verifies the user is authorized at all.
 */
export async function requireOperatorOrEmployee(): Promise<AuthenticatedOperator> {
  const session = await loadCurrentOperator()

  switch (session.kind) {
    case 'unauthenticated':
      redirect('/admin/login')
    case 'no_operator_row':
    case 'revoked':
    case 'pending':
      redirect('/admin/access-pending')
    case 'authorized':
      return Object.assign(session.user, {
        role: session.role,
        operator: session.operator,
      }) as AuthenticatedOperator
  }
}

// ─── Public surface: soft-auth helpers (no redirect) ───────────────

/**
 * Returns the current authenticated operator/employee or null.
 *
 * NEVER redirects. Use this in:
 *   - UI components that conditionally render based on role
 *   - The /admin landing page that wants to know the user's role to
 *     decide which surface cards to show
 *   - Any place that should fail gracefully rather than redirecting
 *
 * Pending/revoked/no-row users return null (treated as not-authorized).
 */
export async function getCurrentOperator(): Promise<AuthenticatedOperator | null> {
  const session = await loadCurrentOperator()

  if (session.kind !== 'authorized') {
    return null
  }

  return Object.assign(session.user, {
    role: session.role,
    operator: session.operator,
  }) as AuthenticatedOperator
}

/**
 * Returns the current Supabase auth user or null. No role check.
 *
 * DEPRECATED for admin surfaces — prefer getCurrentOperator() so callers
 * see the role. Kept for any UI surface that genuinely only needs
 * authentication (e.g. sign-out actions).
 *
 * @deprecated Use getCurrentOperator() for admin surfaces.
 */
export async function getOperator(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// ─── Activity tracking ─────────────────────────────────────────────

/**
 * Update last_active_at for the current operator. Best-effort, fire-
 * and-forget — failures are silently swallowed (activity tracking
 * shouldn't crash the page render).
 *
 * Call ONLY from the /admin landing page so writes are bounded. Do not
 * call from every page or every server action — would multiply DB write
 * traffic for no real product value.
 */
export async function touchLastActive(userId: string): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase
      .from('vs_operators')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', userId)
  } catch {
    // Silently swallow — activity tracking is not load-bearing.
  }
}

// ─── Display name derivation (canonical source) ────────────────────

/**
 * Returns the operator's display name, with substrate-honest fallback.
 *
 * Priority:
 *   1. vs_operators.display_name (operator-set, canonical — e.g.
 *      "Khadijah Asili", "Clarence Kennedy", "Carly Anderson")
 *   2. Email local part with first letter uppercased (e.g. "Cken1977")
 *   3. Literal string "Operator" as last resort
 *
 * Every UI surface that greets the operator must use this helper rather
 * than deriving display name inline. One source of truth means changes
 * (e.g. "show first name only", "show initials") happen in one place.
 */
export function getOperatorDisplayName(user: AuthenticatedOperator): string {
  const fromOperator = user.operator.display_name?.trim()
  if (fromOperator) return fromOperator

  const emailLocal = user.email?.split('@')[0]?.trim()
  if (emailLocal && emailLocal.length > 0) {
    return emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1)
  }

  return 'Operator'
}

