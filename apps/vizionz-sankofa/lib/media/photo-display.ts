// Events photos only. The homepage Recent Events tile used to print the
// upload time (created_at) on the picture when no event date was saved.
// That label is not drawn. created_at stays stored and still orders the
// photos. A date someone entered for the event is still shown. This does
// not change dates inside the image file.

import { formatDateValue } from '@/lib/format/datetime'

export function visiblePhotoDate(input: { eventDate?: string | null; createdAt?: string | null }): string | null {
  const eventDate = input.eventDate?.trim() ?? ''
  if (!eventDate) return null
  const label = formatDateValue(eventDate, { year: 'numeric', month: 'long', day: 'numeric' })
  return label || null
}

export function photoCardText(input: { caption?: string | null; eventDate?: string | null; createdAt?: string | null }): string {
  const caption = input.caption?.trim() ?? ''
  const date = visiblePhotoDate(input) ?? ''
  return [date, caption].filter(Boolean).join(' ')
}
