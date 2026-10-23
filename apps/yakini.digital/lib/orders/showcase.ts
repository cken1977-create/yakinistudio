// What step 2 may say. Status is decided from the live catalog.
// included = catalog state selectable or live, and the customer may tick it.
// soon = catalog state opening_soon (on the product roadmap, no date).
// addon = not live. Sold on top of any plan, at an additional cost. Never described as included.
// setup = done with the customer on the kickoff, not a catalog module.
// Add-on prices are optional. Null means the owner has not set one yet, and the site says "priced with you".
import type { Catalog } from '@/lib/orders/logic'

export type FeatureStatus = 'included' | 'setup' | 'soon' | 'addon'

export type ShowcaseItem = {
  id: string
  name: string
  detail: string
  points: readonly string[]
  /** Catalog feature id, when this row is about one. */
  moduleId: string | null
  /** Rows that are not a catalog module. */
  fixed: 'setup' | 'addon' | null
  /** Null until the owner sets an add-on price. Never invented here. */
  monthlyCents: number | null
  setupCents: number | null
}

export type ShowcaseCategory = {
  id: string
  title: string
  lede?: string
  items: readonly ShowcaseItem[]
}

const item = (
  id: string,
  name: string,
  detail: string,
  points: readonly string[],
  moduleId: string | null,
  fixed: 'setup' | 'addon' | null = null,
  monthlyCents: number | null = null,
  setupCents: number | null = null,
): ShowcaseItem => ({ id, name, detail, points, moduleId, fixed, monthlyCents, setupCents })

const ADDON_DETAIL = 'Not in the system today. We offer this too, at an additional cost, priced with you.'

