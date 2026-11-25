import { describe, expect, it } from 'vitest'
import {
  CATALOG,
  HEADLINE,
  KITS,
  PACKAGE_EXAMPLE,
  PACKAGE_EXAMPLE_MONTHLY,
  PACKAGE_EXAMPLE_SETUP,
  RECEPTIONIST_EXTRA_MINUTE,
  RECEPTIONIST_MINUTES,
  STAY_WITH_YOU_NOTE,
  complianceIncluded,
  estimateBuild,
  itemPriceLabel,
  type KitId,
} from './index'

const monthly = (id: KitId) => {
  const kit = KITS.find((k) => k.id === id)!
  return [kit.monthly.small.amount, kit.monthly.growing.amount, kit.monthly.larger.amount]
}
const item = (id: string) => CATALOG.find((c) => c.id === id)!

describe('November 25, 2026 price revision', () => {
  it('keeps the public headline unchanged', () => {
    expect(HEADLINE).toBe('Setup from $299. Monthly plans from $149.')
  })

  it('prices landlord and the trucking group at the revised amounts', () => {
    expect(monthly('landlord')).toEqual([149, 279, 499])
    for (const id of ['trucking', 'oilfield', 'specialized'] as const) expect(monthly(id)).toEqual([199, 449, 1199])
  })

  it('leaves every other kit where it was', () => {
    expect(monthly('food-truck')).toEqual([149, 299, 549])
    expect(monthly('real-estate')).toEqual([149, 299, 549])
    for (const id of ['restaurant', 'tree-lawn', 'nonprofit', 'training-school'] as const) expect(monthly(id)).toEqual([199, 399, 799])
  })

  it('keeps the headline true: no fixed-price kit starts below $149 a month', () => {
    const lowest = Math.min(...KITS.filter((k) => k.monthly.small.kind === 'fixed').map((k) => k.monthly.small.amount))
    expect(lowest).toBe(149)
  })

  it('prices online ordering and the receptionist at the revised amounts', () => {
    expect([item('ordering').once?.amount, item('ordering').monthly?.amount]).toEqual([149, 29])
    expect([item('receptionist').once?.amount, item('receptionist').monthly?.amount]).toEqual([199, 99])
    expect(item('receptionist').summary).toContain(`${RECEPTIONIST_MINUTES} voice minutes`)
    expect(item('receptionist').summary).toContain(`$${RECEPTIONIST_EXTRA_MINUTE.toFixed(2)} each`)
  })

  it('keeps Business Setup at $495 (held for a margin decision)', () => {
    expect(item('business-setup').once?.amount).toBe(495)
  })

  it('keeps the food truck example in step with the estimator', () => {
    const est = estimateBuild({ kitId: 'food-truck', sizeId: 'small', setupId: 'quick', items: ['website-simple', 'ordering'] })
    expect(est.setup).toBe(PACKAGE_EXAMPLE_SETUP)
    expect(est.monthly).toBe(PACKAGE_EXAMPLE_MONTHLY)
    expect(PACKAGE_EXAMPLE).toContain(`$${PACKAGE_EXAMPLE_SETUP}`)
    expect(PACKAGE_EXAMPLE).toContain(`$${PACKAGE_EXAMPLE_MONTHLY}`)
  })

  it('includes compliance tracking free in trucking, oilfield, specialized and training school kits only', () => {
    for (const id of ['trucking', 'oilfield', 'specialized', 'training-school'] as const) {
      expect(complianceIncluded(id)).toBe(true)
      const est = estimateBuild({ kitId: id, sizeId: 'small', setupId: 'quick', items: ['compliance'] })
      const line = est.lines.find((l) => l.label.startsWith('Compliance'))!
      expect(line).toMatchObject({ setup: 0, monthly: 0, kind: 'included' })
      expect(itemPriceLabel(item('compliance'), id)).toBe('Included in your kit')
    }
    expect(complianceIncluded(undefined)).toBe(false)
    const est = estimateBuild({ kitId: 'landlord', sizeId: 'small', setupId: 'quick', items: ['compliance'] })
    expect(est.setup).toBe(299 + 399)
    expect(est.monthly).toBe(149 + 49)
    expect(itemPriceLabel(item('compliance'), 'landlord')).toBe('$399 setup + $49/mo')
  })

  it('formats other add-on prices the same way the pickers always did', () => {
    expect(itemPriceLabel(item('website-simple'))).toBe('$99 setup + $79/mo')
    expect(itemPriceLabel(item('domain-email'))).toBe('$99 setup + Billed by the provider')
    expect(itemPriceLabel(item('website-custom'))).toBe('From $4,000 setup + From $149/mo')
  })

  it('says plainly that a real person stays, without naming any company', () => {
    expect(STAY_WITH_YOU_NOTE).toMatch(/real person/)
    expect(STAY_WITH_YOU_NOTE).toMatch(/stays with you/)
    expect(STAY_WITH_YOU_NOTE).not.toMatch(/square|jobber|buildium|toast|highlevel/i)
  })
})
