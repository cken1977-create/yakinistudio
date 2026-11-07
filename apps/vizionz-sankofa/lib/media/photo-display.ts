// The Recent Events mosaic draws a caption on each photo.
// It does not draw a date. Upload time (created_at) stays stored and still
// orders the photos. An event date stays available for a listing or detail
// that is not the photo overlay. Nothing is written into the image file.

import { formatDateValue } from '@/lib/format/datetime'

export function eventsMosaicLabel(input: {
  caption?: string | null
  eventDate?: string | null
  createdAt?: string | null
}): string {
  return input.caption?.trim() ?? ''
}

/** A date for an event listing or detail. Not used on the photo mosaic. */
export function eventListingDate(eventDate: string | null | undefined): string | null {
  const value = eventDate?.trim() ?? ''
  if (!value) return null
  const label = formatDateValue(value, { year: 'numeric', month: 'long', day: 'numeric' })
  return label || null
}
