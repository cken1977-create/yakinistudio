import { z } from 'zod'
import type { FormField, RichText, Section, SectionOf, SectionType } from '@yakini/site-schema'
import type { SampleImage, TemplateContext, TodayKind } from './types'

/** Plain paragraphs as RichText. */
export function paragraphs(...texts: string[]): RichText {
  return texts.map((text) => ({ type: 'p' as const, children: [{ text }] }))
}

/** Builds a section with the right literal type, so templates stay type-checked. */
export function section<T extends SectionType>(type: T, id: string, variant: SectionOf<T>['variant'], props: SectionOf<T>['props'], hidden = false): Section {
  return { id, type, variant, hidden, props } as Section
}

export const header = (variant: 'bar' | 'centered', ctx: TemplateContext, ctaLabel: string) =>
  section('header', 'header', variant, { showPhone: Boolean(ctx.phone), ctaLabel })
export const footer = () => section('footer', 'footer', 'simple', {})

export function consentText(name: string): string {
  return `By sending this form you agree that ${name} may contact you about your request. Your details are never sold.`
}

/** The kit sample image used when the business has no photo of its own. */
export function imageOr(ctx: TemplateContext, sample: SampleImage | undefined): { assetId: string; alt: string } | undefined {
  if (ctx.heroImage) return ctx.heroImage
  return sample ? { assetId: sample.assetId, alt: sample.alt } : undefined
}

/** "in Albuquerque" when we know the city, otherwise nothing. */
export function inCity(ctx: TemplateContext): string {
  return ctx.city ? ` in ${ctx.city}` : ''
}

export function trimTo(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/**
 * A photo sample shipped as a JPEG (every browser) plus full-size, 960-wide, 800-wide and 640-wide
 * WebP copies, all in public/kit-samples/<kit>/. The 800-wide file is the phone step: a phone
 * otherwise jumps from 640 to 960 and downloads more than the screen needs. Photos are made for
 * Yakini's kits and contain no people's faces, logos or readable text.
 */
export function photoSample(kit: string, key: string, assetId: string, alt: string, sourceNote: string): SampleImage {
  return {
    key, assetId, alt,
    storagePath: `kit-samples/${kit}/${key}.jpg`,
    mime: 'image/jpeg', width: 1280, height: 720,
    webp: { large: `${key}.webp`, small: `${key}-sm.webp`, smallWidth: 640, phone: `${key}-ph.webp`, phoneWidth: 800, medium: `${key}-md.webp`, mediumWidth: 960 },
    license: { kind: 'yakini-owned', source: `Sample photo made for Yakini Digital's ${kit} kit, Nov 2026 (${sourceNote})`, redistributable: true },
  }
}

/** Today kinds several kits share (spec 11.5): a short notice, and "closed today". */
export function noticeKind(id: string, label: string): TodayKind {
  return {
    id, label,
    fields: z.object({ title: z.string().min(1).max(80), description: z.string().max(200).optional() }).strict(),
  }
}
export function closedKind(label = 'Closed today'): TodayKind {
  return { id: 'closed', label, headline: label, fields: z.object({ note: z.string().max(140).optional() }).strict() }
}

/** A contact form section with the kit's standard consent line. */
export function formSection(id: string, name: string, p: { heading: string; intro?: string; formKey: string; fields: FormField[]; submitLabel: string }, variant: 'simple' | 'with-details' = 'simple'): Section {
  return section('contact_form', id, variant, { ...p, consentText: consentText(trimTo(name, 120)) })
}
