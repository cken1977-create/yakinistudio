import 'server-only'
import { serverEnv } from './env'

/**
 * Phase 5a: a client's own domain on the Builder project, through the Vercel Domains API.
 * The token is read only here and never logged or returned. Every value shown to an owner
 * (IP addresses, CNAME target, TXT proof) comes from Vercel's answer, never from a guess.
 */
export type VerificationRecord = { type: string; domain: string; value: string }
export type DomainInfo = {
  /** Vercel accepts that this project may use the name (else a TXT proof is needed). */
  verified: boolean
  verification: VerificationRecord[]
  /** DNS doesn't point at Vercel yet. */
  misconfigured: boolean
  ips: string[]
  cname: string | null
}
export type AddResult = 'ok' | 'taken' | 'error'

export interface DomainApi {
  project: string | null
  add(name: string): Promise<AddResult>
  /** null when Vercel couldn't be reached or the name isn't on the project. */
  inspect(name: string): Promise<DomainInfo | null>
  remove(name: string): Promise<boolean>
}

type Json = Record<string, unknown>

/** Operator diagnostics: Vercel's status and error code/message only; never the token or team. */
const redact = (path: string) => path.replace(/\/projects\/[^/]+/, '/projects/:project')
function logFailure(method: string, path: string, status: number, json: Json) {
  const err = (json.error ?? {}) as { code?: unknown; message?: unknown }
  const code = typeof err.code === 'string' ? err.code.slice(0, 80) : '-'
  const message = typeof err.message === 'string' ? err.message.slice(0, 200) : '-'
  console.error(`[vercel-domains] ${method} ${redact(path)} -> ${status} ${code}: ${message}`)
}

export function realDomainApi(): DomainApi {
  const token = serverEnv('VERCEL_API_TOKEN')
  const project = serverEnv('VERCEL_BUILDER_PROJECT_ID') ?? null
  const team = serverEnv('VERCEL_TEAM_ID')
  const call = async (method: string, path: string, body?: Json): Promise<{ status: number; json: Json }> => {
    if (!token || !project) return { status: 0, json: {} }
    const url = new URL(`https://api.vercel.com${path}`)
    if (team) url.searchParams.set('teamId', team)
    try {
      const res = await fetch(url, {
        method, signal: AbortSignal.timeout(8000),
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      let json: Json = {}
      try { json = (await res.json()) as Json } catch { /* empty body */ }
      if (res.status >= 400 && res.status !== 404) logFailure(method, path, res.status, json)
      return { status: res.status, json }
    } catch (e) {
      console.error(`[vercel-domains] ${method} ${redact(path)} failed: ${e instanceof Error ? e.name : 'error'}`)
      return { status: 0, json: {} }
    }
  }
  const p = encodeURIComponent(project ?? '')
  const onProject = (name: string) => call('GET', `/v9/projects/${p}/domains/${encodeURIComponent(name)}`)
  return {
    project,
    async add(name) {
      const r = await call('POST', `/v10/projects/${p}/domains`, { name })
      if (r.status >= 200 && r.status < 300) return 'ok'
      if (r.status === 409 || r.status === 400) {
        // Already on this project is fine; anywhere else means another Vercel project holds it.
        const got = await onProject(name)
        return got.status === 200 ? 'ok' : 'taken'
      }
      return 'error'
    },
    async inspect(name) {
      const d = await onProject(name)
      if (d.status !== 200) return null
      // Ask Vercel to re-check the TXT proof when it isn't verified yet.
      let verified = d.json.verified !== false
      let verification = (d.json.verification as VerificationRecord[] | undefined) ?? []
      if (!verified) {
        const v = await call('POST', `/v9/projects/${p}/domains/${encodeURIComponent(name)}/verify`)
        if (v.status === 200 && v.json.verified === true) { verified = true; verification = [] }
      }
      const c = await call('GET', `/v6/domains/${encodeURIComponent(name)}/config?projectIdOrName=${p}`)
      if (c.status !== 200) return null
      type Rec = { rank?: number; value?: unknown }
      const best = (list: unknown): Rec | undefined => ((list as Rec[] | undefined) ?? []).slice().sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))[0]
      const ipv4 = best(c.json.recommendedIPv4)?.value
      const cname = best(c.json.recommendedCNAME)?.value
      return {
        verified, verification: verified ? [] : verification.filter((r) => r && typeof r.value === 'string'),
        misconfigured: c.json.misconfigured !== false,
        ips: Array.isArray(ipv4) ? ipv4.filter((x): x is string => typeof x === 'string') : [],
        cname: typeof cname === 'string' ? cname.replace(/\.$/, '') : null,
      }
    },
    async remove(name) {
      const r = await call('DELETE', `/v9/projects/${p}/domains/${encodeURIComponent(name)}`)
      return (r.status >= 200 && r.status < 300) || r.status === 404
    },
  }
}

// --------------------------------------------------------------------------------- test stand-in

/** Test mode: Vercel is never contacted. A name waits for DNS until a test says it's pointed. */
export type FakeDomain = { verified: boolean; pointed: boolean }
const fake = globalThis as typeof globalThis & { __yakiniFakeDomains?: Map<string, FakeDomain> }
export const fakeDomains = () => (fake.__yakiniFakeDomains ??= new Map())

export const TEST_IPS = ['216.150.1.1']
export const TEST_CNAME = 'test-target.vercel-dns-017.com'

export function testDomainApi(): DomainApi {
  const all = fakeDomains()
  return {
    project: 'test-project',
    async add(name) {
      if (name.startsWith('taken.') || name.includes('.taken.')) return 'taken'
      if (!all.has(name)) all.set(name, { verified: !name.includes('needs-txt'), pointed: false })
      return 'ok'
    },
    async inspect(name) {
      const d = all.get(name)
      if (!d) return null
      return {
        verified: d.verified,
        verification: d.verified ? [] : [{ type: 'TXT', domain: `_vercel.${name.split('.').slice(-2).join('.')}`, value: `vc-domain-verify=${name},test123` }],
        misconfigured: !d.pointed, ips: TEST_IPS, cname: TEST_CNAME,
      }
    },
    async remove(name) { all.delete(name); return true },
  }
}
