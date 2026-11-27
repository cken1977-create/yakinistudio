/**
 * Kits (spec 7.2): food truck, restaurant, landlord, real estate, tree and lawn, nonprofit, training
 * school, trucking and oilfield, each with its own pages and photos. `service` is the general layout
 * for any business without a kit of its own. Each kit exports its page
 * templates, allowed sections, default variants, font pairs, copy tone, licensed sample images,
 * default palette and Today kinds. Later kits are one PR each (Phase 8).
 */
import type { SiteKitId as KitId } from '@yakini/pricing'
import { CURRENT_SCHEMA_VERSION, type Brand, type FontPair, type SiteDocContent, type SiteDocInput, type Style } from '@yakini/site-schema'
import { foodTruck } from './food-truck'
import { landlord } from './landlord'
import { nonprofit } from './nonprofit'
import { oilfield } from './oilfield'
import { realEstate } from './real-estate'
import { restaurant } from './restaurant'
import { service } from './service'
import { trainingSchool } from './training-school'
import { treeLawn } from './tree-lawn'
import { trucking } from './trucking'
import type { KitDefinition, Palette, SampleImage, TemplateContext } from './types'
import { composeHome } from './composer'

export * from './types'
export { paragraphs } from './common'
export * from './industries'
export * from './color-presets'

/** Every kit's template runs through the layout composer (design D2): one Home rhythm for all. */
const composed = (kit: KitDefinition): KitDefinition => ({ ...kit, template: (ctx) => composeHome(kit, kit.template(ctx), ctx) })

export const BUILDER_KITS: Partial<Record<KitId, KitDefinition>> = {
  'food-truck': composed(foodTruck),
  restaurant: composed(restaurant),
  landlord: composed(landlord),
  'real-estate': composed(realEstate),
  'tree-lawn': composed(treeLawn),
  nonprofit: composed(nonprofit),
  'training-school': composed(trainingSchool),
  trucking: composed(trucking),
  oilfield: composed(oilfield),
  service: composed(service),
}

export const BUILDER_KIT_IDS = Object.keys(BUILDER_KITS) as KitId[]

export function kitDefinition(id: KitId): KitDefinition | undefined {
  return BUILDER_KITS[id]
}

export function isBuilderKit(id: string | undefined | null): id is KitId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(BUILDER_KITS, id)
}

/** Every sample image must carry a licence record before it ships (image licensing tracking). */
export function unlicensedSamples(kits: Partial<Record<KitId, KitDefinition>> = BUILDER_KITS): string[] {
  const out: string[] = []
  for (const k of Object.values(kits)) for (const img of k?.sampleImages ?? []) {
    if (!img.license?.source || typeof img.license.redistributable !== 'boolean') out.push(`${k!.id}:${img.key}`)
  }
  return out
}

const SAMPLES_BY_ID = new Map<string, SampleImage>()
for (const k of Object.values(BUILDER_KITS)) for (const img of k?.sampleImages ?? []) SAMPLES_BY_ID.set(img.assetId, img)

/** A kit sample image by its fixed asset id (the app serves these files itself). */
export function sampleImageById(assetId: string): SampleImage | undefined {
  return SAMPLES_BY_ID.get(assetId)
}

/** Sample pictures the editor offers for this kit (retired drawings stay resolvable, not offered). */
export function offeredSamples(kit: KitDefinition | undefined): SampleImage[] {
  return (kit?.sampleImages ?? []).filter((s) => !s.retired)
}

/** URL of a sample file the studio serves from public/ (`small` for thumbnails). */
export function sampleImageSrc(sample: SampleImage, size: 'full' | 'small' = 'full'): string {
  const dir = sample.storagePath.slice(0, sample.storagePath.lastIndexOf('/') + 1)
  if (sample.webp) return `/${dir}${size === 'small' ? sample.webp.small : sample.webp.large}`
  return `/${sample.storagePath}`
}

/** The kit's first allowed font pair is its default. */
export function defaultFontPair(kit: KitDefinition): FontPair {
  return kit.fontPairs[0]
}

export type DraftBrand = {
  colors: Palette | null
  logo?: { assetId: string; alt: string }
}

/**
 * Brand block for a new draft. Colors are used exactly as given (R6): no normalising, no
 * "improving". With no colors, the kit's default palette is used and labelled as such.
 */
export function brandFor(kit: KitDefinition, b: DraftBrand, source: 'extracted' | 'owner' = 'extracted'): Brand {
  return {
    ...(b.logo ? { logo: { assetId: b.logo.assetId, alt: b.logo.alt.slice(0, 120) } } : {}),
    colors: b.colors ? { ...b.colors } : { ...kit.defaultPalette },
    colorsSource: b.colors ? source : 'kit-default',
    fontPair: defaultFontPair(kit),
  }
}

