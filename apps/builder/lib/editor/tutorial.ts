import { TUTORIAL_STEP_TITLES } from '@yakini/ai/prompts/helper'

/**
 * The 8-step tutorial (spec 10.9, R13), shared by the guided tour in the editor and the written
 * tutorial page. Each step points at a real part of the editor (by `data-tour` or a stable
 * selector), with words for computers and for phones where they differ.
 */
export type TourStep = {
  id: 'pages' | 'text' | 'photo' | 'sections' | 'chat' | 'phone' | 'publish' | 'domain'
  title: string
  body: string
  phoneBody?: string
  /** Where to point, tried in order; the first visible one wins. None: a centered card. */
  targets: { desktop: string[]; phone: string[] }
  /** Something the editor does first so the target exists (select a section, open a tab). */
  prepare?: 'select-first-section' | 'show-chat' | 'clear'
}

const [pages, text, photo, sections, chat, phone, publish, domain] = TUTORIAL_STEP_TITLES

export const TOUR_STEPS: readonly TourStep[] = [
  { id: 'pages', title: pages, body: 'All your pages are listed here. Open one, rename it, move it, or add one of your kit’s pages. Business info (phone, address, hours) is at the bottom.', phoneBody: 'Tap Pages to see all your pages, rename or add one, and change your business info.', targets: { desktop: ['[data-tour="pages"]'], phone: ['[data-tour="pages-phone"]'] }, prepare: 'clear' },
  { id: 'text', title: text, body: 'Tap any part of the page to change it. Its words open on the right, with a counter so you know what fits. Changes save on their own.', phoneBody: 'Tap any part of the page to change it. Its words open in a sheet at the bottom. Changes save on their own.', targets: { desktop: ['#ys-main [data-ys-section]'], phone: ['#ys-main [data-ys-section]'] }, prepare: 'clear' },
  { id: 'photo', title: photo, body: 'Tap a section with a photo, then Change photo. Use one of yours, a kit photo, or upload one, and describe it in a few words.', targets: { desktop: ['#ys-main [data-ys-section] img', '#ys-main [data-ys-section]'], phone: ['#ys-main [data-ys-section] img', '#ys-main [data-ys-section]'] }, prepare: 'clear' },
  { id: 'sections', title: sections, body: 'With a section picked, use the arrows to move it, Hide to take it off the page for now, Duplicate, Delete, or Style for another look.', targets: { desktop: ['[data-inspector-section] [role="toolbar"]'], phone: ['[data-inspector-section] [role="toolbar"]'] }, prepare: 'select-first-section' },
  { id: 'chat', title: chat, body: 'Or just say what you want, like “Add our Saturday hours 10 to 4.” You’ll see the change outlined first, then tap Apply.', phoneBody: 'Tap Chat and say what you want, like “Add our Saturday hours 10 to 4.” You’ll see the change first, then tap Apply.', targets: { desktop: ['[data-tour="chat"]'], phone: ['[data-tour="chat-phone"]'] }, prepare: 'clear' },
  { id: 'phone', title: phone, body: 'Switch to Phone to see how most of your customers will see your site. Preview opens the whole site in a new tab.', phoneBody: 'You’re already seeing the phone view. To see the whole site full screen, tap Publish, then Preview the site.', targets: { desktop: ['[data-tour="view"]'], phone: ['[data-tour="publish-phone"]'] }, prepare: 'clear' },
  { id: 'publish', title: publish, body: 'When you’re ready, Publish runs a quick check and puts your site live at its own address. Until you publish, your draft stays private, and later edits stay private until you publish again.', targets: { desktop: ['[data-tour="publish"]'], phone: ['[data-tour="publish-phone"]'] }, prepare: 'clear' },
  { id: 'domain', title: domain, body: 'Messages from your site’s forms come to you by email and are kept under Messages. Connecting your own domain and your Yakini portal open soon. The Help tab has this tutorial any time.', targets: { desktop: [], phone: [] }, prepare: 'clear' },
]

export const TOUR_IDS = TOUR_STEPS.map((s) => s.id)
export const TOUR_SKIPPED = 'skipped'

/** Where a returning owner picks the tour up: the first step not done, or nowhere if done/skipped. */
export function tourStart(done: readonly string[]): number | null {
  if (done.includes(TOUR_SKIPPED)) return null
  const i = TOUR_STEPS.findIndex((s) => !done.includes(s.id))
  return i === -1 ? null : i
}
