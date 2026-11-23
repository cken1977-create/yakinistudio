/**
 * Kits (spec 7.2). Empty in Phase 0. Phase 1 adds `food-truck.ts` and `restaurant.ts`,
 * each exporting pageTemplates, allowedSections, defaultVariants, fontPairs, copyTone,
 * sampleImages (each with license info and `redistributable`), defaultPalette, todayKinds.
 */
import type { KitId } from '@yakini/pricing'
import type { SectionType } from '@yakini/site-schema'

export type ImageLicense = {
  /** Where the image came from and under what terms. Required for every kit sample image. */
  kind: 'yakini-owned' | 'licensed-stock' | 'public-domain' | 'client-supplied'
  /** Human-readable source/licence reference (no secrets, no personal data). */
  source: string
  /** May this file be included in an owner's "Download my site" export (spec 11.7)? */
  redistributable: boolean
}

export type SampleImage = { key: string; storagePath: string; alt: string; license: ImageLicense }

export type KitDefinition = {
  id: KitId
  allowedSections: readonly SectionType[]
  fontPairs: readonly ('editorial' | 'modern' | 'friendly' | 'classic')[]
  copyTone: string
  sampleImages: readonly SampleImage[]
  defaultPalette: { primary: string; secondary: string; accent: string }
}

export const BUILDER_KITS: Partial<Record<KitId, KitDefinition>> = {}

export function kitDefinition(id: KitId): KitDefinition | undefined {
  return BUILDER_KITS[id]
}

/** Every sample image must carry a licence record before it ships (image licensing tracking). */
export function unlicensedSamples(kits: Partial<Record<KitId, KitDefinition>> = BUILDER_KITS): string[] {
  const out: string[] = []
  for (const k of Object.values(kits)) for (const img of k?.sampleImages ?? []) {
    if (!img.license?.source || typeof img.license.redistributable !== 'boolean') out.push(`${k!.id}:${img.key}`)
  }
  return out
}