/**
 * Kits whose new drafts get the Signature look in design phase D1 (other presets arrive in D3).
 * Every other kit keeps the classic look with its own font pair.
 */
export const SIGNATURE_KITS: ReadonlySet<string> = new Set(['food-truck', 'restaurant'])

/** The look a new draft starts with (design v2). Never touches brand colors (R6). */
export function defaultStyle(kit: KitDefinition, brand: Brand): Style {
  return SIGNATURE_KITS.has(kit.id)
    ? { preset: 'signature', surface: 'dark', fontPair: 'signature', radius: 'round', motion: 'subtle' }
    : { preset: 'classic', surface: 'light', fontPair: brand.fontPair, radius: 'round', motion: 'off' }
}

/**
 * Assemble a full SiteDoc from content the server trusts (a kit template, or AI content that
 * already passed validation and the kit check). Brand, style and integrations are always set here,
 * never taken from the content (spec 8.5, R6).
 */
export function assembleDoc(kit: KitDefinition, content: SiteDocContent, brand: Brand): SiteDocInput {
  return {
    ...content,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    kitId: kit.id,
    locale: 'en-US',
    brand,
    style: defaultStyle(kit, brand),
    footer: { ...content.footer, showSiteByYakini: true },
    integrations: { bookingEnabled: false, formsEnabled: true },
  }
}

/** The fallback draft: the kit template with only name, logo and colors filled in (spec 5.2 4f). */
export function buildKitDraft(kit: KitDefinition, ctx: TemplateContext, brand: Brand): SiteDocInput {
  return assembleDoc(kit, kit.template(ctx), brand)
}

/**
 * Checks AI content against the kit's rules (spec 8.4 KIT_RULES). Returns plain-English issues
 * the model can act on; an empty list means the content fits the kit.
 */
export function checkAgainstKit(content: SiteDocContent, kit: KitDefinition): string[] {
  const issues: string[] = []
  const templates = new Map(kit.pageTemplates.map((t) => [t.id, t]))
  if (content.pages.length !== kit.pageTemplates.length) {
    issues.push(`pages: use exactly these ${kit.pageTemplates.length} pages: ${kit.pageTemplates.map((t) => t.id).join(', ')}`)
  }
  const allowed = new Set(kit.allowedSections)
  content.pages.forEach((p, i) => {
    const t = templates.get(p.id)
    if (!t) { issues.push(`pages.${i}.id: "${p.id}" is not one of the kit pages (${[...templates.keys()].join(', ')})`); return }
    if (p.slug !== t.slug) issues.push(`pages.${i}.slug: page "${p.id}" must use the address "${t.slug}"`)
    if (p.sections[0]?.type !== 'header') issues.push(`pages.${i}.sections: the first section must be the header`)
    if (p.sections[p.sections.length - 1]?.type !== 'footer') issues.push(`pages.${i}.sections: the last section must be the footer`)
    p.sections.forEach((s, j) => {
      if (!allowed.has(s.type)) issues.push(`pages.${i}.sections.${j}.type: "${s.type}" is not allowed in this kit`)
      if ((s.type === 'header' && j !== 0) || (s.type === 'footer' && j !== p.sections.length - 1)) {
        issues.push(`pages.${i}.sections.${j}: the ${s.type} can only be the ${s.type === 'header' ? 'first' : 'last'} section`)
      }
    })
  })
  for (const t of kit.pageTemplates) if (!content.pages.some((p) => p.id === t.id)) issues.push(`pages: the "${t.id}" page is missing`)
  return issues
}

/** Kit rules as plain data for the generate prompt (spec 8.4 KIT_RULES). */
export function kitRules(kit: KitDefinition) {
  return {
    kitId: kit.id,
    pageTemplates: kit.pageTemplates.map((t) => ({ id: t.id, slug: t.slug, title: t.title, sections: t.sectionTypes })),
    allowedSections: kit.allowedSections,
    defaultVariants: kit.defaultVariants,
    rules: [
      'Keep exactly the kit pages, with their ids and addresses.',
      'Every page starts with a header section and ends with a footer section.',
      'Use only section types from allowedSections, with their allowed variants.',
      'Images: use only assetIds from AVAILABLE_IMAGES or ones already in KIT_TEMPLATE.',
      'Forms keep the fields, formKey and consentText from KIT_TEMPLATE.',
      'Links to other websites: only the business’s own website and its social pages.',
      'Use [[ ]] placeholders for any fact you do not have.',
    ],
  }
}

export { foodTruck, restaurant }
