import { describe, expect, it } from 'vitest'
import { isBot, isCountableRequest, pageSlugFor, sourceFromReferrer, visitorHash } from './index'

const req = (method: string, h: Record<string, string>) => ({ method, headers: { get: (n: string) => h[n.toLowerCase()] ?? null } })
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'

describe('visits', () => {
  it('ignores bots, link previews and empty user agents', () => {
    expect(isBot('Googlebot/2.1')).toBe(true)
    expect(isBot('facebookexternalhit/1.1')).toBe(true)
    expect(isBot('')).toBe(true)
    expect(isBot(UA)).toBe(false)
  })
  it('counts only real GET document navigations', () => {
    expect(isCountableRequest(req('GET', { 'user-agent': UA, 'sec-fetch-dest': 'document' }))).toBe(true)
    expect(isCountableRequest(req('HEAD', { 'user-agent': UA }))).toBe(false)
    expect(isCountableRequest(req('GET', { 'user-agent': UA, purpose: 'prefetch' }))).toBe(false)
    expect(isCountableRequest(req('GET', { 'user-agent': UA, 'sec-purpose': 'prefetch;prerender' }))).toBe(false)
    expect(isCountableRequest(req('GET', { 'user-agent': UA, 'next-router-prefetch': '1' }))).toBe(false)
    expect(isCountableRequest(req('GET', { 'user-agent': UA, 'sec-fetch-dest': 'image' }))).toBe(false)
  })
  it('maps referrers to buckets', () => {
    expect(sourceFromReferrer(null)).toBe('direct')
    expect(sourceFromReferrer('https://www.google.com/search?q=tacos')).toBe('search')
    expect(sourceFromReferrer('https://l.facebook.com/l.php?u=x')).toBe('social')
    expect(sourceFromReferrer('https://t.co/abc')).toBe('social')
    expect(sourceFromReferrer('https://somewhere.example/')).toBe('other')
    expect(sourceFromReferrer('https://mesa.yakini.digital/menu', ['mesa.yakini.digital'])).toBe('direct')
    expect(sourceFromReferrer('not a url')).toBe('other')
  })
  it('matches page slugs and ignores unknown paths', () => {
    expect(pageSlugFor('/', ['', 'menu'])).toBe('')
    expect(pageSlugFor('/Menu/?x=1', ['', 'menu'])).toBe('menu')
    expect(pageSlugFor('/wp-admin', ['', 'menu'])).toBeNull()
  })
  it('hashes visitors so no raw IP or user agent is stored', async () => {
    const h = await visitorHash('aa'.repeat(32), 'site-1', '203.0.113.9', UA)
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(h).not.toContain('203.0.113.9')
    expect(await visitorHash('bb'.repeat(32), 'site-1', '203.0.113.9', UA)).not.toBe(h)
  })
})
