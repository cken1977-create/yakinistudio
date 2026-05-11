// VIZIONZ SANKOFA · GallerySection
// Server component wrapper around <Gallery />. Fetches the 5 most recent
// media_items from Supabase, maps them to the GalleryItem shape, and
// passes them to the presentation component. Falls back to Gallery's
// hardcoded defaults if Supabase is unreachable or returns empty.

import { createClient } from '@/lib/supabase/server'
import { Gallery, type GalleryItem } from './Gallery'

export const dynamic = 'force-dynamic'

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

function publicUrlFor(storagePath: string): string {
  return `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/media/${storagePath}`
}

function formatDateForGallery(eventDate: string | null, createdAt: string): string {
  // Prefer event_date (operator-set, more meaningful), fall back to created_at
  const source = eventDate ?? createdAt
  const date = new Date(source)
  if (isNaN(date.getTime())) return ''

  // Format as "May 9, 2026"
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type MediaRow = {
  id: string
  storage_path: string
  kind: 'photo' | 'video'
  caption: string | null
  event_date: string | null
  display_order: number
  created_at: string
}

export async function GallerySection() {
  const supabase = await createClient()

  // Pull the 5 most recent media items. Photos first — videos in the gallery
  // grid render as static frames which look broken; we keep videos in the
  // admin library only until Wave 2 ships a proper video gallery surface.
  const { data: items } = await supabase
    .from('media_items')
    .select('*')
    .eq('kind', 'photo')
    .order('created_at', { ascending: false })
    .limit(5)

  const rows = (items ?? []) as MediaRow[]

  // If we have at least one row, render the real gallery. If empty, let
  // Gallery use its own DEFAULT_ITEMS — the gradient-tile fallback that
  // still reads as intentional design rather than missing data.
  if (rows.length === 0) {
    return <Gallery />
  }

  const galleryItems: GalleryItem[] = rows.map((row) => ({
    date: formatDateForGallery(row.event_date, row.created_at),
    caption: row.caption ?? '',
    imageSrc: publicUrlFor(row.storage_path),
  }))

  return <Gallery items={galleryItems} viewAllHref="/gallery" />
}
