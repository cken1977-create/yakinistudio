import { describe, expect, it } from 'vitest'
import { BLOCKED_MESSAGE, blockedCategoryFor, blockedFromEnv, riskCheck, slugProblem } from './index'

describe('blocked categories (Q7: adult, weapons, gambling)', () => {
  it('refuses the three confirmed categories', () => {
    expect(blockedCategoryFor('Downtown adult store and toys')).toBe('adult')
    expect(blockedCategoryFor('Family gun shop and firearms dealer')).toBe('weapons')
    expect(blockedCategoryFor('Riverside casino and sportsbook')).toBe('gambling')
  })
  it('allows normal food businesses', () => {
    expect(blockedCategoryFor('Mesa Street Tacos, a food truck in Albuquerque')).toBeNull()
    expect(blockedCategoryFor("Mama Sally's BBQ catering")).toBeNull()
  })
  it('env can add but never remove the confirmed defaults', () => {
    expect(blockedFromEnv('gambling')).toEqual(['adult', 'weapons', 'gambling'])
    expect(blockedFromEnv('')).toEqual(['adult', 'weapons', 'gambling'])
  })
  it('refusal copy names no vendors', () => {
    expect(BLOCKED_MESSAGE).not.toMatch(/ai|vercel|supabase|grok/i)
  })
})

describe('slugs (13.3)', () => {
  it('refuses reserved and malformed addresses', () => {
    expect(slugProblem('portal')).toMatch(/reserved/)
    expect(slugProblem('studio')).toMatch(/reserved/)
    expect(slugProblem('ab')).not.toBeNull()
    expect(slugProblem('Mamas')).not.toBeNull()
    expect(slugProblem('mamas-kitchen', 'mamas-kitchen')).toMatch(/reserved/)
    expect(slugProblem('mamas-kitchen')).toBeNull()
    expect(slugProblem('draft-1a2b3c4d5e6f')).toMatch(/reserved/)
    expect(slugProblem('drafthouse-grill')).toBeNull()
  })
  it('refuses rude words in an address, without catching ordinary words that contain them', () => {
    expect(slugProblem('shit-show-tacos')).toMatch(/different address/)
    expect(slugProblem('bigfuckingdeal')).toMatch(/different address/)
    expect(slugProblem('porn')).toMatch(/different address/)
    for (const ok of ['scunthorpe-bakery', 'cocktail-lounge', 'assessment-pros', 'dickens-books', 'essex-cafe', 'shiitake-farm', 'class-act-dance']) expect(slugProblem(ok), ok).toBeNull()
  })
})

describe('risk check (14.8)', () => {
  const clean = { businessName: 'Mesa Street Tacos', slug: 'mesa-street-tacos', sourceUrl: 'https://mesastreettacos.com', text: 'Fresh tacos daily.' }
  it('passes a normal site', () => { expect(riskCheck(clean)).toEqual([]) })
  it('flags impersonation names, slugs and source domains', () => {
    expect(riskCheck({ ...clean, businessName: 'PayPal Support' }).map((f) => f.rule)).toContain('impersonation_name')
    expect(riskCheck({ ...clean, slug: 'wells-fargo-login' }).map((f) => f.rule)).toContain('impersonation_slug')
    expect(riskCheck({ ...clean, sourceUrl: 'https://www.chase.com/login' }).map((f) => f.rule)).toContain('impersonation_source')
  })
  it('flags verification phrases and open reports', () => {
    expect(riskCheck({ ...clean, text: 'Please VERIFY your account now' }).map((f) => f.rule)).toContain('verification_phrase')
    expect(riskCheck({ ...clean, hasOpenAbuseReport: true }).map((f) => f.rule)).toEqual(['open_report'])
  })
  it('does not flag a brand word inside a longer word', () => {
    expect(riskCheck({ ...clean, businessName: 'Upsilon Coffee' })).toEqual([])
  })
})
