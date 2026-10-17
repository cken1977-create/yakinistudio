// VIZIONZ SANKOFA · admin navigation registry
// One place that names every /admin screen. Used by the section nav, the
// breadcrumbs and the back control ("← Back to Participants").

import type { VsAccessRole } from '@/lib/supabase/auth'

export type AdminSection = {
  href: string
  label: string
  // Roles that see this item in the section nav. Pages still enforce their
  // own access (and RLS scopes the data); this only keeps the nav tidy.
  roles: VsAccessRole[] | 'all'
}

const EXEC_OP: VsAccessRole[] = ['executive', 'operator']
const EXEC_OP_LEAD: VsAccessRole[] = ['executive', 'operator', 'leadership_readonly']

export const ADMIN_SECTIONS: AdminSection[] = [
  { href: '/admin', label: 'Home', roles: 'all' },
  { href: '/admin/participants', label: 'Participants', roles: 'all' },
  { href: '/admin/intakes', label: 'Get Help Requests', roles: [...EXEC_OP, 'case_manager', 'leadership_readonly'] },
  { href: '/admin/cohorts', label: 'Cohorts', roles: 'all' },
  { href: '/admin/programs', label: 'Programs', roles: 'all' },
  { href: '/admin/organizations', label: 'Funders & Partners', roles: EXEC_OP_LEAD },
  { href: '/admin/coalition', label: 'Coalition Partners', roles: 'all' },
  // OBR = Organizational Behavioral Readiness (VS's own intake). Not for case managers.
  { href: '/admin/obr', label: 'OBR', roles: EXEC_OP_LEAD },
  { href: '/admin/grants', label: 'Grants', roles: EXEC_OP_LEAD },
  { href: '/admin/donors', label: 'Donors', roles: EXEC_OP_LEAD },
  { href: '/admin/documents', label: 'Documents', roles: EXEC_OP },
  { href: '/admin/media', label: 'Photos & Videos', roles: EXEC_OP },
  { href: '/admin/intelligence', label: 'Intelligence', roles: 'all' },
]

// Labels for screens that are not in the main nav.
const EXTRA_LABELS: Array<[RegExp, string]> = [
  [/^\/admin\/participants\/[^/]+$/, 'participant'],
  [/^\/admin\/cohorts\/[^/]+$/, 'cohort'],
  [/^\/admin\/coalition\/[^/]+$/, 'partner'],
  [/^\/admin\/obr\/[^/]+$/, 'OBR intake'],
  [/^\/admin\/integrations\/google\/[^/]+\/sheets$/, 'Google Sheets'],
  [/^\/admin\/integrations\/google$/, 'Google Integration'],
  [/^\/admin\/desk$/, 'Operator Desk'],
]

export function sectionsForRole(role: VsAccessRole | null): AdminSection[] {
  return ADMIN_SECTIONS.filter(
    (s) => s.roles === 'all' || (role !== null && s.roles.includes(role)),
  )
}

/** Human label for an /admin path (query string ignored). */
export function labelForAdminPath(pathOrUrl: string): string {
  const path = pathOrUrl.split('?')[0].split('#')[0].replace(/\/$/, '') || '/admin'
  for (const [re, label] of EXTRA_LABELS) if (re.test(path)) return label
  const exact = ADMIN_SECTIONS.find((s) => s.href === path)
  if (exact) return exact.href === '/admin' ? 'Operations' : exact.label
  // Fall back to the closest parent section.
  const parent = [...ADMIN_SECTIONS]
    .filter((s) => s.href !== '/admin' && path.startsWith(s.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return parent ? parent.label : 'Operations'
}

/** Is this nav item the active one for the current path? */
export function isActiveSection(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}
