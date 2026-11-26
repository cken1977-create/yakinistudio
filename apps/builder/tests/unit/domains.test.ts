import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { apexOf, hostLabel, parseDomainInput } from '@/lib/domain/parse'
import { api, form, jar, readySite, signIn, signInOperator, where } from './browser'

vi.mock('next/headers', async () => (await import('./browser')).headersMock)
vi.mock('next/cache', () => ({ revalidateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }))

beforeAll(() => { vi.stubEnv('OPERATOR_EMAIL', 'ops@yakini.example'); vi.stubEnv('BUILDER_TEST_MODE', '1'); vi.stubEnv('VERCEL', ''); vi.stubEnv('VERCEL_ENV', '') })
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => jar.clear())

const ctx = (siteId: string) => ({ params: Promise.resolve({ siteId }) })
const rt = async () => (await import('@/lib/server/runtime')).getRuntime()
const fake = async () => (await import('@/lib/server/vercel-domains')).fakeDomains()
let n = 0
const uniq = () => `${++n}${Math.random().toString(36).slice(2, 7)}`

async function domainPost(siteId: string, fields: Record<string, string>) {
  const { POST } = await import('@/app/api/sites/[siteId]/domain/route')
  return POST(form(`/api/sites/${siteId}/domain`, fields), ctx(siteId))
}
async function publish(siteId: string, slug: string) {
  const { POST } = await import('@/app/api/sites/[siteId]/publish/route')
  const res = await POST(api('POST', `/api/sites/${siteId}/publish`, { slug }), ctx(siteId))
  expect(res.status).toBe(200)
}
async function point(name: string) { (await fake()).get(name)!.pointed = true }

describe('what an owner types (parse)', () => {
  const root = 'yakini.digital'
  it('a whole domain adds www too; www. means the whole domain; a subdomain is connected alone', () => {
    expect(parseDomainInput('  HTTPS://MesaTacos.com/menu?x=1 ', root)).toEqual({ main: 'mesatacos.com', names: ['mesatacos.com', 'www.mesatacos.com'], apex: 'mesatacos.com', whole: true })
    expect(parseDomainInput('www.mesatacos.com.', root)).toMatchObject({ main: 'mesatacos.com', whole: true })
    expect(parseDomainInput('test.brsaregistry.com', root)).toEqual({ main: 'test.brsaregistry.com', names: ['test.brsaregistry.com'], apex: 'brsaregistry.com', whole: false })
    expect(parseDomainInput('mesatacos.co.uk', root)).toMatchObject({ names: ['mesatacos.co.uk', 'www.mesatacos.co.uk'] })
    expect(parseDomainInput('shop.mesatacos.co.uk', root)).toMatchObject({ names: ['shop.mesatacos.co.uk'], apex: 'mesatacos.co.uk' })
  })
  it('forgives what pasting brings along: quotes, backticks, invisible characters, spaces, end punctuation', () => {
    for (const s of ['`test.brsaregistry.com`', '"test.brsaregistry.com"', '“test.brsaregistry.com”', 'test.brsaregistry.com\u200b', 'test. brsaregistry.com', 'test.brsaregistry.com,', '<https://test.brsaregistry.com/>', '\u00a0test.brsaregistry.com\u00a0']) {
      expect(parseDomainInput(s, root)).toMatchObject({ main: 'test.brsaregistry.com', names: ['test.brsaregistry.com'] })
    }
  })
  it('refuses our own addresses, hosting names, IPs and things that aren’t domains', () => {
    for (const s of ['yakini.digital', 'mesa.yakini.digital']) expect(parseDomainInput(s, root)).toEqual({ error: 'ours' })
    for (const s of ['x.vercel.app', 'localhost.com.localhost']) expect(parseDomainInput(s, root)).toHaveProperty('error')
    for (const s of ['', '   ']) expect(parseDomainInput(s, root)).toEqual({ error: 'empty' })
    for (const s of ['1.2.3.4', 'mesatacos', 'mesa tacos.com', '-bad.com', 'co.uk', 'a..b.com', 'x.123', '[::1]']) expect(parseDomainInput(s, root)).toEqual({ error: 'invalid' })
  })
  it('DNS host labels are relative to the domain', () => {
    expect(apexOf('a.b.example.com')).toBe('example.com')
    expect(hostLabel('example.com')).toBe('@')
    expect(hostLabel('www.example.com')).toBe('www')
    expect(hostLabel('test.brsaregistry.com')).toBe('test')
  })
})

