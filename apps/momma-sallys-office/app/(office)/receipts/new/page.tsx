import { notFound } from 'next/navigation'
import { requireOwner } from '@/lib/auth'
import { flags } from '@/lib/flags'
import { getExtractor } from '@/lib/receipts/providers'
import { Uploader } from './Uploader'

export default async function NewReceiptPage() {
  if (!flags.receipts()) notFound()
  await requireOwner()
  const reader = getExtractor().id
  return (
    <>
      <h1>Add a receipt</h1>
      <p className="muted">
        Take a photo or pick one (add more photos for long receipts). Photos are stored privately; only you can see them.
        {reader === 'manual' && ' You’ll type the lines in on the next screen, next to the photo.'}
        {reader === 'mock' && ' TEST MODE: the next screen fills in a sample receipt, not what’s on your photo.'}
      </p>
      <Uploader />
    </>
  )
}
