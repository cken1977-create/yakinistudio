// Yakini demo videos for /watch. The video files live in public file storage,
// not in git. To replace one, upload it under a new dated folder and update the
// links here (browsers cache each file for a year).

export const MEDIA_ORIGIN = 'https://ec22ch0piqcoe7i7.public.blob.vercel-storage.com'
const BASE = `${MEDIA_ORIGIN}/yakini/2026-10-25`

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

/** The full play-through. Leave null until it is uploaded; the page adds it on top automatically. */
export const FULL: (Video & { chapters: { id: string; at: number }[] }) | null = null

const clip = (n: number, title: string, sub: string, device: Video['device'], duration: string, seconds: number): Video => ({
  id: `y${n}`, title, sub, device, duration, seconds,
  src: `${BASE}/yakini-demo-y${n}.mp4`,
  poster: `${BASE}/yakini-demo-y${n}-poster.jpg`,
})

export const CLIPS: Video[] = [
  clip(1, 'One place for the whole business', 'A quick look at the portal: clients, texts, payments and replies together.', 'On a computer', '1:06', 66),
  clip(2, 'Pick a plan', 'The plans side by side, with flat prices in the open.', 'On a computer', '1:16', 76),
  clip(3, 'Ask for your setup', 'A new owner tells Yakini about the business, and a real person takes it from there.', 'On a computer', '0:44', 44),
  clip(4, 'Ask in your room', 'A customer asks a question in their own room, on a phone.', 'On a phone', '1:02', 62),
  clip(5, 'Help desk with a real person', 'A customer opens a help request and follows its status.', 'On a computer', '0:47', 47),
  clip(6, 'Book a time you confirm', 'A customer picks a time and requests it. You confirm it.', 'On a phone', '0:49', 49),
]

/** "See what we build" reel(s). The section stays hidden while this is empty. */
export const SHOWCASE: Video[] = []

export const ALL: Video[] = [...(FULL ? [FULL] : []), ...CLIPS, ...SHOWCASE]
export const videoById = (id: string) => ALL.find((v) => v.id === id.toLowerCase())
