// Yakini Academy free class: the settings Clarence is most likely to change.
// Safe to import from client and server code (no secrets here).

export type Lang = 'en' | 'es'

export const CLASS_SLUG = 'build-something-yours'

/** The two invite videos Clarence sent (vertical 1080x1920, served from /public/academy). */
const INVITES = {
  video1: { src: '/academy/invite-video1.mp4', poster: '/academy/invite-video1-poster.jpg', seconds: 37 },
  video2: { src: '/academy/invite-video2.mp4', poster: '/academy/invite-video2-poster.jpg', seconds: 31 },
} as const

// ▼ ONE LINE to swap which invite plays on which page (video1 = Spanish, video2 = English, confirmed Oct 29).
export const INVITE_FOR: Record<Lang, keyof typeof INVITES> = { en: 'video2', es: 'video1' }

export const inviteVideo = (lang: Lang) => INVITES[INVITE_FOR[lang]]

export type ClassVideo = { src: string; poster?: string; minutes: number }

// ▼ ONE LINE per language to publish the class itself (the under-an-hour lesson).
// While a language is null, its replay page shows "class video coming soon", the
// confirmation email says the link will play it once it's live, and no reminders are scheduled.
// Example: en: { src: 'https://…/yakini-academy-class-en.mp4', poster: 'https://…/poster.jpg', minutes: 52 },
export const CLASS_VIDEO: Record<Lang, ClassVideo | null> = { en: null, es: null }

export const classReady = (lang: Lang) => CLASS_VIDEO[lang] !== null

/** Follow-up emails 4–6 (days 2, 4, 7 after watching). OFF until Clarence approves the copy. */
export const FOLLOWUPS_ENABLED = false

/** Workbook link for the soft next step on the replay page. null = not shown. */
export const WORKBOOK_URL: string | null = null

/** Paths for each language. URLs stay yakini.digital/class and /clase. */
export const PATHS = {
  en: { landing: '/class', watch: '/class/watch', unsubscribe: '/class/unsubscribe', privacy: '/privacy' },
  es: { landing: '/clase', watch: '/clase/ver', unsubscribe: '/clase/baja', privacy: '/privacy?lang=es' },
} as const

/** Bio and ad link tags: yakini.digital/class?s=ig etc. */
export const SOURCE_TAGS: Record<string, string> = {
  ig: 'instagram', tt: 'tiktok', fb: 'facebook', yt: 'youtube', x: 'x', li: 'linkedin', ad: 'ad',
}
export const SOURCES = ['instagram', 'tiktok', 'facebook', 'youtube', 'x', 'linkedin', 'ad', 'direct', 'other', 'teachable'] as const
