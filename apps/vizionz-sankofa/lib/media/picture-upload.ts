// Laptop photo upload decisions for the public gallery and participant files.
// The storage client in this app does not report bytes sent, so a percentage
// is shown only when a real loaded/total pair is measured.

export const GALLERY_MAX_BYTES = 50 * 1024 * 1024

export const GALLERY_ACCEPT = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
  '.jpg', '.jpeg', '.jfif', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif',
  'video/mp4', 'video/quicktime', 'video/webm', '.mp4', '.mov', '.webm', '.m4v',
].join(',')

const PHOTO_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  heic: 'image/heic',
  heif: 'image/heif',
}

const VIDEO_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  m4v: 'video/mp4',
}

const RENDERABLE = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'])

export type GalleryDecision =
  | { ok: true; kind: 'photo' | 'video'; contentType: string; heic: boolean }
  | { ok: false; reason: string }

export function fileExtension(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name
  const dot = base.lastIndexOf('.')
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : ''
}

function normalizedType(type: string): string {
  const value = type.toLowerCase().trim()
  if (value === 'image/jpg' || value === 'image/pjpeg' || value === 'image/pipeg') return 'image/jpeg'
  return value
}

export function decideGalleryFile(file: { name: string; type: string; size: number }): GalleryDecision {
  if (file.size <= 0) return { ok: false, reason: `${file.name} is empty. Nothing was saved.` }
  if (file.size > GALLERY_MAX_BYTES) {
    return { ok: false, reason: `${file.name} is over 50 MB, so this page will not send it. Choose a smaller JPG or PNG. Nothing already in the library was changed.` }
  }
  const ext = fileExtension(file.name)
  const type = normalizedType(file.type)
  const fromExt = PHOTO_TYPES[ext] || VIDEO_TYPES[ext] || ''
  const contentType = RENDERABLE.has(fromExt) || fromExt.startsWith('video/') || fromExt === 'image/heic' || fromExt === 'image/heif'
    ? fromExt
    : type.startsWith('video/')
      ? type
      : RENDERABLE.has(type)
        ? type
        : ''
  if (ext === 'tif' || ext === 'tiff' || type === 'image/tiff') {
    return { ok: false, reason: `${file.name} is a TIFF file. This browser cannot show it in the gallery. Save it as a JPG or PNG and try again. Nothing already in the library was changed.` }
  }
  if (!contentType) {
    return { ok: false, reason: `${file.name} is not a JPG, PNG, GIF, WebP, or video this page can store. Nothing already in the library was changed.` }
  }
  if (contentType.startsWith('video/')) return { ok: true, kind: 'video', contentType, heic: false }
  return { ok: true, kind: 'photo', contentType, heic: contentType === 'image/heic' || contentType === 'image/heif' }
}

export function explainStorageError(message: string): string {
  const text = message.trim()
  const lower = text.toLowerCase()
  const tail = ' Nothing already in the library was changed.'
  if (!text) return `The upload was refused.${tail}`
  if (lower.includes('row-level security') || lower.includes('not authorized') || lower.includes('unauthorized') || lower.includes('403')) {
    return `The library refused this upload for this account.${tail}`
  }
  if (lower.includes('bucket') && (lower.includes('not found') || lower.includes('does not exist'))) {
    return `Photo storage is not available yet.${tail}`
  }
  if (lower.includes('exceeded') || lower.includes('too large') || lower.includes('payload') || lower.includes('entity too large')) {
    return `This photo is larger than storage allows. Try a smaller JPG or PNG.${tail}`
  }
  if (lower.includes('mime') || lower.includes('content type') || lower.includes('invalid file')) {
    return `This file type was refused. Use a JPG, PNG, GIF, or WebP.${tail}`
  }
  return `${text}.${tail}`
}

export function explainHeicFailure(name: string): string {
  return `${name} is a HEIC photo and could not be converted in this browser. Save it as a JPG or PNG and try again. Nothing already in the library was changed.`
}

export function safeStorageName(name: string): string {
  const base = name.split('/').pop()!.split('\\').pop()!
  return base.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-').replace(/-+/g, '-') || 'photo'
}

export function publicMediaUrl(supabaseUrl: string, storagePath: string): string {
  const base = supabaseUrl.replace(/\/$/, '')
  const encoded = storagePath.split('/').map((part) => encodeURIComponent(part)).join('/')
  return `${base}/storage/v1/object/public/media/${encoded}`
}

/** Percentage only when bytes loaded and total were actually measured. */
export function measuredUploadPercent(progress: { loaded?: number; total?: number } | null | undefined): number | null {
  if (!progress) return null
  const { loaded, total } = progress
  if (typeof loaded !== 'number' || typeof total !== 'number') return null
  if (!Number.isFinite(loaded) || !Number.isFinite(total) || total <= 0 || loaded < 0) return null
  return Math.min(100, Math.round((loaded / total) * 100))
}

