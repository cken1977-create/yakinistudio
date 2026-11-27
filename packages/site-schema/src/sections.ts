/**
 * Section library props schemas (spec 7.2, Phase 1). One strict zod schema per section type,
 * with its allowed variants. These are the only blocks a page can be built from: the AI, the
 * editor and the renderer all read this file, so a field that is not listed here cannot exist.
 *
 * Content rules shared by every section:
 * - Text is plain text. No HTML is ever stored or rendered from it (React escapes it).
 * - Links are LinkTargets only (https, tel, mailto, in-site). No javascript:, no http:.
 * - Images are ImageRefs (an asset id + alt text). Never raw URLs.
 * - Form fields come from a fixed allow-list that can never ask for passwords, card numbers,
 *   bank details, government ID numbers or one-time codes (spec 14.8 #1).
 */
import { z } from 'zod'

export const Id = z.string().regex(/^[a-z0-9-]{1,40}$/, 'Ids use lowercase letters, numbers and dashes')
export const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Times use 24-hour HH:MM, e.g. 17:30')
export const Day = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
export type Day = z.infer<typeof Day>

export const HexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Colors are stored as 6-digit hex, e.g. #1a2b3c')
export const E164 = z.string().regex(/^\+[1-9]\d{6,14}$/, 'Phone numbers use the +1XXXXXXXXXX format')
export const HttpsUrl = z
  .string()
  .max(2048)
  .refine((v) => {
    try {
      const u = new URL(v)
      return u.protocol === 'https:' && !u.username && !u.password
    } catch { return false }
  }, 'Links must start with https://')

/** Text with no control characters other than newline/tab. */
const text = (min: number, max: number) =>
  // eslint-disable-next-line no-control-regex
  z.string().min(min).max(max).regex(/^[^\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]*$/, 'Text contains characters that are not allowed')

/**
 * Accent phrase (design v2, plan 6.2): a headline may mark ONE phrase as `*phrase*`. The renderer
 * shows it as <em class="ys-accent">; every plain-text use (title, meta, JSON-LD) strips the
 * asterisks with plainText(). A lone or extra asterisk is refused, so what the owner typed is
 * never silently half-styled.
 */
const ACCENT_PAIR = /\*([^*\s](?:[^*\n]*[^*\s])?)\*/
export type AccentParts = { before: string; accent: string; after: string }
/** Splits a headline at its accent phrase, or null when it has none. */
export function splitAccent(s: string): AccentParts | null {
  const m = ACCENT_PAIR.exec(s)
  if (!m) return null
  return { before: s.slice(0, m.index), accent: m[1], after: s.slice(m.index + m[0].length) }
}
/** The headline as plain text: the accent marker removed, the words kept. */
export function plainText(s: string): string {
  const p = splitAccent(s)
  return p ? `${p.before}${p.accent}${p.after}` : s
}
/** True when a headline has no asterisks, or exactly one well-formed `*phrase*`. */
export function validAccent(s: string): boolean {
  const stars = (s.match(/\*/g) ?? []).length
  return stars === 0 || (stars === 2 && splitAccent(s) !== null)
}
const headlineText = (min: number, max: number) =>
  text(min, max).refine(validAccent, 'A headline can mark one phrase as *accent*, with an asterisk on each side')

export const LinkTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('page'), pageId: Id }).strict(),
  z.object({ kind: z.literal('section'), pageId: Id, sectionId: Id }).strict(),
  z.object({ kind: z.literal('url'), url: HttpsUrl }).strict(),
  z.object({ kind: z.literal('tel'), phone: E164 }).strict(),
  z.object({ kind: z.literal('mailto'), email: z.email().max(254) }).strict(),
  z.object({ kind: z.literal('booking') }).strict(),
  z.object({ kind: z.literal('form'), formKey: Id }).strict(),
])
export type LinkTarget = z.infer<typeof LinkTarget>

export const RichText = z
  .array(
    z.object({
      type: z.enum(['p', 'h3', 'ul']),
      children: z
        .array(
          z.object({
            text: text(0, 1500),
            bold: z.boolean().optional(),
            italic: z.boolean().optional(),
            link: LinkTarget.optional(),
          }).strict(),
        )
        .max(50),
    }).strict(),
  )
  .max(40)
export type RichText = z.infer<typeof RichText>

/** Total characters of visible text in a RichText value. */
export function richTextLength(rt: RichText): number {
  let n = 0
  for (const block of rt) for (const c of block.children) n += c.text.length
  return n
}
const richTextMax = (max: number) =>
  RichText.refine((rt) => richTextLength(rt) <= max, `Keep this under ${max} characters`)

export const ImageRef = z.object({
  assetId: z.uuid(),
  alt: text(1, 160),
  focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict().optional(),
}).strict()
export type ImageRef = z.infer<typeof ImageRef>

export const Cta = z.object({ label: text(1, 30), target: LinkTarget }).strict()
export type Cta = z.infer<typeof Cta>

