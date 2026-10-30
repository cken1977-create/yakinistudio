/**
 * Catering funnel settings — Momma Sally's.
 *
 * ✏️  Every value marked PLACEHOLDER is waiting on Nicole. Edit it here; the landing page,
 *     the form and the follow-up emails all read from this file. No code changes needed.
 *
 * Rules: no income claims, no made-up reviews, and no prices on the page until Nicole confirms them
 * (PRICES_CONFIRMED stays false until then).
 */

/** True only while a value below is still a placeholder; shows a small "draft" tag on Preview only. */
export const PLACEHOLDER_TAG = '[PLACEHOLDER]'

/** PLACEHOLDER — the one offer (hook). Nicole picks the wording and the end date. */
export const OFFER = {
  enabled: true,
  headline: '[PLACEHOLDER] Book a catered event for 30+ guests and get a free pan of peach cobbler or banana pudding.',
  es: '[PLACEHOLDER] Reserva un evento de 30+ invitados y llévate una charola de cobbler o pudín de plátano gratis.',
  /** PLACEHOLDER — e.g. 'Book by December 15'. Leave '' to hide the line. */
  endsLine: '[PLACEHOLDER] Offer ends [date].',
}

/** Minimum headcount for catering. Kept at 20 (same as the menu builder) until Nicole says otherwise. */
export const MIN_GUESTS = 20
export const MAX_GUESTS = 2000

/** PLACEHOLDER — how fast Nicole promises to reply with a quote. */
export const REPLY_PROMISE = '[PLACEHOLDER] within 24 hours'
export const REPLY_PROMISE_ES = '[PLACEHOLDER] en menos de 24 horas'

/**
 * Prices. Nothing with a dollar sign is shown on the page while this is false.
 * PLACEHOLDER — Nicole confirms package prices (config/catering.ts) before this flips to true.
 */
export const PRICES_CONFIRMED = false

/** PLACEHOLDER — deposit wording shown in "How it works" and on quotes. '' hides the deposit step. */
export const DEPOSIT_LINE = '[PLACEHOLDER] A [amount or %] deposit holds your date.'
export const DEPOSIT_LINE_ES = '[PLACEHOLDER] Un depósito de [monto o %] aparta tu fecha.'

/** PLACEHOLDER — service area / travel line for the FAQ. */
export const SERVICE_AREA = '[PLACEHOLDER] Abilene and nearby West Texas towns. Travel fee: [Nicole to confirm].'

/** PLACEHOLDER — how far ahead to book (FAQ). */
export const BOOK_AHEAD = '[PLACEHOLDER] At least [2] weeks ahead is best; ask us about short notice.'

/** Allowed source tags for links and QR codes (?src=). Anything else counts as "other". */
export const SOURCES = ['truck', 'facebook', 'google', 'flyer', 'receipt', 'events', 'direct'] as const
export type Source = (typeof SOURCES)[number] | 'other'
export const SOURCE_LABEL: Record<string, string> = {
  truck: 'Truck QR', facebook: 'Facebook', google: 'Google profile', flyer: 'Flyers',
  receipt: 'Receipts', events: 'Events page', direct: 'Direct / typed', other: 'Other',
}
export function cleanSource(raw: string | null | undefined): Source {
  const s = String(raw ?? '').toLowerCase().trim()
  if (!s) return 'direct'
  return (SOURCES as readonly string[]).includes(s) ? (s as Source) : 'other'
}

/** Public links to print / post. These point at the live domain on purpose (for QR codes). */
export const LIVE_BASE = 'https://mamasallys.com'
export const TAGGED_LINKS: { source: Source; where: string }[] = [
  { source: 'truck', where: 'Sticker / sign on the truck window' },
  { source: 'facebook', where: 'Facebook page button + pinned post (facebook.com/mommasally16)' },
  { source: 'google', where: 'Google Business Profile website link + posts' },
  { source: 'flyer', where: 'Flyers and table tents' },
]

export const EVENT_TYPES = [
  { id: 'office', en: 'Office / crew lunch', es: 'Comida de oficina / equipo' },
  { id: 'party', en: 'Birthday / party', es: 'Cumpleaños / fiesta' },
  { id: 'wedding', en: 'Wedding / shower', es: 'Boda / baby shower' },
  { id: 'church', en: 'Church / community', es: 'Iglesia / comunidad' },
  { id: 'other', en: 'Other', es: 'Otro' },
] as const

export const BUDGETS = [
  { id: '', en: 'Not sure yet (optional)', es: 'Aún no sé (opcional)' },
  { id: 'under_500', en: 'Under $500', es: 'Menos de $500' },
  { id: '500_1000', en: '$500 – $1,000', es: '$500 – $1,000' },
  { id: '1000_2500', en: '$1,000 – $2,500', es: '$1,000 – $2,500' },
  { id: '2500_plus', en: '$2,500+', es: '$2,500+' },
  { id: 'not_sure', en: 'Not sure', es: 'No sé' },
] as const

/** Wording shown next to the consent box. Stored with every lead that ticks it. */
export const EMAIL_CONSENT_TEXT =
  "Yes, email me follow-ups about my quote and Momma Sally's catering specials. About 3 emails, unsubscribe anytime."
export const EMAIL_CONSENT_TEXT_ES =
  'Sí, envíenme correos sobre mi cotización y especiales de banquetes de Momma Sally\'s. Unos 3 correos; puedo darme de baja cuando quiera.'

/**
 * Texts are OFF until Nicole has her own registered texting number. When that's done, a separate,
 * unchecked text-consent box can be added here; until then no marketing texts are sent.
 */
export const TEXTS_ENABLED = false

/** Follow-up schedule in days after the request (day 0 = instant confirmation). */
export const FOLLOWUP_DAYS = { day1: 1, day3: 3, day7: 7 } as const
