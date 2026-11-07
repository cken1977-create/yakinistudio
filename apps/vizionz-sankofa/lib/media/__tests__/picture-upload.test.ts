import assert from 'node:assert/strict'
import test from 'node:test'
import {
  beginUpload, decideGalleryFile, explainHeicFailure, explainStorageError, finishUpload,
  idleUpload, isUploadActive, libraryAfterAttempt, markUploadFile, measuredUploadPercent,
  pathsToRemoveAfterFailure, retryFailedUpload, selectUploadFiles, uploadStatusText,
} from '../picture-upload'

test('laptop jpg, jfif, and image/jpg are photos; tiff and unknown types are refused with a reason', () => {
  const jpg = decideGalleryFile({ name: 'Event Photo.JPG', type: 'image/jpeg', size: 1200 })
  assert.equal(jpg.ok && jpg.contentType, 'image/jpeg')
  assert.equal(jpg.ok && jpg.heic, false)
  const jfif = decideGalleryFile({ name: 'scan.jfif', type: '', size: 800 })
  assert.equal(jfif.ok && jfif.contentType, 'image/jpeg')
  const alias = decideGalleryFile({ name: 'camera.jpg', type: 'image/jpg', size: 800 })
  assert.equal(alias.ok && alias.contentType, 'image/jpeg')
  const png = decideGalleryFile({ name: 'shot.png', type: '', size: 400 })
  assert.equal(png.ok && png.kind, 'photo')
  const tiff = decideGalleryFile({ name: 'scan.tiff', type: 'image/tiff', size: 400 })
  assert.equal(tiff.ok, false)
  if (!tiff.ok) assert.match(tiff.reason, /JPG or PNG/)
  const exe = decideGalleryFile({ name: 'setup.exe', type: 'application/octet-stream', size: 400 })
  assert.equal(exe.ok, false)
  if (!exe.ok) assert.match(exe.reason, /setup.exe/)
})

test('HEIC is a separate conversion path, not the decision for a normal laptop photo', () => {
  const heic = decideGalleryFile({ name: 'IMG.heic', type: '', size: 1000 })
  assert.equal(heic.ok && heic.heic, true)
  assert.match(explainHeicFailure('IMG.heic'), /JPG or PNG/)
  assert.match(explainHeicFailure('IMG.heic'), /Nothing already in the library was changed/)
})

test('oversized and empty files are refused before upload', () => {
  const big = decideGalleryFile({ name: 'huge.jpg', type: 'image/jpeg', size: 50 * 1024 * 1024 + 1 })
  assert.equal(big.ok, false)
  if (!big.ok) assert.match(big.reason, /50 MB/)
  const empty = decideGalleryFile({ name: 'empty.png', type: 'image/png', size: 0 })
  assert.equal(empty.ok, false)
})

test('storage failures keep a readable reason and promise the library was not changed', () => {
  assert.match(explainStorageError('new row violates row-level security policy'), /refused this upload/)
  assert.match(explainStorageError('Bucket not found'), /not available/)
  assert.match(explainStorageError(''), /refused/)
})

test('percentage is shown only when bytes were measured', () => {
  assert.equal(measuredUploadPercent(null), null)
  assert.equal(measuredUploadPercent({}), null)
  assert.equal(measuredUploadPercent({ loaded: 1, total: 0 }), null)
  assert.equal(measuredUploadPercent({ loaded: 50, total: 100 }), 50)
})

test('pending upload is not idle, and a duplicate start is ignored', () => {
  const selected = selectUploadFiles(idleUpload(), ['a.jpg', 'b.png'])
  assert.equal(selected.phase, 'selected')
  assert.match(uploadStatusText(selected) ?? '', /2 files selected/)
  const started = beginUpload(selected)
  assert.equal(started.accepted, true)
  assert.equal(started.session.phase, 'preparing')
  assert.equal(started.session.submission, 1)
  assert.match(uploadStatusText(started.session) ?? '', /Preparing a.jpg/)
  assert.equal(isUploadActive(started.session.phase), true)
  const duplicate = beginUpload(started.session)
  assert.equal(duplicate.accepted, false)
  assert.equal(duplicate.session.submission, 1)
  const ignoredPick = selectUploadFiles(started.session, ['c.jpg'])
  assert.equal(ignoredPick.files.length, 2)
})

test('uploading and saving name the file, then success is explicit', () => {
  let session = beginUpload(selectUploadFiles(idleUpload(), ['laptop.jpg'])).session
  session = markUploadFile(session, 0, 'uploading')
  assert.match(uploadStatusText(session) ?? '', /^Uploading laptop.jpg/)
  session = markUploadFile(session, 0, 'saving')
  assert.match(uploadStatusText(session) ?? '', /^Saving laptop.jpg/)
  session = finishUpload(markUploadFile(session, 0, 'done'))
  assert.equal(session.phase, 'completed')
  assert.match(uploadStatusText(session) ?? '', /Saved 1 file/)
})

test('failure explains the file, offers retry, and does not drop a prior picture', () => {
  const prior = [{ id: 'prior', path: 'prior.jpg' }]
  let session = beginUpload(selectUploadFiles(idleUpload(), ['new.jpg'])).session
  session = markUploadFile(session, 0, 'failed', 'The library refused this upload for this account. Nothing already in the library was changed.')
  session = finishUpload(session)
  assert.equal(session.phase, 'failed')
  assert.match(uploadStatusText(session) ?? '', /new.jpg/)
  assert.deepEqual(libraryAfterAttempt(prior, null), prior)
  assert.deepEqual(pathsToRemoveAfterFailure('new-upload.jpg', false), ['new-upload.jpg'])
  assert.deepEqual(pathsToRemoveAfterFailure('prior.jpg', true), [])
  const retry = retryFailedUpload(session)
  assert.equal(retry.accepted, true)
  assert.equal(retry.session.phase, 'preparing')
  assert.equal(retry.session.submission, 2)
  assert.equal(retryFailedUpload(retry.session).accepted, false)
})

test('a failed second file does not remove the one that just saved', () => {
  let session = beginUpload(selectUploadFiles(idleUpload(), ['kept.jpg', 'bad.jpg'])).session
  session = finishUpload(markUploadFile(markUploadFile(session, 0, 'done'), 1, 'failed', 'refused'))
  assert.equal(session.phase, 'failed')
  assert.equal(session.files[0].status, 'done')
  assert.match(uploadStatusText(session) ?? '', /1 saved/)
  const retry = retryFailedUpload(session)
  assert.equal(retry.session.files[0].status, 'done')
  assert.equal(retry.session.files[1].status, 'preparing')
})
