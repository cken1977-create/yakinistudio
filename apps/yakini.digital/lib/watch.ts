// Yakini demo videos for /watch. The video files live in public file storage,
// not in git. To replace one, upload it under a new dated folder and update the
// links here (browsers cache each file for a year).

export const MEDIA_ORIGIN = 'https://ec22ch0piqcoe7i7.public.blob.vercel-storage.com'
const BASE = `${MEDIA_ORIGIN}/yakini/2026-10-25`
// Nov 20 2026 re-record (no prices, no Founding spot counter on screen or in the narration): videos 1-3 and the full
// walkthrough are served from this site (public/watch-media/2026-11-20) instead of the file storage above.
const QUOTE_ONLY = '/watch-media/2026-11-20'

export type Video = {
  id: string // used in links: /watch/y2
  title: string
  sub: string
  device?: 'On a computer' | 'On a phone'
  duration: string
  seconds: number
  src: string
  poster: string
}


const clip = (n: number, title: string, sub: string, device: Video['device'], duration: string, seconds: number): Video => {
  const base = n <= 3 ? QUOTE_ONLY : BASE
  return { id: `y${n}`, title, sub, device, duration, seconds, src: `${base}/yakini-demo-y${n}.mp4`, poster: `${base}/yakini-demo-y${n}-poster.jpg` }
}

export const CLIPS: Video[] = [
  clip(1, 'One place for the whole business', 'A quick look at the portal: client rooms, texts, the help desk and replies together.', 'On a computer', '0:57', 57),
  clip(2, 'Pick a plan', 'The plans side by side, and what each one includes.', 'On a computer', '0:59', 59),
  clip(3, 'Ask for your setup', 'A new owner tells Yakini about the business, and a real person takes it from there.', 'On a computer', '0:39', 39),
  clip(4, 'Ask in your room', 'A customer asks a question in their own room, on a phone.', 'On a phone', '1:02', 62),
  clip(5, 'Help desk with a real person', 'A customer opens a help request and follows its status.', 'On a computer', '0:47', 47),
  clip(6, 'Book a time you confirm', 'A customer picks a time and requests it. You confirm it.', 'On a phone', '0:49', 49),
]

/** The full play-through (Kofi's combined cut): shown on top of /watch and at /watch/full. Set to null to hide it. */
export const FULL: (Video & { chapters: { id: string; at: number }[] }) | null = {
  id: 'full',
  title: 'The Yakini portal, start to finish',
  sub: 'All six short videos in one walkthrough: the portal, a customer room, the help desk, booking, plans and setup.',
  duration: '4:51',
  seconds: 291,
  src: `${QUOTE_ONLY}/yakini-demo-full.mp4`,
  poster: `${QUOTE_ONLY}/yakini-demo-full-card.jpg`,
  // Where each part starts in the full cut (Kofi's order: y1, y4, y5, y6, y2, y3; end card at 4:41.0).
  chapters: [
    { id: 'y1', at: 0 },
    { id: 'y4', at: 51.7 },
    { id: 'y5', at: 108.3 },
    { id: 'y6', at: 150.2 },
    { id: 'y2', at: 194.0 },
    { id: 'y3', at: 247.6 },
  ],
}

/** "Jump to a part" list for the full play-through, with titles filled in. */
export const FULL_CHAPTERS = (FULL?.chapters ?? []).map((c) => {
  const v = CLIPS.find((x) => x.id === c.id)
  const m = Math.floor(c.at / 60), sec = Math.floor(c.at % 60)
  return { id: c.id, at: c.at, title: v?.title ?? c.id, time: `${m}:${String(sec).padStart(2, '0')}` }
})

/** "See what we build" reel(s). The section stays hidden while this is empty. */
export const SHOWCASE: Video[] = []

export const ALL: Video[] = [...(FULL ? [FULL] : []), ...CLIPS, ...SHOWCASE]
export const videoById = (id: string) => ALL.find((v) => v.id === id.toLowerCase())
