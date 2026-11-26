import { afterEach, describe, expect, it, vi } from 'vitest'
import { serverEnv } from '@/lib/server/env'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('serverEnv trims what was pasted into a dashboard', () => {
  it('drops a trailing space or newline, and leading spaces', () => {
    vi.stubEnv('VERCEL_BUILDER_PROJECT_ID', 'prj_abc123 ')
    expect(serverEnv('VERCEL_BUILDER_PROJECT_ID')).toBe('prj_abc123')
    vi.stubEnv('VERCEL_BUILDER_PROJECT_ID', 'prj_abc123\n')
    expect(serverEnv('VERCEL_BUILDER_PROJECT_ID')).toBe('prj_abc123')
    vi.stubEnv('VERCEL_TEAM_ID', '  team_xyz\r\n')
    expect(serverEnv('VERCEL_TEAM_ID')).toBe('team_xyz')
  })
  it('a value that is empty or only whitespace counts as unset', () => {
    vi.stubEnv('VERCEL_TEAM_ID', '')
    expect(serverEnv('VERCEL_TEAM_ID')).toBeUndefined()
    vi.stubEnv('VERCEL_TEAM_ID', ' \n\t ')
    expect(serverEnv('VERCEL_TEAM_ID')).toBeUndefined()
  })
})

describe('adding a subdomain on Vercel', () => {
  it('sends trimmed ids, and on failure logs status, code and message but never the token or team', async () => {
    vi.stubEnv('VERCEL_API_TOKEN', 'secret-token-value\n')
    vi.stubEnv('VERCEL_BUILDER_PROJECT_ID', 'prj_abc123 ')
    vi.stubEnv('VERCEL_TEAM_ID', 'team_xyz\n')
    const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
      calls.push(`${String(url)} ${JSON.stringify(init?.headers ?? {})}`)
      return new Response(JSON.stringify({ error: { code: 'not_found', message: `Project not found. ${'x'.repeat(300)}` } }), { status: 404 })
    }))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { addProjectDomain } = await import('@/lib/server/vercel')
    expect(await addProjectDomain('mesa.yakini.digital')).toBe('error')
    expect(calls[0]).toContain('/v10/projects/prj_abc123/domains?teamId=team_xyz ')
    expect(calls[0]).toContain('Bearer secret-token-value"')
    const line = log.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(line).toContain('[vercel] add subdomain -> 404 not_found: Project not found.')
    expect(line).not.toContain('secret-token-value')
    expect(line).not.toContain('team_xyz')
    const message = line.split('not_found: ')[1]
    expect(message.length).toBe(200)
  })
})
