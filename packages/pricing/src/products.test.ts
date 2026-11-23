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
    expect(kitProduct('food-truck', 'small')?.monthlyPriceEnv).toBe('STRIPE_PRICE_KIT_FOOD_TRUCK_SMALL_MONTHLY')
    expect(kitProduct('cannabis', 'small')).toBeUndefined()
    expect(kitProduct('reentry', 'small')).toBeUndefined()
    expect(builderProducts('restaurant').map((p) => p.key)).toEqual([
      'website-simple', 'kit:restaurant:small', 'kit:restaurant:growing', 'kit:restaurant:larger',
    ])
  })
  it('never holds a Stripe price id value, only env names', () => {
    for (const p of builderProducts('food-truck')) {
      expect(p.setupPriceEnv ?? '').toMatch(/^[A-Z0-9_]*$/)
      expect(p.monthlyPriceEnv ?? '').toMatch(/^[A-Z0-9_]*$/)
    }
  })
})
