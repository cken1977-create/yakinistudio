import { describe, expect, it } from 'vitest'
import { lintCopy, strayPrices } from '@yakini/ai'
import { decideHost, normalizeHost } from '@/lib/hosts'
import { PUBLISH_CHECKLIST, canPublish } from '@/lib/checklist'
import { domainCapacity, domainLimitFromEnv } from '@/lib/domain-limit'
import { buildStudioCsp } from '@/lib/csp'
import { scrubEvent, maskText } from '@/lib/observability/scrub'
import { EXPORT_URL_TTL_SECONDS, canDownloadHtml, exportObjectPath, exportableAssets } from '@/lib/exports'
import { LANDING } from '@/lib/copy'

describe('host routing (13.5)', () => {
  it('routes the studio host and previews to the studio', () => {
    expect(decideHost('studio.yakini.digital', '/')).toEqual({ kind: 'studio', noindex: false })
    expect(decideHost('STUDIO.yakini.digital:443', '/')).toEqual({ kind: 'studio', noindex: false })
    expect(decideHost('builder-git-x-brsa-registry.vercel.app', '/')).toEqual({ kind: 'studio', noindex: true })
    expect(decideHost('localhost:3100', '/')).toEqual({ kind: 'studio', noindex: true })
  })
  it('rewrites every other host to the renderer', () => {
    expect(decideHost('mamas-kitchen.yakini.digital', '/menu')).toEqual({ kind: 'site', host: 'mamas-kitchen.yakini.digital', rewriteTo: '/_site/mamas-kitchen.yakini.digital/menu' })
    expect(decideHost('mamaskitchen.com', '/')).toMatchObject({ kind: 'site', rewriteTo: '/_site/mamaskitchen.com' })
    expect(decideHost('mamaskitchen.com', '/api/f/x/contact')).toEqual({ kind: 'form' })
  })
  it('never exposes the internal renderer path directly', () => {
    expect(decideHost('studio.yakini.digital', '/_site/evil.com')).toEqual({ kind: 'block' })
    expect(decideHost('x.com', '/%5Fsite/evil.com')).toEqual({ kind: 'block' })
  })
  it('normalizes hosts', () => {
    expect(normalizeHost('Example.COM.:8080')).toBe('example.com')
    expect(normalizeHost('[::1]:3000')).toBe('[::1]')
  })
})

describe('publish checklist: plan gate is blocking (v1.1)', () => {
  const allOk = PUBLISH_CHECKLIST.map((i) => ({ id: i.id, ok: true }))
  it('passes when every blocking item passes', () => {
    expect(canPublish(allOk, { customDomain: true, export: true })).toEqual({ ok: true, blockedBy: [] })
  })
  it('blocks without an active plan', () => {
    const r = canPublish(allOk.map((x) => (x.id === 'plan_active' ? { ...x, ok: false } : x)), { customDomain: false })
    expect(r).toEqual({ ok: false, blockedBy: ['plan_active'] })
  })
  it('fails closed when a check result is missing', () => {
    expect(canPublish([], { customDomain: false }).blockedBy).toContain('plan_active')
  })
  it('only requires agreement + domain capacity for custom domains (R12)', () => {
    const r = canPublish(allOk.filter((x) => x.id !== 'agreement_signed' && x.id !== 'domain_capacity'), { customDomain: false })
    expect(r.ok).toBe(true)
    expect(canPublish(allOk.filter((x) => x.id !== 'agreement_signed'), { customDomain: true }).blockedBy).toEqual(['agreement_signed'])
  })
  it('non-blocking items never stop a publish', () => {
    const r = canPublish(allOk.map((x) => (x.id === 'contrast' ? { ...x, ok: false } : x)), { customDomain: false })
    expect(r.ok).toBe(true)
  })
})

describe('Vercel domain-limit check (v1.1)', () => {
  it('refuses when the project is full and warns near the cap', () => {
    expect(domainCapacity(10, 50)).toEqual({ ok: true, remaining: 40, warn: false })
    expect(domainCapacity(47, 50)).toEqual({ ok: true, remaining: 3, warn: true })
    expect(domainCapacity(50, 50).ok).toBe(false)
    expect(domainCapacity(49, 50, 2).ok).toBe(false)
    expect(domainCapacity(NaN, 50).ok).toBe(false)
    expect(domainLimitFromEnv('abc')).toBe(100_000)
    expect(domainLimitFromEnv(undefined)).toBe(100_000)
    expect(domainLimitFromEnv('100')).toBe(100)
    expect(domainCapacity(10)).toEqual({ ok: true, remaining: 99_990, warn: false })
    expect(domainCapacity(99_996)).toEqual({ ok: true, remaining: 4, warn: true })
  })
})

