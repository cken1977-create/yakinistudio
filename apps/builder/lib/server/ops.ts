import 'server-only'
import { currentUser, type SessionUser } from './auth'
import type { OperatorRow } from './publish-store'
import type { Runtime } from './runtime'

/** Yakini operators only (spec 5.10, 18). Everyone else gets "not found". */
export async function operatorOf(rt: Runtime): Promise<{ user: SessionUser; op: OperatorRow } | null> {
  const user = await currentUser()
  if (!user) return null
  const op = await rt.store.operator(user.id)
  return op ? { user, op } : null
}

/** Fixed result codes for the operator desk (no free text in URLs). */
export const OPS_RESULTS = {
  dismissed: 'Report dismissed.',
  actioned: 'Report marked actioned.',
  taken_down: 'Site taken down. Every address now shows the neutral page.',
  restored: 'Site restored. The same published version is live again.',
  approved: 'Approved. A publish review goes live now; a preview-link review lets the owner share previews.',
  rejected: 'Rejected. The site stays on its preview. Write to the owner by hand if needed.',
  no_change: 'Nothing changed (it was already handled).',
  not_allowed: 'Your operator account can’t do that.',
  bad_input: 'Please fill in the required fields.',
  failed: 'That didn’t work. Please try again.',
  checked: 'Check stored sites finished.',
} as const
export type OpsResult = keyof typeof OPS_RESULTS

export const opsRedirect = (path: string, result: OpsResult, extra = '') =>
  new Response(null, { status: 303, headers: { location: `${path}${path.includes('?') ? '&' : '?'}result=${result}${extra}`, 'cache-control': 'no-store' } })
