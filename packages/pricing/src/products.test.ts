import { describe, expect, it } from 'vitest'
import { CATALOG, HEADLINE } from './index'
import { PUBLIC_PRICE_LINE, builderProducts, kitProduct, websiteSimpleProduct } from './products'

describe('builder products', () => {
  it('keeps the one public pricing line exactly', () => {
    expect(PUBLIC_PRICE_LINE).toBe('Setup from $299. Monthly plans from $149.')
    expect(HEADLINE).toBe(PUBLIC_PRICE_LINE)
  })
  it('reads template website amounts from the catalog, not copies', () => {
    const item = CATALOG.find((c) => c.id === 'website-simple')!
    expect(websiteSimpleProduct().setup).toBe(item.once)
    expect(websiteSimpleProduct().monthly).toBe(item.monthly)
  })
  it('offers kit setup for ready fixed-price kits and refuses quoted kits', () => {
    expect(kitProduct('cannabis', 'small')).toBeUndefined()
    expect(kitProduct('reentry', 'small')).toBeUndefined()
    expect(builderProducts('restaurant').map((p) => p.key)).toEqual([
      'website-simple', 'kit:restaurant:small', 'kit:restaurant:growing', 'kit:restaurant:larger',
    ])
  })
  it('holds no payment provider ids (plans live in the database)', () => {
    for (const p of builderProducts('food-truck')) expect(Object.keys(p).sort()).toEqual(['key', 'monthly', 'name', 'setup'])
  })
})

describe('defaultProduct (Q: which plan a general-kit site buys)', () => {
  it('a Business and services site buys the Template website; sold kits buy their own plan', async () => {
    const { defaultProduct } = await import('./products')
    expect(defaultProduct('service').key).toBe('website-simple')
    expect(defaultProduct('landlord', 'growing').key).toBe('kit:landlord:growing')
    expect(defaultProduct('cannabis').key).toBe('website-simple') // quoted kits are not sold in-app
  })
})

describe('PayPal plan amounts come only from the pricing config (R9)', () => {
  it('every sold product has a setup fee and a monthly amount', async () => {
    const { allBuilderProducts, planAmounts, productByKey } = await import('./products')
    const { KITS, SETUPS, CATALOG } = await import('./index')
    const all = allBuilderProducts()
    expect(all.length).toBeGreaterThan(20)
    for (const p of all) expect(planAmounts(p), p.key).not.toBeNull()
    const web = CATALOG.find((c) => c.id === 'website-simple')!
    expect(planAmounts(productByKey('website-simple')!)).toEqual({ setup: web.once!.amount, monthly: web.monthly!.amount })
    const ft = KITS.find((k) => k.id === 'food-truck')!
    expect(planAmounts(productByKey('kit:food-truck:growing')!)).toEqual({ setup: SETUPS.find((s) => s.id === 'quick')!.price.amount, monthly: ft.monthly.growing.amount })
    expect(productByKey('kit:cannabis:small')).toBeUndefined()
  })
})
