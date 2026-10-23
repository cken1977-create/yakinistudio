// What step 2 may say. Status is decided from the live catalog.
// included = catalog state selectable or live, and the customer may tick it.
// soon = catalog state opening_soon (on the product roadmap, no date).
// custom = not live. Quoted before any work. Never described as included.
// setup = done with the customer on the kickoff, not a catalog module.
import type { Catalog } from '@/lib/orders/logic'

export type FeatureStatus = 'included' | 'setup' | 'soon' | 'custom'

export type ShowcaseItem = {
  id: string
  name: string
  detail: string
  points: readonly string[]
  /** Catalog feature id, when this row is about one. */
  moduleId: string | null
  /** Rows that are not a catalog module. */
  fixed: 'setup' | 'custom' | null
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
  fixed: 'setup' | 'custom' | null = null,
): ShowcaseItem => ({ id, name, detail, points, moduleId, fixed })

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
      item('aiAnswer', 'An assistant that answers on its own', 'Not in the system today. A Yakini person can scope it, and the price is quoted before any work starts.', [
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
      item('calling-desk', 'A desk for placing and receiving calls', 'Missed-call text-back is the live piece. A full calling desk is not in the system.', [
        'Quoted before any work starts',
      ], null, 'custom'),
      item('whatsapp', 'WhatsApp', 'Not in the system today. Quoted before any work starts.', [], 'whatsapp'),
    ],
  },
  {
    id: 'booking',
    title: 'Booking and calendars',
    items: [
      item('booking', 'Online booking you confirm', 'Customers request a time, and you confirm each one.', [], 'booking'),
      item('intakeForm', 'Request form', 'A public form where new customers ask for help.', [], 'intakeForm'),
      item('staff-calendars', 'Staff calendars that stay in sync', 'Not in the system today. Quoted before any work starts.', [], null, 'custom'),
    ],
  },
  {
    id: 'inbox',
    title: 'Customer inbox and CRM',
    items: [
      item('inboundTexts', 'Incoming texts in one place', 'Customer texts land in one thread, instead of your personal phone.', [
        'This needs your business texting line',
      ], 'inboundTexts'),
      item('pipeline', 'A board of customers and deals', 'Not in the system today. Quoted before any work starts.', [], 'pipeline'),
      item('prospecting', 'Prospecting lists', 'Not in the system today. Quoted before any work starts.', [], 'prospecting'),
    ],
  },
  {
    id: 'reviews',
    title: 'Reviews and reputation',
    items: [
      item('reviews', 'Review requests', 'Ask happy customers for a review. You approve each one. Not on yet, and no date is promised.', [], 'reviews'),
      item('reputation', 'Reputation monitoring', 'Not in the system today. Quoted before any work starts.', [], 'reputation'),
      item('social', 'Social posting', 'Not in the system today. Quoted before any work starts.', [], 'social'),
    ],
  },
  {
    id: 'payments',
    title: 'Payments and invoicing',
    items: [
      item('payments', 'Card payments on invoices', 'Card payments on your invoices, through an account in your business’s name. Not on yet, and no date is promised.', [], 'payments'),
      item('quotes', 'Quotes', 'Not in the system today. Quoted before any work starts.', [], 'quotes'),
      item('recurring', 'Recurring invoices', 'Not in the system today. Quoted before any work starts.', [], 'recurring'),
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing and campaigns',
    items: [
      item('campaigns', 'Follow-up campaigns', 'Messages to people who opted in. You approve each one, with quiet hours. Not on yet, and no date is promised.', [], 'campaigns'),
      item('emailMarketing', 'Email campaigns', 'Not in the system today. Quoted before any work starts.', [], 'emailMarketing'),
      item('listings', 'Online listings', 'Not in the system today. Quoted before any work starts.', [], null, 'custom'),
      item('search', 'Being found in search', 'Not in the system today. Quoted before any work starts.', [], null, 'custom'),
      item('automations', 'Workflow automation', 'Not in the system today. Quoted before any work starts.', [], 'automations'),
    ],
  },
  {
    id: 'web',
    title: 'Website, pages and your own domain',
    items: [
      item('domain', 'Your portal on your own domain', 'A Yakini person connects it with you on the kickoff call. We never touch your email.', [
        'We suggest portal.yourbusiness.com so your site and email stay put',
      ], null, 'setup'),
      item('landingPages', 'Pages you edit yourself', 'Not in the system today. Quoted before any work starts.', [], 'landingPages'),
      item('installApp', 'A phone app with your name on it', 'Not in the system today. Quoted before any work starts.', [], 'installApp'),
      item('courses', 'Courses for your customers', 'Not in the system today. Quoted before any work starts.', [], 'courses'),
      item('sending', 'A dedicated sending address for email', 'Not in the system today. Quoted before any work starts.', [], null, 'custom'),
    ],
  },
  {
    id: 'reports',
    title: 'Reporting and the owner dashboard',
    items: [
      item('ownerReport', 'Monthly owner report', 'A plain report from your own records, on screen, printed, or as a spreadsheet.', [
        'Part of Grow',
      ], 'ownerReport'),
      item('adReports', 'Ad reports', 'Not in the system today. Quoted before any work starts.', [], 'adReports'),
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations: we connect to what you already use',
    lede: 'Already have tools you like? Keep them. We connect your system to the payment processor, calendar, accounting, and customer list you already run. Your Yakini operator sets it up with you. If that connection is not in the system today, it is quoted before any work starts.',
    items: [
      item('pay-processor', 'The payment processor you already use', 'Not the same as card payments on Yakini invoices, which are not on yet. Connecting the processor you already run is not in the system today.', [], null, 'custom'),
      item('accounting', 'Your accounting software', 'Not in the system today. Quoted before any work starts.', [], null, 'custom'),
      item('calendar', 'Your calendar', 'Online booking you confirm is live. Syncing the calendar you already use is not.', [], null, 'custom'),
      item('import-list', 'Your existing customer list', 'Bring in the list you already keep. That import is not in the system today.', [], null, 'custom'),
      item('site-links', 'Your website or booking links', 'Your Yakini booking page is live. Connecting links you already publish is not.', [], null, 'custom'),
      item('phone-line', 'Your phone line', 'Missed-call text-back is the live piece. A connection to the phone line you already use is not in the system today.', [], null, 'custom'),
      item('email-box', 'Your email', 'Not in the system today. Quoted before any work starts.', [], null, 'custom'),
      item('publicApi', 'Most tools with a connection', 'Not in the system today. Quoted before any work starts.', [], 'publicApi'),
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
      item('team', 'Extra people, each with a login', 'Not in the system today. Quoted before any work starts.', [], 'team'),
      item('publicApi', 'A connection other software can use', 'Not in the system today. Quoted before any work starts.', [], 'publicApi'),
    ],
  },
]

export function itemStatus(entry: ShowcaseItem, catalog: Catalog): FeatureStatus {
  if (entry.fixed) return entry.fixed
  const feature = catalog.features.find((item) => item.id === entry.moduleId)
  if (!feature) return 'custom'
  if (feature.state === 'selectable' || feature.state === 'live') return 'included'
  if (feature.state === 'opening_soon') return 'soon'
  return 'custom'
}

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  included: 'Included',
  setup: 'Set up with you',
  soon: 'Coming soon',
  custom: 'Custom build: quoted',
}

export function showcaseItems(): ShowcaseItem[] {
  return SHOWCASE.flatMap((category) => [...category.items])
}
