import { createClient } from '@/lib/supabase/server'
import { publicMediaUrl } from '@/lib/media/picture-upload'
import { eventsMosaicLabel } from '@/lib/media/photo-display'
import { COMMUNITY_GALLERY } from '@/lib/site/public-pages'

export type EventGalleryItem = {
  date: string
  caption: string
  imageSrc?: string
}

type MediaRow = {
  storage_path: string
  caption: string | null
  event_date: string | null
  created_at: string
}

export function communityGalleryItems(): EventGalleryItem[] {
  return COMMUNITY_GALLERY.map((photo) => ({
    date: '',
    caption: photo.alt,
    imageSrc: photo.src,
  }))
}

export async function loadPublicEventPhotos(limit = 24): Promise<EventGalleryItem[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return []
  try {
    const supabase = await createClient()
    const { data: items } = await supabase
      .from('media_items')
      .select('storage_path, caption, event_date, created_at')
      .eq('kind', 'photo')
      .order('created_at', { ascending: false })
      .limit(limit)
    const rows = (items ?? []) as MediaRow[]
    return rows
      .filter((row) => row.storage_path?.trim())
      .map((row) => ({
        date: '',
        caption: eventsMosaicLabel({ caption: row.caption, eventDate: row.event_date, createdAt: row.created_at }),
        imageSrc: publicMediaUrl(supabaseUrl, row.storage_path),
      }))
      .filter((item) => item.imageSrc)
  } catch {
    return []
  }
}