export const SHOWCASE: readonly ShowcaseCategory[] = [
  {
    id: 'ai',
    title: 'AI that answers and follows up',
    items: [
      item('aiDrafts', 'Drafted replies', 'First drafts of replies and transcripts. Nothing goes out until it is checked.', [
        'Included up to your plan’s monthly cap',
        'We warn you at 80%',
        'You approve every send',
      ], 'aiDrafts'),
      item('aiAnswer', 'An assistant that answers on its own', ADDON_DETAIL, [
        'This does not send messages today',
      ], 'aiAnswer'),
    ],
  },
  {
    id: 'calls',
    title: 'Calls and texting',
    items: [
      item('texting', 'Business texting line', 'Texts to people who opted in, with STOP and HELP handled.', [
        'Registered in your business’s name',
        'Carriers usually take 1 to 4 weeks to approve it',
      ], 'texting'),
      item('missedCall', 'Missed-call text-back', 'Missed calls are logged, and a text-back waits for your OK.', [
        'This needs your business texting line',
        'Part of Grow',
      ], 'missedCall'),
      item('calling-desk', 'A desk for placing and receiving calls', 'Missed-call text-back is the live piece. A full calling desk is an add-on, at an additional cost, priced with you.', [
        'Priced with you',
      ], null, 'addon'),
      item('whatsapp', 'WhatsApp', ADDON_DETAIL, [], 'whatsapp'),
    ],
  },
  {
    id: 'booking',
    title: 'Booking and calendars',
    items: [
      item('booking', 'Online booking you confirm', 'Customers request a time, and you confirm each one.', [], 'booking'),
      item('intakeForm', 'Request form', 'A public form where new customers ask for help.', [], 'intakeForm'),
      item('staff-calendars', 'Staff calendars that stay in sync', ADDON_DETAIL, [], null, 'addon'),
    ],
  },
  {
    id: 'inbox',
    title: 'Customer inbox and CRM',
    items: [
      item('inboundTexts', 'Incoming texts in one place', 'Customer texts land in one thread, instead of your personal phone.', [
        'This needs your business texting line',
      ], 'inboundTexts'),
      item('pipeline', 'A board of customers and deals', ADDON_DETAIL, [], 'pipeline'),
      item('prospecting', 'Prospecting lists', ADDON_DETAIL, [], 'prospecting'),
    ],
  },
  {
    id: 'reviews',
    title: 'Reviews and reputation',
    items: [
      item('reviews', 'Review requests', 'Ask happy customers for a review. You approve each one. Not on yet, and no date is promised.', [], 'reviews'),
      item('reputation', 'Reputation monitoring', ADDON_DETAIL, [], 'reputation'),
      item('social', 'Social posting', ADDON_DETAIL, [], 'social'),
    ],
  },
  {
    id: 'payments',
    title: 'Payments and invoicing',
    items: [
      item('payments', 'Card payments on invoices', 'Card payments on your invoices, through an account in your business’s name. Not on yet, and no date is promised.', [], 'payments'),
      item('quotes', 'Quotes', ADDON_DETAIL, [], 'quotes'),
      item('recurring', 'Recurring invoices', ADDON_DETAIL, [], 'recurring'),
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing and campaigns',
    items: [
      item('campaigns', 'Follow-up campaigns', 'Messages to people who opted in. You approve each one, with quiet hours. Not on yet, and no date is promised.', [], 'campaigns'),
      item('emailMarketing', 'Email campaigns', ADDON_DETAIL, [], 'emailMarketing'),
      item('listings', 'Online listings', ADDON_DETAIL, [], null, 'addon'),
      item('search', 'Being found in search', ADDON_DETAIL, [], null, 'addon'),
      item('automations', 'Workflow automation', ADDON_DETAIL, [], 'automations'),
    ],
  },
  {
    id: 'web',
    title: 'Website, pages and your own domain',
    items: [
      item('domain', 'Your portal on your own domain', 'A Yakini person connects it with you on the kickoff call. We never touch your email.', [
        'We suggest portal.yourbusiness.com so your site and email stay put',
      ], null, 'setup'),
      item('landingPages', 'Pages you edit yourself', ADDON_DETAIL, [], 'landingPages'),
      item('installApp', 'A phone app with your name on it', ADDON_DETAIL, [], 'installApp'),
      item('courses', 'Courses for your customers', ADDON_DETAIL, [], 'courses'),
      item('sending', 'A dedicated sending address for email', ADDON_DETAIL, [], null, 'addon'),
    ],
  },
  {
    id: 'reports',
    title: 'Reporting and the owner dashboard',
    items: [
      item('ownerReport', 'Monthly owner report', 'A plain report from your own records, on screen, printed, or as a spreadsheet.', [
        'Part of Grow',
      ], 'ownerReport'),
      item('adReports', 'Ad reports', ADDON_DETAIL, [], 'adReports'),
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations: we connect to what you already use',
    lede: 'Already have tools you like? Keep them. We connect your system to the payment processor, calendar, accounting, and customer list you already run. Your Yakini operator sets it up with you. If that connection is not in the system today, it is an add-on, at an additional cost, priced with you.',
    items: [
      item('pay-processor', 'The payment processor you already use', 'Not the same as card payments on Yakini invoices, which are not on yet. Connecting the processor you already run is an add-on, at an additional cost, priced with you.', [], null, 'addon'),
      item('accounting', 'Your accounting software', ADDON_DETAIL, [], null, 'addon'),
      item('calendar', 'Your calendar', 'Online booking you confirm is live. Syncing the calendar you already use is an add-on, at an additional cost, priced with you.', [], null, 'addon'),
      item('import-list', 'Your existing customer list', 'Bring in the list you already keep. That import is an add-on, at an additional cost, priced with you.', [], null, 'addon'),
      item('site-links', 'Your website or booking links', 'Your Yakini booking page is live. Connecting links you already publish is an add-on, at an additional cost, priced with you.', [], null, 'addon'),
      item('phone-line', 'Your phone line', 'Missed-call text-back is the live piece. A connection to the phone line you already use is an add-on, at an additional cost, priced with you.', [], null, 'addon'),
      item('email-box', 'Your email', ADDON_DETAIL, [], null, 'addon'),
      item('publicApi', 'Most tools with a connection', ADDON_DETAIL, [], 'publicApi'),
    ],
  },
  {
    id: 'desk',
    title: 'Help desk with a real operator',
    items: [
      item('helpDesk', 'Help desk with a real person', 'Ask for anything. A Yakini person follows it to done.', [], 'helpDesk'),
      item('voiceNotes', 'Voice notes', 'Talk instead of typing. The note stays with the request.', [
        'Transcripts count toward your plan’s monthly cap',
      ], 'voiceNotes'),
      item('team', 'Extra people, each with a login', ADDON_DETAIL, [], 'team'),
      item('software-connection', 'A connection other software can use', ADDON_DETAIL, [], 'publicApi'),
    ],
  },
]

/** Step 2 groups every add-on here, apart from what the plan includes. */
export const ADDON_SECTION = {
  id: 'addons',
  title: 'Add-ons, extra cost',
  lede: 'We offer these too, at an additional cost. They sit on top of any plan. Tick any you want. Your plan total does not change, and each one is priced with you.',
} as const

export function itemStatus(entry: ShowcaseItem, catalog: Catalog): FeatureStatus {
  if (entry.fixed) return entry.fixed
  const feature = catalog.features.find((item) => item.id === entry.moduleId)
  if (!feature) return 'addon'
  if (feature.state === 'selectable' || feature.state === 'live') return 'included'
  if (feature.state === 'opening_soon') return 'soon'
  return 'addon'
}

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  included: 'Included',
  setup: 'Set up with you',
  soon: 'Coming soon',
  addon: 'Add-on, priced with you',
}

function money(cents: number): string {
  const whole = cents % 100 === 0
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })
}

/** Null monthly and setup prices render as "priced with you". Set cents are shown, never added to the plan. */
export function addonPriceText(entry: Pick<ShowcaseItem, 'monthlyCents' | 'setupCents'>): string {
  const parts: string[] = []
  if (entry.monthlyCents != null) parts.push(`${money(entry.monthlyCents)} a month`)
  if (entry.setupCents != null) parts.push(`${money(entry.setupCents)} setup`)
  return parts.length ? parts.join(' · ') : 'priced with you'
}

export function addonRowLabel(entry: Pick<ShowcaseItem, 'monthlyCents' | 'setupCents'>): string {
  const price = addonPriceText(entry)
  return price === 'priced with you' ? 'Add-on, priced with you' : `Add-on, ${price}`
}

export function rowStatusLabel(entry: ShowcaseItem, status: FeatureStatus): string {
  if (status === 'addon') return addonRowLabel(entry)
  return STATUS_LABEL[status]
}

export function addonSummaryHeading(entries: readonly Pick<ShowcaseItem, 'monthlyCents' | 'setupCents'>[]): string {
  const open = entries.every((entry) => addonPriceText(entry) === 'priced with you')
  return open ? 'Add-ons you picked, priced with you on your kickoff call' : 'Add-ons you picked'
}

export function showcaseItems(): ShowcaseItem[] {
  return SHOWCASE.flatMap((category) => [...category.items])
}

export function categoryForItem(id: string): ShowcaseCategory | undefined {
  return SHOWCASE.find((category) => category.items.some((entry) => entry.id === id))
}
