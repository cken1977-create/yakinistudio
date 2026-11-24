import type { z } from 'zod'
import type { KitId } from '@yakini/pricing'
import type { FontPair, SectionType, SiteDocContent } from '@yakini/site-schema'

export type ImageLicense = {
  /** Where the image came from and under what terms. Required for every kit sample image. */
  kind: 'yakini-owned' | 'licensed-stock' | 'public-domain' | 'client-supplied'
  /** Human-readable source/licence reference (no secrets, no personal data). */
  source: string
  /** May this file be included in an owner's "Download my site" export (spec 11.7)? */
  redistributable: boolean
}

export type SampleImage = {
  key: string
  /** Fixed asset id used in SiteDocs. Never collides with tenant assets (those are random v4 ids). */
  assetId: string
  /** Path of the file shipped with the studio app (apps/builder/public/<storagePath>). */
  storagePath: string
  mime: 'image/svg+xml' | 'image/webp' | 'image/jpeg' | 'image/png'
  width: number
  height: number
  alt: string
  license: ImageLicense
  /**
   * Smaller, faster copies of a photo sample (same folder): a full-size WebP and a 640-wide WebP.
   * storagePath stays the JPEG every browser can show; pages offer the WebP files first.
   */
  webp?: { large: string; small: string; smallWidth: number }
  /**
   * An earlier sample that is no longer offered or used in new drafts. It stays here so drafts
   * that already show it keep rendering.
   */
  retired?: boolean
}

export type Palette = { primary: string; secondary: string; accent: string }

/** Context a kit template is filled from. Only trusted facts (from the owner or our form). */
export type TemplateContext = {
  name: string
  /** E.164, when the owner gave one or it was read from a tel: link on their own site. */
  phone?: string
  email?: string
  city?: string
  /** Hero/about photo from the business's own site, when we have one. */
  heroImage?: { assetId: string; alt: string }
  /** Extra photos from the business's own site for the gallery (already stored as tenant assets). */
  gallery?: { assetId: string; alt: string }[]
}

export type PageTemplate = {
  id: string
  slug: string
  title: string
  navLabel: string
  /** Section types this page should contain, in order (used to check AI output). */
  sectionTypes: readonly SectionType[]
}

export type TodayKind = {
  id: string
  label: string
  /** zod schema for the fields of this kind (spec 11.5). */
  fields: z.ZodType
  /** Text the site shows while this update is active, e.g. "Closed today". */
  headline?: string
}

export type KitDefinition = {
  id: KitId
  name: string
  pageTemplates: readonly PageTemplate[]
  allowedSections: readonly SectionType[]
  /** The variant each section type uses when a new section is added. */
  defaultVariants: Partial<Record<SectionType, string>>
  fontPairs: readonly FontPair[]
  /** Short style guide for the AI (spec 8.4 {{kit.copyTone}}). */
  copyTone: string
  sampleImages: readonly SampleImage[]
  /** Used only when no brand colors exist (labelled "Default colors"). */
  defaultPalette: Palette
  todayKinds: readonly TodayKind[]
  /** The kit's default site content with [[ ]] placeholders for facts we don't have. */
  template: (ctx: TemplateContext) => SiteDocContent
}