/** Form fields a site form may collect (spec 7.2). Nothing secret can ever be added. */
export const FORM_FIELDS = ['name', 'email', 'phone', 'message', 'event_date', 'guest_count', 'service'] as const
export const FormField = z.enum(FORM_FIELDS)
export type FormField = z.infer<typeof FormField>

const formFields = z
  .array(FormField)
  .min(2)
  .max(FORM_FIELDS.length)
  .refine((f) => new Set(f).size === f.length, 'Each field can appear once')
  .refine((f) => f.includes('email') || f.includes('phone'), 'A form needs an email or phone field so the business can reply')

export const SERVICE_ICONS = ['star', 'truck', 'calendar', 'utensils', 'gift', 'users', 'clock', 'leaf', 'flame', 'heart', 'map-pin', 'phone'] as const

// ------------------------------------------------------------------------- per-type props

export const HeaderProps = z.object({
  showPhone: z.boolean().optional(),
  ctaLabel: text(1, 30).optional(),
}).strict()

export const HeroProps = z.object({
  eyebrow: text(1, 60).optional(),
  headline: headlineText(1, 90),
  subhead: text(1, 200).optional(),
  image: ImageRef.optional(),
  /** Collage variant (D2): up to two more photos, stacked at angles with the main one. */
  images: z.array(ImageRef).max(2).optional(),
  primaryCta: Cta.optional(),
  secondaryCta: Cta.optional(),
}).strict()

export const AboutProps = z.object({
  heading: headlineText(1, 80),
  body: richTextMax(1500),
  image: ImageRef.optional(),
  /** Chapters variant (D2): one line from the story, set large. The owner's words only. */
  pullQuote: text(1, 200).optional(),
}).strict()

export const ServicesProps = z.object({
  heading: headlineText(1, 80),
  intro: text(1, 300).optional(),
  items: z.array(z.object({
    title: text(1, 80),
    body: text(1, 300).optional(),
    price: text(1, 20).optional(),
    icon: z.enum(SERVICE_ICONS).optional(),
  }).strict()).max(12),
}).strict()

export const MENU_TAGS = ['veg', 'spicy', 'gf'] as const
export const MenuProps = z.object({
  heading: headlineText(1, 80),
  intro: text(1, 300).optional(),
  categories: z.array(z.object({
    name: text(1, 60),
    items: z.array(z.object({
      name: text(1, 80),
      description: text(1, 240).optional(),
      price: text(1, 20).optional(),
      tags: z.array(z.enum(MENU_TAGS)).max(3).optional(),
      image: ImageRef.optional(),
    }).strict()).max(40),
  }).strict()).max(12),
  note: text(1, 300).optional(),
}).strict()

export const ScheduleProps = z.object({
  heading: headlineText(1, 80),
  intro: text(1, 300).optional(),
  stops: z.array(z.object({
    day: Day,
    start: HHMM,
    end: HHMM,
    place: text(1, 80),
    address: text(1, 160).optional(),
  }).strict().refine((s) => s.end > s.start, 'A stop has to end after it starts')).max(21),
}).strict()

export const GalleryProps = z.object({
  heading: headlineText(1, 80).optional(),
  images: z.array(ImageRef).max(24),
}).strict()

export const HoursLocationProps = z.object({
  heading: headlineText(1, 80),
  directionsUrl: HttpsUrl.optional(),
  note: text(1, 200).optional(),
}).strict()

export const TestimonialsProps = z.object({
  heading: headlineText(1, 80).optional(),
  items: z.array(z.object({
    quote: text(1, 400),
    name: text(1, 60),
    source: text(1, 60).optional(),
  }).strict()).max(12),
}).strict()

export const FaqProps = z.object({
  heading: headlineText(1, 80).optional(),
  items: z.array(z.object({ q: text(1, 160), a: richTextMax(800) }).strict()).max(20),
}).strict()

export const TeamProps = z.object({
  heading: headlineText(1, 80).optional(),
  members: z.array(z.object({
    name: text(1, 60),
    role: text(1, 60).optional(),
    photo: ImageRef.optional(),
    bio: text(1, 300).optional(),
  }).strict()).max(12),
}).strict()

export const CtaBandProps = z.object({
  headline: headlineText(1, 90),
  body: text(1, 200).optional(),
  cta: Cta,
  /** Image variant (D2): full-bleed photo behind the band. */
  image: ImageRef.optional(),
}).strict()

export const ContactFormProps = z.object({
  heading: headlineText(1, 80),
  intro: text(1, 200).optional(),
  formKey: Id,
  fields: formFields,
  submitLabel: text(1, 30),
  consentText: text(1, 300),
}).strict()

export const BookingProps = z.object({
  heading: headlineText(1, 80),
  body: text(1, 300).optional(),
  mode: z.enum(['link', 'request']),
  buttonLabel: text(1, 30).optional(),
}).strict()

export const CateringRequestProps = ContactFormProps

export const TodayProps = z.object({
  heading: headlineText(1, 60).optional(),
  emptyBehavior: z.enum(['hide', 'show-text']),
  emptyText: text(1, 140).optional(),
}).strict()

