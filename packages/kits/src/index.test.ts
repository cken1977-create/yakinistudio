import { describe, expect, it } from 'vitest'
import { BUILDER_KITS, kitDefinition, unlicensedSamples, type KitDefinition } from './index'

describe('kits (Phase 0: empty)', () => {
  it('has no kits yet', () => {
    expect(Object.keys(BUILDER_KITS)).toEqual([])
    expect(kitDefinition('food-truck')).toBeUndefined()
  })
  it('flags any sample image without licence info', () => {
    const bad = { id: 'food-truck', allowedSections: [], fontPairs: [], copyTone: '', defaultPalette: { primary: '#000000', secondary: '#000000', accent: '#000000' },
      sampleImages: [{ key: 'tacos', storagePath: 'kits/food-truck/tacos.jpg', alt: 'Tacos', license: { kind: 'licensed-stock', source: '', redistributable: false } }] } as KitDefinition
    expect(unlicensedSamples({ 'food-truck': bad })).toEqual(['food-truck:tacos'])
    expect(unlicensedSamples()).toEqual([])
  })
})