export type UploadPhase = 'idle' | 'selected' | 'preparing' | 'uploading' | 'saving' | 'completed' | 'failed'

export type UploadFileState = {
  name: string
  status: 'pending' | 'preparing' | 'uploading' | 'saving' | 'done' | 'failed'
  reason?: string
}

export type UploadSession = {
  phase: UploadPhase
  files: UploadFileState[]
  activeIndex: number | null
  submission: number
}

export function idleUpload(): UploadSession {
  return { phase: 'idle', files: [], activeIndex: null, submission: 0 }
}

export function isUploadActive(phase: UploadPhase): boolean {
  return phase === 'selected' || phase === 'preparing' || phase === 'uploading' || phase === 'saving'
}

export function selectUploadFiles(session: UploadSession, names: string[]): UploadSession {
  if (isUploadActive(session.phase) || names.length === 0) return session
  return {
    phase: 'selected',
    files: names.map((name) => ({ name, status: 'pending' })),
    activeIndex: null,
    submission: session.submission,
  }
}

export function beginUpload(session: UploadSession): { session: UploadSession; accepted: boolean } {
  if (session.phase !== 'selected') return { session, accepted: false }
  const index = session.files.findIndex((file) => file.status === 'pending')
  if (index < 0) return { session, accepted: false }
  return {
    accepted: true,
    session: {
      ...session,
      phase: 'preparing',
      activeIndex: index,
      submission: session.submission + 1,
      files: session.files.map((file, i) => (i === index ? { ...file, status: 'preparing' } : file)),
    },
  }
}

export function markUploadFile(
  session: UploadSession,
  index: number,
  status: 'preparing' | 'uploading' | 'saving' | 'done' | 'failed',
  reason?: string,
): UploadSession {
  const phase = status === 'done' || status === 'failed' ? session.phase : status
  return {
    ...session,
    phase,
    activeIndex: status === 'done' || status === 'failed' ? session.activeIndex : index,
    files: session.files.map((file, i) => (i === index ? { ...file, status, reason: status === 'failed' ? reason : undefined } : file)),
  }
}

export function finishUpload(session: UploadSession): UploadSession {
  const failed = session.files.some((file) => file.status === 'failed')
  const done = session.files.some((file) => file.status === 'done')
  return { ...session, phase: failed || !done ? 'failed' : 'completed', activeIndex: null }
}

export function retryFailedUpload(session: UploadSession): { session: UploadSession; accepted: boolean } {
  if (session.phase !== 'failed') return { session, accepted: false }
  const index = session.files.findIndex((file) => file.status === 'failed')
  if (index < 0) return { session, accepted: false }
  const cleared: UploadSession = {
    ...session,
    phase: 'selected',
    files: session.files.map((file) => (file.status === 'failed' ? { name: file.name, status: 'pending' } : file)),
  }
  return beginUpload(cleared)
}

export function uploadStatusText(session: UploadSession): string | null {
  if (session.phase === 'idle') return null
  const current = session.activeIndex != null ? session.files[session.activeIndex] : undefined
  if (session.phase === 'selected') {
    const count = session.files.length
    return `${count} file${count === 1 ? '' : 's'} selected. Preparing to upload.`
  }
  if (session.phase === 'preparing') return `Preparing ${current?.name ?? 'file'}…`
  if (session.phase === 'uploading') return `Uploading ${current?.name ?? 'file'}…`
  if (session.phase === 'saving') return `Saving ${current?.name ?? 'file'}…`
  if (session.phase === 'completed') {
    const count = session.files.filter((file) => file.status === 'done').length
    return `Saved ${count} file${count === 1 ? '' : 's'}. ${count === 1 ? 'It is' : 'They are'} in the library.`
  }
  const failed = session.files.filter((file) => file.status === 'failed')
  const saved = session.files.filter((file) => file.status === 'done').length
  const head = saved > 0 ? `${saved} saved. ${failed.length} not uploaded.` : `${failed.length} file${failed.length === 1 ? '' : 's'} not uploaded.`
  return [head, ...failed.map((file) => `${file.name}: ${file.reason ?? 'Upload failed.'}`)].join(' ')
}

export function pathsToRemoveAfterFailure(newPath: string | null, saved: boolean): string[] {
  if (newPath && !saved) return [newPath]
  return []
}

export function libraryAfterAttempt<T extends { id: string }>(existing: T[], added: T | null): T[] {
  if (!added) return existing
  return [added, ...existing]
}

export function contentTypeForDocument(file: { name: string; type: string }): string {
  const fromName = PHOTO_TYPES[fileExtension(file.name)]
  if (fromName) return fromName
  const type = normalizedType(file.type)
  return type || 'application/octet-stream'
}

export function isPreviewableImage(name: string, type: string): boolean {
  const decision = decideGalleryFile({ name, type, size: 1 })
  return decision.ok && decision.kind === 'photo' && !decision.heic
}