describe('records come from Vercel’s answer', () => {
  it('A records for a whole domain, CNAME for www and subdomains, TXT proof with a relative host', async () => {
    const { recordsFor, statusFrom } = await import('@/lib/server/domains')
    const info = { verified: false, verification: [{ type: 'TXT', domain: '_vercel.brsaregistry.com', value: 'vc-domain-verify=abc' }], misconfigured: true, ips: ['216.150.1.1', '216.150.16.1'], cname: 'ae2.vercel-dns-017.com' }
    expect(recordsFor('brsaregistry.com', info)).toEqual([
      { type: 'A', host: '@', value: '216.150.1.1' }, { type: 'A', host: '@', value: '216.150.16.1' },
      { type: 'TXT', host: '_vercel', value: 'vc-domain-verify=abc' },
    ])
    expect(recordsFor('test.brsaregistry.com', { ...info, verified: true, verification: [] })).toEqual([{ type: 'CNAME', host: 'test', value: 'ae2.vercel-dns-017.com' }])
    expect(statusFrom(info).status).toBe('verifying')
    expect(statusFrom({ ...info, verified: true }).status).toBe('misconfigured')
    expect(statusFrom({ ...info, verified: true, misconfigured: false }).status).toBe('active')
    expect(statusFrom(null).status).toBe('error')
  })
})

