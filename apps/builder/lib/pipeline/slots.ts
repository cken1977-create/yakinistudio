import type { ImageRef, SiteDoc } from '@yakini/site-schema'
import type { ShotSlot } from './shot-list'

/**
 * Where a site shows photos, and which of those places generated images may fill (design D4).
 *
 * A place can be filled when it shows a library image (a kit sample or the AI-made kit library) or
 * nothing yet. The owner's own photos are never replaced, and nothing is swapped in once the owner has
 * changed that place themselves (the swap re-checks each place against what was there before).
 */
export type SlotRole = 'hero' | 'feature' | 'gallery'
export type ImageSlot = { role: SlotRole; pageIndex: number; sectionIndex: number; field: 'image' | 'images' | 'items'; index: number; current: ImageRef | null }

type Json = Record<string, unknown>
const HERO_WITH_IMAGE = new Set(['split', 'fullbleed', 'cinematic', 'editorial-split', 'collage'])
const ABOUT_WITH_IMAGE = new Set(['left-image', 'right-image'])
export const GALLERY_TARGET = 6

/** Every place photos show, in page order, with what is there now. */
export function imageSlots(doc: SiteDoc): ImageSlot[] {
  const out: ImageSlot[] = []
  const homeIndex = Math.max(0, doc.pages.findIndex((p) => p.slug === ''))
  doc.pages.forEach((page, pi) => page.sections.forEach((s, si) => {
    const p = s.props as Json
    const img = (p.image as ImageRef | undefined) ?? null
    const at = (role: SlotRole, field: ImageSlot['field'], index: number, current: ImageRef | null) => out.push({ role, pageIndex: pi, sectionIndex: si, field, index, current })
    switch (s.type) {
      case 'hero':
        // The Home hero always takes a photo (it becomes cinematic); other heroes only if their design shows one.
        if (pi === homeIndex && out.every((x) => x.role !== 'hero')) at('hero', 'image', 0, img)
        else if (HERO_WITH_IMAGE.has(s.variant)) at('feature', 'image', 0, img)
        break
      case 'about': if (ABOUT_WITH_IMAGE.has(s.variant)) at('feature', 'image', 0, img); break
      case 'cta_band': if (s.variant === 'image') at('feature', 'image', 0, img); break
      case 'feature_rows': (p.items as Json[]).forEach((item, i) => at('feature', 'items', i, (item.image as ImageRef | undefined) ?? null)); break
      case 'gallery': {
        const imgs = (p.images as ImageRef[]) ?? []
        imgs.forEach((im, i) => at('gallery', 'images', i, im))
        for (let i = imgs.length; i < GALLERY_TARGET; i++) at('gallery', 'images', i, null)
        break
      }
    }
  }))
  return out
}

/** True when generated images may fill this place: empty, or showing a library image. */
export const replaceable = (s: ImageSlot, isLibrary: (assetId: string) => boolean) => !s.current || isLibrary(s.current.assetId)

/** Which shot fills which place: heroes first, then features (the tall shot first), then galleries. */
export function assignShots(slots: readonly ImageSlot[], isLibrary: (id: string) => boolean): { slot: ImageSlot; shot: ShotSlot }[] {
  const open = slots.filter((s) => replaceable(s, isLibrary))
  const out: { slot: ImageSlot; shot: ShotSlot }[] = []
  const hero = open.find((s) => s.role === 'hero')
  if (hero) out.push({ slot: hero, shot: 'hero-wide' })
  const features: ShotSlot[] = ['hero-tall', 'feature-1', 'feature-2', 'feature-3']
  open.filter((s) => s.role === 'feature').slice(0, features.length).forEach((s, i) => out.push({ slot: s, shot: features[i] }))
  const galleries: ShotSlot[] = ['gallery-1', 'gallery-2', 'gallery-3', 'gallery-4', 'gallery-5', 'gallery-6']
  open.filter((s) => s.role === 'gallery').slice(0, galleries.length).forEach((s, i) => out.push({ slot: s, shot: galleries[i] }))
  return out
}

const sameRef = (a: ImageRef | null, b: ImageRef | null) => (a?.assetId ?? null) === (b?.assetId ?? null)

/**
 * Put generated images into a doc. Each place is filled only if it still shows exactly what it
 * showed when the shot was planned (the owner may have edited it since). Returns the new doc and
 * how many places were filled. A Home hero that gets a photo becomes cinematic; a gallery that
 * reaches three photos is shown.
 */
export function placeImages(doc: SiteDoc, plan: readonly { slot: ImageSlot; ref: ImageRef }[]): { doc: SiteDoc; placed: number } {
  const out = structuredClone(doc)
  let placed = 0
  for (const { slot, ref } of plan) {
    const section = out.pages[slot.pageIndex]?.sections[slot.sectionIndex]
    if (!section) continue
    const p = section.props as Json
    if (slot.field === 'image') {
      if (!sameRef((p.image as ImageRef | undefined) ?? null, slot.current)) continue
      p.image = ref
      if (slot.role === 'hero' && section.type === 'hero' && !HERO_WITH_IMAGE.has(section.variant)) section.variant = 'cinematic'
    } else if (slot.field === 'items') {
      const item = (p.items as Json[])[slot.index]
      if (!item || !sameRef((item.image as ImageRef | undefined) ?? null, slot.current)) continue
      item.image = ref
    } else {
      const imgs = (p.images as ImageRef[]) ?? []
      const now = imgs[slot.index] ?? null
      if (!sameRef(now, slot.current)) continue
      if (slot.index > imgs.length) continue // keep the list without holes
      imgs[slot.index] = ref
      p.images = imgs
      if (imgs.length >= 3 && section.hidden) section.hidden = false
    }
    placed++
  }
  return { doc: out, placed }
}

/** The owner's own products, for the shot list: menu items and service names in the doc. */
export function offeringsIn(doc: SiteDoc): string[] {
  const out: string[] = []
  for (const page of doc.pages) for (const s of page.sections) {
    const p = s.props as Json
    if (s.type === 'menu') for (const c of (p.categories as Json[]) ?? []) for (const i of (c.items as Json[]) ?? []) out.push(String(i.name ?? ''))
    if (s.type === 'services') for (const i of (p.items as Json[]) ?? []) out.push(String(i.title ?? ''))
  }
  return out.filter(Boolean)
}
