import 'server-only'
import { serverEnv } from './env'

/**
 * Subdomain registration (spec 13.2 B): add `<slug>.<root>` to the Builder project through the
 * Vercel Domains API. The token is read only here and never logged or returned.
 *
 * Returns 'active' when the host accepted the address, 'pending' when it isn't verified yet or
 * the API isn't configured (the domain row then waits; see OPEN_QUESTIONS Phase 3), and 'error'
 * when the call failed.
 */
export type DomainResult = 'active' | 'pending' | 'error'
export type AddDomain = (hostname: string) => Promise<DomainResult>

export function vercelConfigured(): boolean {
  return Boolean(serverEnv('VERCEL_API_TOKEN') && serverEnv('VERCEL_BUILDER_PROJECT_ID'))
}

export const addProjectDomain: AddDomain = async (hostname) => {
  const token = serverEnv('VERCEL_API_TOKEN')
  const project = serverEnv('VERCEL_BUILDER_PROJECT_ID')
  const team = serverEnv('VERCEL_TEAM_ID')
  if (!token || !project) return 'pending'
  const q = team ? `?teamId=${encodeURIComponent(team)}` : ''
  const base = `https://api.vercel.com/v10/projects/${encodeURIComponent(project)}/domains`
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
  try {
    const res = await fetch(`${base}${q}`, { method: 'POST', headers, body: JSON.stringify({ name: hostname }), signal: AbortSignal.timeout(8000) })
    let body: { verified?: boolean; error?: { code?: string } } = {}
    try { body = await res.json() } catch { /* empty */ }
    if (res.ok) return body.verified === false ? 'pending' : 'active'
    // Already on this project: read it back.
    if (res.status === 409 || body.error?.code === 'domain_already_in_use') {
      const got = await fetch(`${base}/${encodeURIComponent(hostname)}${q}`, { headers, signal: AbortSignal.timeout(8000) })
      if (!got.ok) return 'error'
      const d = (await got.json()) as { verified?: boolean }
      return d.verified === false ? 'pending' : 'active'
    }
    // Operator diagnostics: Vercel's status and error code only, never the token or team.
    const code = typeof body.error?.code === 'string' ? body.error.code.slice(0, 80) : '-'
    console.error(`[vercel] add subdomain -> ${res.status} ${code}`)
    return 'error'
  } catch {
    return 'error'
  }
}

/** Test mode: every address is accepted at once, except ones made to fail on purpose. */
export const testAddDomain: AddDomain = async (hostname) => (hostname.startsWith('pending-') ? 'pending' : 'active')