describe('connect → records → live → remove', () => {
  it('a paid owner connects a whole domain; once DNS points, it becomes the main address and the free address forwards', async () => {
    const s = await readySite()
    const slug = `mesa-dom-${uniq()}`
    await publish(s.siteId, slug)
    const name = `mesa${uniq()}.com`
    expect(where(await domainPost(s.siteId, { action: 'connect', domain: `https://www.${name}/` }))).toBe(`/sites/${s.siteId}/domain?result=connected`)
    const r = await rt()
    let rows = await r.store.customDomains(s.siteId)
    expect(rows.map((x) => [x.hostname, x.status, x.isPrimary])).toEqual([[name, 'misconfigured', false], [`www.${name}`, 'misconfigured', false]])
    expect(rows[0].check?.records).toEqual([{ type: 'A', host: '@', value: '216.150.1.1' }])
    expect(rows[1].check?.records).toEqual([{ type: 'CNAME', host: 'www', value: 'test-target.vercel-dns-017.com' }])
    // Not live yet: the free address is still the main one, the new names don't serve.
    expect((await r.store.siteForHost(`${slug}.yakini.digital`))?.primaryHost).toBe(`${slug}.yakini.digital`)
    expect(await r.store.siteForHost(name)).toBeNull()

    expect(where(await domainPost(s.siteId, { action: 'check' }))).toBe(`/sites/${s.siteId}/domain?result=checked`)
    await point(name); await point(`www.${name}`)
    expect(where(await domainPost(s.siteId, { action: 'check' }))).toBe(`/sites/${s.siteId}/domain?result=live`)
    rows = await r.store.customDomains(s.siteId)
    expect(rows.map((x) => [x.status, x.isPrimary])).toEqual([['active', true], ['active', false]])
    for (const h of [name, `www.${name}`, `${slug}.yakini.digital`]) expect((await r.store.siteForHost(h))?.primaryHost).toBe(name)

    // Publishing again keeps the custom domain as the main address.
    await publish(s.siteId, slug)
    expect((await r.store.siteForHost(`${slug}.yakini.digital`))?.primaryHost).toBe(name)

    // Remove needs the tick; then the free address is main again and Vercel lets go of the names.
    expect(where(await domainPost(s.siteId, { action: 'remove' }))).toBe(`/sites/${s.siteId}/domain?result=confirm_remove`)
    expect(where(await domainPost(s.siteId, { action: 'remove', confirm: 'yes' }))).toBe(`/sites/${s.siteId}/domain?result=removed`)
    expect(await r.store.customDomains(s.siteId)).toEqual([])
    expect(await r.store.siteForHost(name)).toBeNull()
    expect((await r.store.siteForHost(`${slug}.yakini.digital`))?.primaryHost).toBe(`${slug}.yakini.digital`)
    expect((await fake()).has(name)).toBe(false)
  })

  it('a subdomain needing a TXT proof shows it, and goes live once proven and pointed', async () => {
    const s = await readySite()
    const name = `needs-txt${uniq()}.example.org`
    expect(where(await domainPost(s.siteId, { action: 'connect', domain: name }))).toMatch(/result=connected/)
    const r = await rt()
    let [row] = await r.store.customDomains(s.siteId)
    expect(row.status).toBe('verifying')
    expect(row.check?.records.map((x) => x.type)).toEqual(['CNAME', 'TXT'])
    expect(row.check?.records[0].host).toBe(name.split('.')[0])
    const d = (await fake()).get(name)!
    d.verified = true; d.pointed = true
    expect(where(await domainPost(s.siteId, { action: 'check' }))).toMatch(/result=live/)
    ;[row] = await r.store.customDomains(s.siteId)
    expect([row.status, row.isPrimary]).toEqual(['active', true])
  })

  it('refuses: no plan, a second domain, a name another site has, a name held elsewhere on the host, a bad name', async () => {
    const unpaid = await readySite({ plan: false })
    expect(where(await domainPost(unpaid.siteId, { action: 'connect', domain: `x${uniq()}.com` }))).toMatch(/result=needs_plan/)

    const a = await readySite()
    const name = `shared${uniq()}.com`
    expect(where(await domainPost(a.siteId, { action: 'connect', domain: name }))).toMatch(/result=connected/)
    expect(where(await domainPost(a.siteId, { action: 'connect', domain: `other${uniq()}.com` }))).toMatch(/result=has_custom_domain/)

    const b = await readySite()
    expect(where(await domainPost(b.siteId, { action: 'connect', domain: `www.${name}` }))).toMatch(/result=address_taken/)
    expect(where(await domainPost(b.siteId, { action: 'connect', domain: `taken.example${uniq()}.com` }))).toMatch(/result=address_taken/)
    expect(where(await domainPost(b.siteId, { action: 'connect', domain: 'mesa.yakini.digital' }))).toMatch(/result=ours/)
    expect(where(await domainPost(b.siteId, { action: 'connect', domain: '10.0.0.1' }))).toMatch(/result=invalid/)
    expect(await (await rt()).store.customDomains(b.siteId)).toEqual([])
  })

  it('an operator may connect without a plan; non-members get 404', async () => {
    const s = await readySite({ plan: false })
    await signInOperator()
    expect(where(await domainPost(s.siteId, { action: 'connect', domain: `ops${uniq()}.com` }))).toMatch(/result=connected/)
    jar.clear(); await signIn()
    expect((await domainPost(s.siteId, { action: 'check' })).status).toBe(404)
  })

  it('the nightly check switches a site over by itself once DNS points', async () => {
    const s = await readySite()
    const name = `night${uniq()}.com`
    await domainPost(s.siteId, { action: 'connect', domain: name })
    await point(name)
    const { checkWaitingDomains } = await import('@/lib/server/domains')
    expect(await checkWaitingDomains(await rt(), 500)).toBeGreaterThan(0)
    const rows = await (await rt()).store.customDomains(s.siteId)
    expect(rows[0]).toMatchObject({ hostname: name, status: 'active', isPrimary: true })
    expect(rows[1].status).toBe('misconfigured') // www not pointed yet: waits, the main name already works
  })
})
