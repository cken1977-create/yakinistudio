'use client'
// Shrinks photos in the browser (iPhone HEIC → JPEG, max 2000px), uploads
// them straight to the private receipts bucket, then creates the draft.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createReceipt } from '../actions'

const MAX_SIDE = 2000

async function toJpeg(file: File): Promise<Blob> {
  let src: Blob = file
  const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
  if (isHeic) {
    const heic2any = (await import('heic2any')).default
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    src = Array.isArray(out) ? out[0] : out
  }
  if (file.type === 'application/pdf') return file
  const bmp = await createImageBitmap(src)
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('resize failed'))), 'image/jpeg', 0.85))
}

export function Uploader() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function upload() {
    setError(null)
    try {
      const supabase = createClient()
      const paths: string[] = []
      const folder = new Date().toISOString().slice(0, 7)
      for (const [i, f] of files.entries()) {
        setBusy(`Preparing photo ${i + 1} of ${files.length}…`)
        const blob = await toJpeg(f)
        const ext = blob.type === 'application/pdf' ? 'pdf' : 'jpg'
        const path = `${folder}/${crypto.randomUUID()}.${ext}`
        setBusy(`Uploading photo ${i + 1} of ${files.length}…`)
        const { error: e } = await supabase.storage.from('ms-receipts').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
        if (e) throw new Error('Upload failed')
        paths.push(path)
      }
      setBusy('Reading…')
      const id = await createReceipt(paths)
      router.push(`/receipts/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setBusy(null)
    }
  }

  return (
    <div className="card">
      <input type="file" accept="image/*,.heic,.heif,application/pdf" capture="environment" multiple
        onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))} />
      {files.length > 0 && <p className="muted">{files.length} photo{files.length > 1 ? 's' : ''} picked</p>}
      <p><button type="button" disabled={!files.length || !!busy} onClick={upload}>{busy ?? 'Upload'}</button></p>
      {error && <p className="bad">{error}</p>}
    </div>
  )
}
