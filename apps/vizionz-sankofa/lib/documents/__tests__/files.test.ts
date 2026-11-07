import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  APPLICATION_FILE_BUCKET, GALLERY_BUCKET, LIBRARY_DOCUMENT_BUCKET, PARTICIPANT_DOCUMENT_BUCKET,
  decideLibraryDocument, decideParticipantDocument, documentBatchTitle, libraryObjectPath,
  newObjectToRemove, participantObjectPath,
} from '../files'

const user = '00000000-0000-0000-0000-0000000000a1'
const participant = '00000000-0000-0000-0000-000000000001'

test('document buckets are private names and are not the public gallery', () => {
  assert.equal(GALLERY_BUCKET, 'media')
  assert.equal(LIBRARY_DOCUMENT_BUCKET, 'vs-documents')
  assert.equal(PARTICIPANT_DOCUMENT_BUCKET, 'vs-participant-documents')
  assert.equal(APPLICATION_FILE_BUCKET, 'vs-intake-files')
  assert.notEqual(LIBRARY_DOCUMENT_BUCKET, GALLERY_BUCKET)
  assert.notEqual(PARTICIPANT_DOCUMENT_BUCKET, GALLERY_BUCKET)
  assert.notEqual(APPLICATION_FILE_BUCKET, GALLERY_BUCKET)
})

test('a pdf is accepted and an empty or unknown file is refused before upload', () => {
  const pdf = decideParticipantDocument({ name: 'Sample-lease.PDF', type: '', size: 1200 })
  assert.equal(pdf.ok && pdf.contentType, 'application/pdf')
  const word = decideLibraryDocument({ name: 'budget.docx', type: '', size: 4000 })
  assert.equal(word.ok, true)
  const empty = decideParticipantDocument({ name: 'blank.pdf', type: 'application/pdf', size: 0 })
  assert.equal(empty.ok, false)
  const tiff = decideLibraryDocument({ name: 'scan.tiff', type: 'image/tiff', size: 2000 })
  assert.equal(tiff.ok, false)
  if (!tiff.ok) assert.match(tiff.reason, /Nothing already stored was changed/)
  const huge = decideLibraryDocument({ name: 'big.pdf', type: 'application/pdf', size: 51 * 1024 * 1024 })
  assert.equal(huge.ok, false)
})

test('paths stay inside the owner folder and never point at the gallery', () => {
  assert.equal(libraryObjectPath(user, 'abc', 'Budget 2026.pdf'), `${user}/abc-budget-2026.pdf`)
  assert.equal(participantObjectPath(participant, 'abc', '../secret.pdf'), `${participant}/abc-secret.pdf`)
  assert.equal(libraryObjectPath('not-a-user', 'abc', 'a.pdf'), null)
  assert.equal(participantObjectPath(participant, '../x', 'a.pdf'), null)
  assert.equal(String(libraryObjectPath(user, 'abc', 'a.pdf')).startsWith('media/'), false)
})

test('a failed new file can be removed and an already saved file cannot', () => {
  assert.deepEqual(newObjectToRemove(`${user}/abc-a.pdf`, false), [`${user}/abc-a.pdf`])
  assert.deepEqual(newObjectToRemove(`${user}/abc-a.pdf`, true), [])
  assert.deepEqual(newObjectToRemove(null, false), [])
  assert.deepEqual(newObjectToRemove('../a.pdf', false), [])
})

test('the batch is not called saved when a file failed', () => {
  assert.equal(documentBatchTitle([{ status: 'ready' }, { status: 'error' }]), 'Some files were not saved')
  assert.equal(documentBatchTitle([{ status: 'ready' }]), 'Saved')
  assert.equal(documentBatchTitle([{ status: 'uploading' }]), 'Uploading')
  assert.equal(documentBatchTitle([]), 'Select files to upload')
})