describe('studio CSP (nonce-based)', () => {
  it('drops script unsafe-inline in production and includes the nonce', () => {
    const csp = buildStudioCsp('abc123+/OK=', { isDev: false })
    expect(csp).toContain("script-src 'self' 'nonce-abc123+/OK=' 'strict-dynamic'")
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)
    expect(csp).not.toContain("'unsafe-eval'")
    expect(csp).toContain("style-src 'self' 'nonce-abc123+/OK='")
    expect(csp).toContain("style-src-attr 'unsafe-inline'")
    expect(csp).toContain('https://*.ingest.sentry.io')
  })
  it('allows unsafe-eval only in development', () => {
    expect(buildStudioCsp('n0', { isDev: true })).toContain("'unsafe-eval'")
  })
  it('adds a PostHog host to connect-src when set', () => {
    const csp = buildStudioCsp('n0', { posthogHost: 'https://us.i.posthog.com' })
    expect(csp).toContain('https://us.i.posthog.com')
  })
  it('rejects a nonce that could break out of the header value', () => {
    expect(() => buildStudioCsp("x; script-src 'unsafe-inline'")).toThrow(/invalid csp nonce/)
  })
})

describe('Sentry scrubbing (14.2)', () => {
  it('drops headers, cookies, bodies, users and masks contact info + tokens', () => {
    const e = scrubEvent({
      request: { headers: { authorization: 'x' }, cookies: { a: 'b' }, data: '{"email":"a@b.co"}', url: 'https://studio.yakini.digital/x?token=abc' },
      user: { email: 'a@b.co' },
      // Built at runtime so the repo never contains a key-shaped literal.
      message: 'failed for jane@example.com at +1 505 555 0142 with ' + ['sk', 'live', 'abcdefgh12345678'].join('_'),
    })
    expect(e.request).toEqual({ url: 'https://studio.yakini.digital/x' })
    expect(e.user).toBeUndefined()
    expect(e.message).toBe('failed for [email] at [phone] with [secret]')
    expect(maskText('call 303-555-0123')).toBe('call [phone]')
  })
})

describe('exports (Phase 4 rules fixed now)', () => {
  it('uses 24-hour signed URLs and tenant-scoped paths', () => {
    expect(EXPORT_URL_TTL_SECONDS).toBe(86400)
    expect(exportObjectPath('t1', 'e1')).toBe('t1/e1.zip')
  })
  it('only zips this tenant’s redistributable, non-deleted images', () => {
    const a = [
      { id: 1, tenant_id: 't1', redistributable: true, deleted_at: null },
      { id: 2, tenant_id: 't1', redistributable: false, deleted_at: null },
      { id: 3, tenant_id: 't2', redistributable: true, deleted_at: null },
      { id: 4, tenant_id: 't1', redistributable: true, deleted_at: '2026-11-01' },
    ]
    expect(exportableAssets(a, 't1').map((x) => x.id)).toEqual([1])
  })
  it('applies the Q13 ready-to-host policy', () => {
    const now = new Date('2026-11-23T12:00:00Z')
    expect(canDownloadHtml('paid_or_recently_canceled', 'active', null, now)).toBe(true)
    expect(canDownloadHtml('paid_or_recently_canceled', 'trial', null, now)).toBe(false)
    expect(canDownloadHtml('paid_or_recently_canceled', 'canceled', new Date('2026-10-01T00:00:00Z'), now)).toBe(true)
    expect(canDownloadHtml('paid_or_recently_canceled', 'canceled', new Date('2026-07-01T00:00:00Z'), now)).toBe(false)
    expect(canDownloadHtml('any_owner', 'trial', null, now)).toBe(true)
  })
})

describe('landing copy rules (R7, R8, R9)', () => {
  const all = JSON.stringify(LANDING)
  it('names no vendors and never says AI-built', () => { expect(lintCopy(all)).toEqual([]) })
  it('shows only the one public price line', () => {
    expect(LANDING.price).toBe('Setup from $299. Monthly plans from $149.')
    expect(strayPrices(all)).toEqual([])
  })
})