export const FooterProps = z.object({}).strict()

/**
 * Ticker (D2): 3 to 8 short phrases (services, neighborhoods) that scroll by. Owner-entered or the
 * site's own service names; read as a plain list when motion is off.
 */
export const TickerProps = z.object({
  label: text(1, 60).optional(),
  items: z.array(text(1, 40)).min(3).max(8),
}).strict()

/**
 * Stats (D2): 2 to 4 numbers with labels ("12 years on Mesa St"). Owner-entered facts only: the AI
 * may never create or change them (the generate pipeline drops any it sends).
 */
export const StatsProps = z.object({
  heading: headlineText(1, 80).optional(),
  items: z.array(z.object({ value: text(1, 12), label: text(1, 60) }).strict()).max(4),
}).strict()

/** Feature rows (D2): 2 to 4 alternating image/text rows with numbered labels. */
export const FeatureRowsProps = z.object({
  heading: headlineText(1, 80).optional(),
  items: z.array(z.object({
    title: headlineText(1, 80),
    body: text(1, 400),
    label: text(1, 40).optional(),
    image: ImageRef.optional(),
  }).strict()).max(4),
}).strict()

/** Every section type, its props schema and its variants. Order is the library order. */
export const SECTION_DEFS = {
  header: { props: HeaderProps, variants: ['bar', 'centered'] },
  hero: { props: HeroProps, variants: ['split', 'fullbleed', 'minimal', 'cinematic', 'editorial-split', 'collage'] },
  about: { props: AboutProps, variants: ['left-image', 'right-image', 'text-only', 'chapters'] },
  services: { props: ServicesProps, variants: ['cards', 'list'] },
  menu: { props: MenuProps, variants: ['columns', 'cards', 'editorial'] },
  schedule: { props: ScheduleProps, variants: ['list', 'week'] },
  gallery: { props: GalleryProps, variants: ['grid', 'masonry', 'mosaic', 'filmstrip'] },
  hours_location: { props: HoursLocationProps, variants: ['split', 'card'] },
  testimonials: { props: TestimonialsProps, variants: ['cards', 'single', 'big-quote'] },
  faq: { props: FaqProps, variants: ['accordion'] },
  team: { props: TeamProps, variants: ['grid'] },
  cta_band: { props: CtaBandProps, variants: ['solid', 'outline', 'image'] },
  contact_form: { props: ContactFormProps, variants: ['simple', 'with-details'] },
  booking: { props: BookingProps, variants: ['card'] },
  catering_request: { props: CateringRequestProps, variants: ['simple'] },
  today: { props: TodayProps, variants: ['banner', 'card'] },
  footer: { props: FooterProps, variants: ['simple', 'statement'] },
  ticker: { props: TickerProps, variants: ['marquee'] },
  stats: { props: StatsProps, variants: ['band'] },
  feature_rows: { props: FeatureRowsProps, variants: ['alternating'] },
} as const

export type SectionDefs = typeof SECTION_DEFS
export const SECTION_TYPES = Object.keys(SECTION_DEFS) as (keyof SectionDefs)[]
export const SectionType = z.enum(SECTION_TYPES as [keyof SectionDefs, ...(keyof SectionDefs)[]])
export type SectionType = keyof SectionDefs
export type SectionVariant<T extends SectionType> = SectionDefs[T]['variants'][number]
export type SectionProps<T extends SectionType> = z.infer<SectionDefs[T]['props']>

export function sectionVariants(type: SectionType): readonly string[] {
  return SECTION_DEFS[type].variants
}

function sectionSchema<const T extends SectionType, P extends z.ZodType, const V extends readonly [string, ...string[]]>(type: T, def: { props: P; variants: V }) {
  return z.object({
    id: Id,
    type: z.literal(type),
    variant: z.enum(def.variants),
    hidden: z.boolean(),
    props: def.props,
  }).strict()
}

const D = SECTION_DEFS
export const Section = z.discriminatedUnion('type', [
  sectionSchema('header', D.header), sectionSchema('hero', D.hero), sectionSchema('about', D.about),
  sectionSchema('services', D.services), sectionSchema('menu', D.menu), sectionSchema('schedule', D.schedule),
  sectionSchema('gallery', D.gallery), sectionSchema('hours_location', D.hours_location),
  sectionSchema('testimonials', D.testimonials), sectionSchema('faq', D.faq), sectionSchema('team', D.team),
  sectionSchema('cta_band', D.cta_band), sectionSchema('contact_form', D.contact_form),
  sectionSchema('booking', D.booking), sectionSchema('catering_request', D.catering_request),
  sectionSchema('today', D.today), sectionSchema('footer', D.footer),
  sectionSchema('ticker', D.ticker), sectionSchema('stats', D.stats), sectionSchema('feature_rows', D.feature_rows),
])
export type Section = z.infer<typeof Section>
/** A section narrowed to one type, e.g. SectionOf<'hero'>. */
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>
