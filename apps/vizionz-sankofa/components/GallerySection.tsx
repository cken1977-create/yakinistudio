// VIZIONZ SANKOFA · GallerySection
// Server component wrapper around <Gallery />. Fetches the 5 most recent
// media_items from Supabase, maps them to the GalleryItem shape, and
// passes them to the presentation component. Falls back to Gallery's
// hardcoded defaults if Supabase is unreachable or returns empty.

import { Gallery } from './Gallery'
import { communityGalleryItems, loadPublicEventPhotos } from '@/lib/site/event-gallery'

export async function GallerySection() {
  const galleryItems = await loadPublicEventPhotos(5)

  if (galleryItems.length === 0) {
    return (
      <Gallery
        items={communityGalleryItems().slice(0, 5)}
        kicker="Community photos"
        headline="From the community"
        sub="These photographs show community gatherings. They are not labeled as a particular event."
        viewAllHref="/gallery"
        headingId="vs-gallery-heading"
      />
    )
  }

  return <Gallery items={galleryItems} viewAllHref="/gallery" />
}
