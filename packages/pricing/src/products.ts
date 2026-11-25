/**
 * Builder checkout products (Q5 default: template website + kit setup).
 * Amounts are never copied here: they are read from CATALOG / SETUPS / KITS so
 * the pricing config stays the single source of truth (R9). Stripe price ids are
 * referenced by environment variable NAME only (Section 17); values live in Vercel.
 */
import { CATALOG, KITS, SETUPS, SITE_ONLY_KIT_IDS, type KitId, type Money, type SiteKitId, type SizeId } from './index'

export const PUBLIC_PRICE_LINE = 'Setup from $299. Monthly plans from $149.' as const

export type BuilderProductKey = 'website-simple' | `kit:${KitId}:${SizeId}`

export type BuilderProduct = {
  key: BuilderProductKey
  name: string
  setup?: Money
  monthly?: Money
  /** Env var names holding Stripe price ids. Never the ids themselves. */
  setupPriceEnv?: string
  monthlyPriceEnv?: string
}

export function websiteSimpleProduct(): BuilderProduct {
  const item = CATALOG.find((c) => c.id === 'website-simple')
  if (!item) throw new Error('website-simple missing from pricing CATALOG')
  return {
    key: 'website-simple',
    name: item.name,
    setup: item.once,
    monthly: item.monthly,
    setupPriceEnv: 'STRIPE_PRICE_WEBSITE_SIMPLE_SETUP',
    monthlyPriceEnv: 'STRIPE_PRICE_WEBSITE_SIMPLE_MONTHLY',
  }
}

export function kitProduct(kitId: KitId, size: SizeId): BuilderProduct | undefined {
  const kit = KITS.find((k) => k.id === kitId)
  const quick = SETUPS.find((s) => s.id === 'quick')
  if (!kit || !kit.ready) return undefined
  const monthly = kit.monthly[size]
  if (monthly.kind !== 'fixed') return undefined // quoted kits are not sold in-app
  const envKit = kitId.toUpperCase().replace(/-/g, '_')
  return {
    key: `kit:${kitId}:${size}`,
    name: `${kit.name} kit (${size})`,
    setup: quick?.price,
    monthly,
    setupPriceEnv: 'STRIPE_PRICE_KIT_SETUP_QUICK',
    monthlyPriceEnv: `STRIPE_PRICE_KIT_${envKit}_${size.toUpperCase()}_MONTHLY`,
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
