/**
 * Builder checkout products (Q5 default: template website + kit setup).
 * Amounts are never copied here: they are read from CATALOG / SETUPS / KITS so
 * the pricing config stays the single source of truth (R9). Each product becomes one PayPal plan
 * (setup fee + monthly), created from the operator desk and stored in the database (Phase 4).
 */
import { CATALOG, KITS, SETUPS, SITE_ONLY_KIT_IDS, type KitId, type Money, type SiteKitId, type SizeId } from './index'

export const PUBLIC_PRICE_LINE = 'Setup from $299. Monthly plans from $149.' as const

export type BuilderProductKey = 'website-simple' | `kit:${KitId}:${SizeId}`

export type BuilderProduct = {
  key: BuilderProductKey
  name: string
  setup?: Money
  monthly?: Money
}

export function websiteSimpleProduct(): BuilderProduct {
  const item = CATALOG.find((c) => c.id === 'website-simple')
  if (!item) throw new Error('website-simple missing from pricing CATALOG')
  return {
    key: 'website-simple',
    name: item.name,
    setup: item.once,
    monthly: item.monthly,
  }
}

export function kitProduct(kitId: KitId, size: SizeId): BuilderProduct | undefined {
  const kit = KITS.find((k) => k.id === kitId)
  const quick = SETUPS.find((s) => s.id === 'quick')
  if (!kit || !kit.ready) return undefined
  const monthly = kit.monthly[size]
  if (monthly.kind !== 'fixed') return undefined // quoted kits are not sold in-app
  return {
    key: `kit:${kitId}:${size}`,
    name: `${kit.name} kit (${size})`,
    setup: quick?.price,
    monthly,
  }
}

/** Products a Builder tenant can buy in-app (Phase 4). */
export function builderProducts(kitId?: KitId): BuilderProduct[] {
  const out: BuilderProduct[] = [websiteSimpleProduct()]
  if (kitId) for (const size of ['small', 'growing', 'larger'] as const) {
    const p = kitProduct(kitId, size)
    if (p) out.push(p)
  }
  return out
}

/**
 * The plan a site buys by default: its kit's plan at the chosen size, or the Template website for
 * a site-only layout (`service`) or a kit that isn't sold in-app. Decided by Clarence 2026-11-25.
 */
export function defaultProduct(kitId: SiteKitId, size: SizeId = 'small'): BuilderProduct {
  if ((SITE_ONLY_KIT_IDS as readonly string[]).includes(kitId)) return websiteSimpleProduct()
  return kitProduct(kitId as KitId, size) ?? websiteSimpleProduct()
}

/** Every product sold in-app: the Template website and each fixed-price kit at each size. */
export function allBuilderProducts(): BuilderProduct[] {
  const out: BuilderProduct[] = [websiteSimpleProduct()]
  for (const k of KITS) for (const size of ['small', 'growing', 'larger'] as const) {
    const p = kitProduct(k.id, size)
    if (p) out.push(p)
  }
  return out
}

export function productByKey(key: string): BuilderProduct | undefined {
  return allBuilderProducts().find((p) => p.key === key)
}

/** The two amounts a PayPal plan charges: the setup fee once, then the monthly amount. */
export function planAmounts(p: BuilderProduct): { setup: number; monthly: number } | null {
  const setup = p.setup?.kind === 'fixed' ? p.setup.amount : 0
  const monthly = p.monthly?.kind === 'fixed' ? p.monthly.amount : null
  return monthly && monthly > 0 ? { setup, monthly } : null
}
