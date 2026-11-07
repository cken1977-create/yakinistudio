// Renders the upload and removal panels with fictional names for screenshots.
// Does not call Supabase and does not use production data.

import { writeFileSync, mkdirSync, statSync, rmSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import {
  beginUpload, finishUpload, idleUpload, markUploadFile, selectUploadFiles, uploadStatusText,
} from '../lib/media/picture-upload'
import { REMOVAL_SEMANTICS, legalName } from '../lib/participants/removal'
import { EXPECTED_WAKE_PHRASE, wakeStartFailed, wakeStarted } from '../lib/voice/wake'
import { applyHref } from '../lib/programs/apply'
import { programTextSections } from '../lib/programs/detail'

const outDir = '/opt/cursor/artifacts'
mkdirSync(outDir, { recursive: true })

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAsklEQVR4nO3SMQ0AAAgEsE3eG6T4qAQb0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID/2QMAAAD//2kAAAEJ0l1bAAAAAElFTkSuQmCC',
  'base64',
)
writeFileSync('/tmp/vs-fake-photo.png', png)

const shell = (title: string, body: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { margin: 0; background: #F7F4EF; color: #0A0A0A; font-family: Georgia, "Iowan Old Style", serif; }
  .page { max-width: 960px; margin: 0 auto; padding: 32px 20px 48px; }
  h1 { font-weight: 600; font-size: 32px; margin: 0 0 8px; }
  .kicker { font-family: ui-monospace, monospace; letter-spacing: 0.18em; text-transform: uppercase; font-size: 11px; color: #CE1126; font-weight: 600; }
  .panel { background: #fff; border: 1px solid rgba(10,10,10,0.08); padding: 32px 24px; position: relative; }
  .bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #CE1126 0 33%, #0A0A0A 33% 66%, #007A33 66% 100%); }
  .status { display: flex; gap: 12px; align-items: flex-start; justify-content: center; font-family: system-ui, sans-serif; font-weight: 600; font-size: 15px; max-width: 520px; margin: 0 auto 16px; }
  .spin { width: 16px; height: 16px; margin-top: 3px; border: 2px solid rgba(10,10,10,.15); border-top-color: #0A2548; border-radius: 50%; }
  button, .btn { font-family: system-ui, sans-serif; background: #0A2548; color: #fff; border: 0; padding: 18px 32px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
  .card { background: #fff; border-radius: 12px; padding: 28px 24px; max-width: 560px; margin: 24px auto; box-shadow: 0 24px 64px rgba(10,10,10,.18); font-family: system-ui, sans-serif; }
  .card h2 { font-family: Georgia, serif; font-size: 26px; margin: 0 0 8px; }
  img.preview { width: 160px; height: 120px; object-fit: cover; background: #123; }
  ul { color: #CE1126; }
</style></head><body><div class="page">${body}</div></body></html>`

const preparing = beginUpload(selectUploadFiles(idleUpload(), ['community-fair.jpg'])).session
const uploading = markUploadFile(preparing, 0, 'uploading')
const failed = finishUpload(markUploadFile(preparing, 0, 'failed', 'The library refused this upload for this account. Nothing already in the library was changed.'))
const saved = finishUpload(markUploadFile(markUploadFile(preparing, 0, 'saving'), 0, 'done'))

function uploadPanel(session: ReturnType<typeof beginUpload>['session'], extra = '') {
  const active = session.phase === 'preparing' || session.phase === 'uploading' || session.phase === 'saving'
  return `<div class="kicker">Website</div><h1>Photos &amp; Videos</h1>
    <div class="panel"><div class="bar"></div>
      <div class="status" role="status">${active ? '<span class="spin"></span>' : ''}<span>${uploadStatusText(session)}</span></div>
      ${extra}
    </div></div>`
}

const person = { first_name: 'Amina', last_name: 'Okonkwo' }
const sampleProgram = {
  slug: 'housing-stability',
  name: 'Housing Stability',
  short_name: null,
  is_public: true,
  public_description: 'Help with a place to stay, utilities, and eviction prevention.',
  public_long_description: null,
  who_we_serve: 'Families in Albuquerque who need a stable place to stay.',
  eligibility_criteria: 'Lives in New Mexico and asks VS for help with housing.',
  duration_description: 'As long as the current program year.',
  primary_outcome_domains: ['housing'],
  apply_cta_label: 'Apply Now',
  apply_url: null,
}
function programPage() {
  const sections = programTextSections(sampleProgram).map((section) => `<h3>${section.label}</h3><p>${section.value}</p>`).join('')
  return `<div class="kicker">Programs</div><h1>${sampleProgram.name}</h1>
    <p>Read only. Opening this page does not change the program.</p>
    ${sections}
    <p>Cohort: Spring sample · Meets Tuesdays</p>
    <p>Enrolled: Amina Okonkwo · Active</p>
    <p><a class="btn" href="${applyHref(sampleProgram)}">Apply Now</a>
    <button style="background:#fff;color:#0A2548;border:1px solid #0A2548;text-transform:none;letter-spacing:0">Edit</button></p>`
}
function applyPage(state: 'idle' | 'uploading' | 'error') {
  const status = state === 'uploading'
    ? 'Uploading sample-lease.pdf…'
    : state === 'error'
      ? 'sample-lease.pdf must be a JPG, PNG, or PDF. Nothing else is stored with a request.'
      : 'Applying for Housing Stability'
  return `<div class="card"><p class="kicker">Get Help</p><h2>Tell us what you need</h2>
    <p role="status">${status}</p>
    <p>Applying for: Housing Stability</p>
    <p>Eligibility: Lives in New Mexico and asks VS for help with housing.</p>
    <label>Full name<br><input value="Nia Mensah" style="width:100%;padding:8px"></label>
    <label>Email<br><input value="nia.mensah@example.test" style="width:100%;padding:8px"></label>
    <label>What can we help with?<br><input value="Housing" style="width:100%;padding:8px"></label>
    <label>Tell us more<br><textarea style="width:100%">Need a hotel voucher this week.</textarea></label>
    <label>File<br><input value="sample-lease.pdf" style="width:100%;padding:8px"></label>
    <p><button ${state === 'uploading' ? 'disabled' : ''}>${state === 'uploading' ? 'Sending…' : 'Send request'}</button></p>
    ${state === 'error' ? '<p style="color:#CE1126">Your answers are still here. Nothing was saved.</p>' : ''}
    </div>`
}
const pages: Array<[string, number, number, string]> = [
  ['upload-preparing-laptop.png', 1440, 900, shell('Preparing', uploadPanel(preparing))],
  ['upload-uploading-laptop.png', 1440, 900, shell('Uploading', uploadPanel(uploading))],
  ['upload-failed-laptop.png', 1440, 900, shell('Failed', uploadPanel(failed, `<ul><li>community-fair.jpg: ${failed.files[0].reason}</li></ul><button>Retry failed</button>`))],
  ['upload-saved-laptop.png', 1440, 900, shell('Saved', uploadPanel(saved, `<img class="preview" src="file:///tmp/vs-fake-photo.png" alt=""><p>Saved · community-fair.jpg</p>`))],
  ['delete-participant-laptop.png', 1440, 900, shell('Delete', `<div class="card"><h2>Delete participant</h2>
    <p>This removes <strong>Amina Okonkwo</strong> from the active roster.</p>
    <p>${REMOVAL_SEMANTICS}</p>
    <p>2 case notes will stay on the record.</p>
    <label>Type ${legalName(person)} to confirm<br><input value="Amina Okonkwo" style="width:100%;padding:10px;margin-top:6px"></label>
    <p><button style="background:#fff;color:#CE1126;border:1px solid #CE1126;text-transform:none;letter-spacing:0">Cancel</button>
    <button style="text-transform:none;letter-spacing:0;background:#0A0A0A">Remove ${legalName(person)} from the roster</button></p></div>`)],
  ['wake-listening-laptop.png', 1440, 900, shell('Wake', `<div class="card"><h2>Ask Intelligence</h2>
    <p><button style="background:#0A2548">Wake on</button> <button style="background:#CE1126;border-radius:50%;width:56px;height:56px">🎤</button></p>
    <p role="status">${wakeStarted(EXPECTED_WAKE_PHRASE).message}</p></div>`)],
  ['wake-error-laptop.png', 1440, 900, shell('Wake error', `<div class="card"><h2>Ask Intelligence</h2>
    <p><button style="background:#fff;color:#0A2548;border:1px solid #0A2548">Wake</button></p>
    <p role="status" style="color:#CE1126">${wakeStartFailed('not-allowed').message}</p>
    <p>You can still type your question.</p></div>`)],
  ['upload-pending-mobile.png', 390, 844, shell('Uploading mobile', uploadPanel(uploading))],
  ['upload-error-mobile.png', 390, 844, shell('Upload error mobile', uploadPanel(failed, `<ul><li>community-fair.jpg: ${failed.files[0].reason}</li></ul><button>Retry failed</button>`))],
  ['delete-contact-laptop.png', 1440, 900, shell('Delete contact', `<div class="card"><p class="kicker">Contact</p><h2>Delete contact</h2>
    <p>Delete <strong>Jordan Hale</strong> from the active contact list?</p>
    <p>This takes them off the active list. Their notes, tasks, and files stay. You can restore them afterward.</p>
    <p><button style="background:#fff;color:#CE1126;border:1px solid #CE1126;text-transform:none;letter-spacing:0">Cancel</button>
    <button style="text-transform:none;letter-spacing:0;background:#0A0A0A">Delete Jordan Hale</button></p></div>`)],
  ['delete-contact-mobile.png', 390, 844, shell('Delete contact mobile', `<div class="card"><h2>Delete contact</h2>
    <p>Delete <strong>Jordan Hale</strong> from the active contact list?</p>
    <p>Notes, tasks, and files stay.</p>
    <p><button style="background:#fff;color:#CE1126;border:1px solid #CE1126;text-transform:none;letter-spacing:0;width:100%">Cancel</button></p>
    <p><button style="text-transform:none;letter-spacing:0;background:#0A0A0A;width:100%">Delete Jordan Hale</button></p></div>`)],
  ['restore-contact-laptop.png', 1440, 900, shell('Restore contact', `<div class="card"><h2>Jordan Hale</h2>
    <p>Archived</p>
    <p>Jordan Hale was removed from the active contact list. Notes, tasks, and files were kept. Restore puts them back.</p>
    <p role="status">Jordan Hale was removed from the active contact list. Their notes and files were kept.</p>
    <button style="text-transform:none;letter-spacing:0">Restore</button></div>`)],
  ['restore-contact-mobile.png', 390, 844, shell('Restore contact mobile', `<div class="card"><h2>Jordan Hale</h2>
    <p>Jordan Hale was removed from the active contact list. Notes, tasks, and files were kept.</p>
    <button style="text-transform:none;letter-spacing:0;width:100%">Restore</button></div>`)],
  ['program-readonly-laptop.png', 1440, 900, shell('Program', programPage())],
  ['program-readonly-mobile.png', 390, 844, shell('Program mobile', programPage())],
  ['apply-form-laptop.png', 1440, 900, shell('Apply', applyPage('idle'))],
  ['apply-form-mobile.png', 390, 844, shell('Apply mobile', applyPage('idle'))],
  ['apply-upload-pending-laptop.png', 1440, 900, shell('Apply uploading', applyPage('uploading'))],
  ['apply-upload-error-mobile.png', 390, 844, shell('Apply error', applyPage('error'))],
  ['delete-participant-narrow.png', 390, 844, shell('Delete narrow', `<div class="card"><h2>Delete participant</h2>
    <p>This removes <strong>Amina Okonkwo</strong> from the active roster.</p>
    <p>${REMOVAL_SEMANTICS}</p>
    <label>Type ${legalName(person)} to confirm<br><input value="" placeholder="Amina Okonkwo" style="width:100%;padding:10px;margin-top:6px"></label>
    <p><button style="background:#fff;color:#CE1126;border:1px solid #CE1126;text-transform:none;letter-spacing:0;width:100%">Cancel</button></p>
    <p><button style="text-transform:none;letter-spacing:0;background:#0A0A0A;width:100%">Remove ${legalName(person)} from the roster</button></p></div>`)],
]

function shot(name: string, width: number, height: number, html: string) {
  const file = `/tmp/${name}.html`
  const dest = `${outDir}/${name}`
  writeFileSync(file, html)
  rmSync(dest, { force: true })
  const child = spawn('google-chrome', [
    '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
    `--user-data-dir=/tmp/chrome-shot-${name}`,
    `--window-size=${width},${height}`, `--screenshot=${dest}`, `file://${file}`,
  ], { stdio: 'ignore' })
  const started = Date.now()
  while (Date.now() - started < 15000) {
    try {
      if (statSync(dest).size > 1000) break
    } catch { /* not written yet */ }
    execFileSync('sleep', ['0.2'])
  }
  child.kill('SIGKILL')
  console.log('wrote', dest)
}

for (const [name, width, height, html] of pages) shot(name, width, height, html)
