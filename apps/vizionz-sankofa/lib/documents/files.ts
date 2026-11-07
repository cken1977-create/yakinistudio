// Document files stay in dedicated private buckets.
// The public gallery bucket is "media". It is not a document bucket.
// vs-documents is the staff library. vs-participant-documents is one
// participant's file. vs-intake-files is an application attachment.
// None of these helpers send a file or delete an existing object.

export const GALLERY_BUCKET = 'media'
export const LIBRARY_DOCUMENT_BUCKET = 'vs-documents'
export const PARTICIPANT_DOCUMENT_BUCKET = 'vs-participant-documents'
export const APPLICATION_FILE_BUCKET = 'vs-intake-files'

export const LIBRARY_MAX_BYTES = 50 * 1024 * 1024
export const PARTICIPANT_DOCUMENT_MAX_BYTES = 50 * 1024 * 1024

const LIBRARY_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  csv: 'text/csv',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

const PARTICIPANT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

export type DocumentDecision = { ok: true; contentType: string } | { ok: false; reason: string }

function extensionOf(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name
  const dot = base.lastIndexOf('.')
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : ''
}

function decide(
  file: { name: string; type: string; size: number },
  types: Record<string, string>,
  maxBytes: number,
  label: string,
): DocumentDecision {
  if (file.size <= 0) return { ok: false, reason: `${file.name} is empty. Nothing was saved.` }
  if (file.size > maxBytes) {
    return { ok: false, reason: `${file.name} is over ${Math.round(maxBytes / (1024 * 1024))} MB. Nothing already stored was changed.` }
  }
  const ext = extensionOf(file.name)
  const contentType = types[ext]
  if (!contentType) {
    return { ok: false, reason: `${file.name} is not a ${label}. Nothing already stored was changed.` }
  }
  return { ok: true, contentType }
}

export function decideLibraryDocument(file: { name: string; type: string; size: number }): DocumentDecision {
  return decide(file, LIBRARY_TYPES, LIBRARY_MAX_BYTES, 'PDF, Word, Excel, text, or image file this library accepts')
}

export function decideParticipantDocument(file: { name: string; type: string; size: number }): DocumentDecision {
  return decide(file, PARTICIPANT_TYPES, PARTICIPANT_DOCUMENT_MAX_BYTES, 'PDF, Word, text, JPG, or PNG file')
}

export function safeDocumentName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'file'
  return base.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-').replace(/-+/g, '-').replace(/^\.+/, '') || 'file'
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Staff library objects live under the signed-in user's id. The gallery bucket is never used. */
export function libraryObjectPath(userId: string, unique: string, fileName: string): string | null {
  if (!UUID.test(userId) || !unique || unique.includes('/') || unique.includes('..')) return null
  return `${userId}/${unique}-${safeDocumentName(fileName)}`
}

/** Participant files live under that participant's id, not a shared folder. */
export function participantObjectPath(participantId: string, unique: string, fileName: string): string | null {
  if (!UUID.test(participantId) || !unique || unique.includes('/') || unique.includes('..')) return null
  return `${participantId}/${unique}-${safeDocumentName(fileName)}`
}

export type DocumentRowStatus = 'queued' | 'uploading' | 'saving' | 'ready' | 'error'

export function documentBatchTitle(rows: { status: DocumentRowStatus }[]): string {
  if (rows.length === 0) return 'Select files to upload'
  if (rows.some((row) => row.status === 'uploading' || row.status === 'saving')) return 'Uploading'
  if (rows.every((row) => row.status === 'ready')) return 'Saved'
  if (rows.some((row) => row.status === 'error')) return 'Some files were not saved'
  return `Upload ${rows.length} ${rows.length === 1 ? 'file' : 'files'}`
}

/** Only a new object that never got a saved record may be removed. */
export function newObjectToRemove(path: string | null, saved: boolean): string[] {
  if (path && !saved && !path.includes('..') && path.split('/').length >= 2) return [path]
  return []
}
