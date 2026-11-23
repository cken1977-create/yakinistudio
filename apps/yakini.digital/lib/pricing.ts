// Yakini launch pricing, locked November 22, 2026 (Clarence Kennedy).
// Public headline: "Setup from $299. Monthly plans from $149."
// Customer-facing copy names services (hosting, database, texting line, payments), never the companies behind them.
// Founding, Operate, and Grow are superseded and must not be offered.

/** The portal. Previews point this at the portal Preview with NEXT_PUBLIC_PORTAL_URL. */
export const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.yakini.digital').replace(/\/$/, '')
export const START_URL = `${PORTAL_URL}/start`
export const FOUNDING_API = `${PORTAL_URL}/api/kit/founding`
/** Customer portal sign-in, linked from the site header on every page. */
export const PORTAL_LOGIN_URL = `${PORTAL_URL}/enter`

/** Public buying path: the pricing build picker, not the older portal sign-up offers. */
export const BUILD_URL = '/pricing#build'
export const QUOTE_URL = BUILD_URL
export const QUOTE_CTA = 'Get my quote'
export const QUOTE_NOTE = 'Totals on this page are estimates. The written quote is final.'

export function startUrl(_planId?: string): string {
  return BUILD_URL
}

export const HEADLINE = 'Setup from $299. Monthly plans from $149.'
export const PITCH_HEAD = 'A real person sets it up with you. And stays.'
export const PITCH =
  'Build a kit for your business, add the services you want, and send it for a written quote. A real Yakini person sets everything up with you, then stays after go-live, with a help desk you can reach any time.'

export const REFUND_RULE =
  'The setup fee is refundable in full until your kickoff call or 14 days after you sign up, whichever comes first. After that it is non-refundable.'

export const BILLING_NOTE =
  'No card is taken on this page. You send your build, a real Yakini person confirms the setup level in a written quote, and your monthly plan starts at go-live. Any setup can be split into three payments.'

export const EXTRA_HELP_NOTE =
  'Need more help than your plan includes? Approved extra work is $125 an hour.'

export const HELP_HOURS_NOTE =
  'Included help time is for that month only: unused time does not roll over and expires at the end of each month.'

export const AI_LIMIT_NOTE =
  'Drafted replies and voice transcripts have a courtesy monthly cap on every plan. We will warn you at 80%, and nothing goes out without your OK. Usage over the cap is billed at cost plus 15%.'

export const FLAT_PRICING_NOTE = 'Your price is set in writing before anything starts. Yakini never takes a share of your revenue.'

export const PASS_THROUGH_NOTE =
  'Your hosting, database, email, texting line and payment processing are set up in your business’s name, so everything stays yours. Those services bill you directly at their own cost; they are not part of Yakini’s price. Expected provider costs are shown on your written quote.'

export const ANNUAL_NOTE = 'Pay for 11 months and get 12, on recurring Yakini fees.'

export const DASHBOARD_NOTE =
  'Every kit’s monthly price includes the owner and staff dashboard, the customer portal, and the working tools listed below. A customer-facing website is a separate service, unless you already have a site and only need it linked.'

export const TUTORIAL_NOTE = 'A hands-on practice tutorial is included with every working kit.'

export const GUIDED_STEPS = [
  { title: 'Build your estimate and send it for a quote', detail: 'Pick a kit, a size, a setup level, and any add-ons. No card is taken today. A real Yakini person reviews it and sends a written quote before anything starts.' },
  { title: 'Kickoff call with your Yakini person', detail: 'About 30 minutes. We learn how your business runs today and agree the first thing to fix.' },
  { title: 'We set it up with you', detail: 'Your dashboard, customer portal and the tools on your plan, in your business’s name. You approve each step. The first practice tutorial is included when that kit already has one.' },
  { title: 'Go live, and we stay', detail: 'Your monthly plan starts. Your Yakini person stays on, and the help desk is always open.' },
] as const

export const KIT_INCLUDES = [
  'Owner and staff dashboard, in your brand',
  'Customer portal and online booking you confirm',
  'Business texting, drafted replies, and a help desk with a real person',
  'Invoice payments, missed-call text-back, review requests, follow-up campaigns, and a monthly owner report',
  'A hands-on practice tutorial, when that kit already has one',
] as const

export type SizeId = 'small' | 'growing' | 'larger'
export type SetupId = 'quick' | 'standard' | 'advanced' | 'custom'

export type KitId =
  | 'food-truck'
  | 'landlord'
  | 'real-estate'
  | 'restaurant'
  | 'tree-lawn'
  | 'nonprofit'
  | 'training-school'
  | 'trucking'
  | 'oilfield'
  | 'specialized'
  | 'cannabis'
  | 'home-healthcare'
  | 'reentry'

export type PriceKind = 'fixed' | 'from' | 'quote' | 'usage' | 'pass-through' | 'included'

export type Money = { amount: number; kind: PriceKind }

export const SIZES: readonly { id: SizeId; name: string; seats: number; locations: number; help: string; texts: number; aiCap: number }[] = [
  { id: 'small', name: 'Small', seats: 3, locations: 1, help: '30 minutes', texts: 500, aiCap: 5 },
  { id: 'growing', name: 'Growing', seats: 8, locations: 1, help: '1 hour', texts: 1500, aiCap: 15 },
  { id: 'larger', name: 'Larger', seats: 15, locations: 2, help: '2 hours', texts: 3000, aiCap: 25 },
]

export const SETUPS: readonly { id: SetupId; name: string; price: Money; hours: string; summary: string }[] = [
  { id: 'quick', name: 'Quick Start', price: { amount: 299, kind: 'fixed' }, hours: 'Up to 3 hours', summary: 'An existing kit set up with your info, when the work fits in three hours or less.' },
  { id: 'standard', name: 'Standard', price: { amount: 750, kind: 'fixed' }, hours: 'About 6 hours', summary: 'Full setup, owner training, and the hands-on practice tutorial.' },
  { id: 'advanced', name: 'Advanced', price: { amount: 1500, kind: 'fixed' }, hours: 'About 12 hours', summary: 'More workflows, data imports, and team training.' },
  { id: 'custom', name: 'Custom kit setup', price: { amount: 2500, kind: 'from' }, hours: 'From 20 hours', summary: 'Multiple locations or connections to other systems, quoted by scope.' },
]

type Capacity = Record<SizeId, string>

export type Kit = {
  id: KitId
  name: string
  group: 'A' | 'B' | 'C' | 'quote'
  monthly: Record<SizeId, Money>
  capacity: Capacity
  ready: boolean
}

export const KITS: readonly Kit[] = [
  { id: 'food-truck', name: 'Food truck', group: 'A', monthly: { small: { amount: 149, kind: 'fixed' }, growing: { amount: 299, kind: 'fixed' }, larger: { amount: 549, kind: 'fixed' } }, capacity: { small: '1 truck, 1 menu', growing: 'Up to 3 trucks, same brand', larger: 'Up to 6 trucks' }, ready: true },
  { id: 'landlord', name: 'Landlord', group: 'A', monthly: { small: { amount: 149, kind: 'fixed' }, growing: { amount: 299, kind: 'fixed' }, larger: { amount: 549, kind: 'fixed' } }, capacity: { small: 'Up to 10 units', growing: 'Up to 25 units', larger: 'Up to 50 units' }, ready: true },
  { id: 'real-estate', name: 'Real estate', group: 'A', monthly: { small: { amount: 149, kind: 'fixed' }, growing: { amount: 299, kind: 'fixed' }, larger: { amount: 549, kind: 'fixed' } }, capacity: { small: '1 agent', growing: 'Up to 5 agents', larger: 'Up to 12 agents' }, ready: true },
  { id: 'restaurant', name: 'Restaurant', group: 'B', monthly: { small: { amount: 199, kind: 'fixed' }, growing: { amount: 399, kind: 'fixed' }, larger: { amount: 799, kind: 'fixed' } }, capacity: { small: '1 location', growing: '1 higher-volume location', larger: 'Up to 2 locations' }, ready: true },
  { id: 'tree-lawn', name: 'Tree and lawn', group: 'B', monthly: { small: { amount: 199, kind: 'fixed' }, growing: { amount: 399, kind: 'fixed' }, larger: { amount: 799, kind: 'fixed' } }, capacity: { small: '1 crew', growing: 'Up to 3 crews', larger: 'Up to 6 crews' }, ready: true },
  { id: 'nonprofit', name: 'Nonprofit', group: 'B', monthly: { small: { amount: 199, kind: 'fixed' }, growing: { amount: 399, kind: 'fixed' }, larger: { amount: 799, kind: 'fixed' } }, capacity: { small: '1 program', growing: 'Up to 3 programs', larger: 'Up to 6 programs' }, ready: true },
  { id: 'training-school', name: 'Training school', group: 'B', monthly: { small: { amount: 199, kind: 'fixed' }, growing: { amount: 399, kind: 'fixed' }, larger: { amount: 799, kind: 'fixed' } }, capacity: { small: 'Up to 50 active students', growing: 'Up to 150 students', larger: 'Up to 400 students' }, ready: true },
  { id: 'trucking', name: 'Trucking', group: 'C', monthly: { small: { amount: 299, kind: 'fixed' }, growing: { amount: 599, kind: 'fixed' }, larger: { amount: 1199, kind: 'fixed' } }, capacity: { small: 'Up to 3 trucks, 1 dispatcher', growing: 'Up to 10 trucks', larger: 'Up to 25 trucks' }, ready: true },
  { id: 'oilfield', name: 'Oilfield', group: 'C', monthly: { small: { amount: 299, kind: 'fixed' }, growing: { amount: 599, kind: 'fixed' }, larger: { amount: 1199, kind: 'fixed' } }, capacity: { small: '1 field crew', growing: 'Up to 3 crews', larger: 'Up to 6 crews' }, ready: true },
  { id: 'specialized', name: 'Specialized operations', group: 'C', monthly: { small: { amount: 299, kind: 'fixed' }, growing: { amount: 599, kind: 'fixed' }, larger: { amount: 1199, kind: 'fixed' } }, capacity: { small: '1 operation or crew', growing: 'Up to 3 crews', larger: 'Up to 6 crews' }, ready: true },
  { id: 'cannabis', name: 'Cannabis', group: 'quote', monthly: { small: { amount: 0, kind: 'quote' }, growing: { amount: 0, kind: 'quote' }, larger: { amount: 0, kind: 'quote' } }, capacity: { small: 'Quoted', growing: 'Quoted', larger: 'Quoted' }, ready: true },
  { id: 'home-healthcare', name: 'Home healthcare', group: 'quote', monthly: { small: { amount: 0, kind: 'quote' }, growing: { amount: 0, kind: 'quote' }, larger: { amount: 0, kind: 'quote' } }, capacity: { small: 'Quoted once the kit is built', growing: 'Quoted once the kit is built', larger: 'Quoted once the kit is built' }, ready: false },
  { id: 'reentry', name: 'Reentry', group: 'quote', monthly: { small: { amount: 0, kind: 'quote' }, growing: { amount: 0, kind: 'quote' }, larger: { amount: 0, kind: 'quote' } }, capacity: { small: 'Quoted once the kit is built', growing: 'Quoted once the kit is built', larger: 'Quoted once the kit is built' }, ready: false },
]

export type CatalogItem = {
  id: string
  name: string
  group: 'website' | 'addon' | 'service' | 'academy' | 'marketing'
  once?: Money
  monthly?: Money
  summary: string
  picker?: boolean
}

export const CATALOG: readonly CatalogItem[] = [
  { id: 'website-simple', name: 'Simple branded website', group: 'website', once: { amount: 499, kind: 'fixed' }, monthly: { amount: 79, kind: 'fixed' }, summary: 'Up to 5 pages, mobile-ready, in your brand, with 30 minutes of content edits each month. Hosting is in your name and billed by the provider. Skip this if you already have a site and only need it linked.', picker: true },
  { id: 'website-custom', name: 'Full custom website', group: 'website', once: { amount: 4000, kind: 'from' }, monthly: { amount: 149, kind: 'from' }, summary: 'A custom public site, quoted by scope. Monthly care is quoted after launch, often from $149.', picker: true },
  { id: 'ordering', name: 'Online ordering and pay-ahead', group: 'addon', once: { amount: 199, kind: 'fixed' }, monthly: { amount: 49, kind: 'fixed' }, summary: 'Menu, order flow, and pay-ahead checkout on your own payment account.', picker: true },
  { id: 'receptionist', name: 'Phone receptionist', group: 'addon', once: { amount: 299, kind: 'fixed' }, monthly: { amount: 99, kind: 'fixed' }, summary: 'Answers calls with your greeting and hours, takes messages, and transfers to a person. Voice minutes are billed at cost plus 15%.', picker: true },
  { id: 'course-portal', name: 'Course and learning portal', group: 'addon', once: { amount: 399, kind: 'fixed' }, monthly: { amount: 49, kind: 'fixed' }, summary: 'Student login, lessons, progress, and class lists.', picker: true },
  { id: 'ai-tutor', name: 'Guided tutor or assistant', group: 'addon', once: { amount: 200, kind: 'fixed' }, monthly: { amount: 49, kind: 'fixed' }, summary: 'A guided assistant inside the course portal. Usage is billed at cost plus 15%. Requires the course portal.', picker: true },
  { id: 'ecommerce', name: 'E-commerce store, simple catalog', group: 'addon', once: { amount: 499, kind: 'fixed' }, monthly: { amount: 99, kind: 'fixed' }, summary: 'A small catalog and checkout on your payment account. Larger stores are quoted.', picker: true },
  { id: 'social-schedule', name: 'Social posting, schedule only', group: 'marketing', monthly: { amount: 99, kind: 'fixed' }, summary: 'Up to four posts a month scheduled from posts you supply, with your approval.', picker: true },
  { id: 'social-created', name: 'Social posting, four created posts', group: 'marketing', monthly: { amount: 199, kind: 'fixed' }, summary: 'We draft four posts a month, one revision round, your approval, then scheduling.', picker: true },
  { id: 'business-setup', name: 'Business Setup package', group: 'service', once: { amount: 795, kind: 'fixed' }, summary: 'One single-state limited-liability company: formation and tax ID guidance, a domain, one mailbox, one business number, and an owner’s binder. State and partner fees are paid by you, on your own card.', picker: true },
  { id: 'domain-email', name: 'Custom domain and business email', group: 'addon', once: { amount: 99, kind: 'fixed' }, monthly: { amount: 0, kind: 'pass-through' }, summary: 'Register or connect a domain, set up email, and create one mailbox. You pay the domain and email providers directly. Skip this if it is already in Business Setup.', picker: true },
  { id: 'multi-location', name: 'Extra location', group: 'addon', once: { amount: 125, kind: 'fixed' }, monthly: { amount: 49, kind: 'fixed' }, summary: 'Another location on the same system, past the number included in your size.', picker: true },
  { id: 'data-migration', name: 'Data migration', group: 'addon', once: { amount: 125, kind: 'from' }, summary: 'Import of customers, jobs, or files, billed at $125 an hour. A clean spreadsheet is usually 1–3 hours.', picker: true },
  { id: 'extra-seat', name: 'Extra staff seat', group: 'addon', monthly: { amount: 15, kind: 'fixed' }, summary: 'Each additional staff login past the seats included in your size.', picker: true },
  { id: 'avatar-video', name: 'Welcome video', group: 'marketing', once: { amount: 149, kind: 'fixed' }, summary: 'One 60–90 second branded welcome video. Additional videos are $99 each.', picker: true },
  { id: 'listing-setup', name: 'Business listing profile setup', group: 'addon', once: { amount: 99, kind: 'fixed' }, summary: 'Set up or claim your public map and search listing and link it to review requests.', picker: true },
  { id: 'qr-menu', name: 'QR menu and print-ready codes', group: 'addon', once: { amount: 49, kind: 'fixed' }, summary: 'QR codes linking to your menu, booking, or ordering page, ready to print.', picker: true },
  { id: 'second-processor', name: 'Second payment processor', group: 'addon', once: { amount: 200, kind: 'fixed' }, summary: 'Connect an additional processor. You pay processing fees directly.', picker: true },
  { id: 'number-port', name: 'Phone number porting', group: 'addon', once: { amount: 125, kind: 'fixed' }, summary: 'Move an existing business number onto the texting line, plus any carrier charges.', picker: true },
  { id: 'extra-number', name: 'Additional texting number', group: 'addon', once: { amount: 50, kind: 'fixed' }, monthly: { amount: 0, kind: 'pass-through' }, summary: 'A second number. You pay the number fee (about $1.15 a month).', picker: true },
  { id: 'accounting-sync', name: 'Accounting sync', group: 'addon', once: { amount: 125, kind: 'from' }, summary: 'Send invoices and payments to your accounting software, billed at $125 an hour. Often 3–5 hours if a connector already exists.', picker: true },
  { id: 'compliance', name: 'Compliance and credential tracking', group: 'addon', once: { amount: 399, kind: 'fixed' }, monthly: { amount: 49, kind: 'fixed' }, summary: 'Credential and expiry tracking, with a check so an unqualified person is not put on a job.', picker: true },
  { id: 'app-stores', name: 'App store listings', group: 'addon', once: { amount: 125, kind: 'from' }, summary: 'Publish the installable web app to the major phone app stores, quoted at $125 an hour. You pay the store developer fees.', picker: true },
  { id: 'ops-check-standard', name: 'Operations Check, one location', group: 'service', once: { amount: 2500, kind: 'fixed' }, summary: 'A written map of how the work runs, the one problem costing you the most, a done list, and a fixed price to fix it. For up to 15 people at one location. 100% credited toward the next step if you proceed within 60 days.', picker: true },
  { id: 'ops-check-multi', name: 'Operations Check, multi-location', group: 'service', once: { amount: 4500, kind: 'fixed' }, summary: 'The same diagnostic for more than one location, or 16–60 people. 100% credited if you proceed within 60 days.', picker: true },
  { id: 'fix-10', name: '90-Day Fix, up to 10 people', group: 'service', once: { amount: 7500, kind: 'fixed' }, summary: 'Fix one economic problem against the written done list, in 90 days. Paid in two halves.', picker: true },
  { id: 'fix-25', name: '90-Day Fix, 11–25 people', group: 'service', once: { amount: 12500, kind: 'fixed' }, summary: 'The same 90-day fix for a larger team. Paid in two halves.', picker: true },
  { id: 'fix-60', name: '90-Day Fix, 26–60 people', group: 'service', once: { amount: 19500, kind: 'fixed' }, summary: 'The same 90-day fix for a larger operation. Paid in two halves.', picker: true },
  { id: 'custom-build', name: 'Custom system build', group: 'service', once: { amount: 7500, kind: 'from' }, summary: 'A system built around your business, not a kit configuration. Written scope, 50% deposit.', picker: true },
  { id: 'ad-short', name: 'One short ad or social film', group: 'marketing', once: { amount: 299, kind: 'fixed' }, summary: 'One 15–60 second film.', picker: true },
  { id: 'ad-set', name: 'Ad set of four shorts', group: 'marketing', once: { amount: 799, kind: 'fixed' }, summary: 'Four shorts for campaigns. Larger sets are quoted.', picker: true },
  { id: 'class-free', name: 'Free class', group: 'academy', once: { amount: 0, kind: 'fixed' }, summary: 'How to Build Something That Belongs to You. Under an hour, in English or Spanish.', picker: false },
  { id: 'workbook-short', name: 'Workbook, short', group: 'academy', once: { amount: 37, kind: 'fixed' }, summary: 'A downloadable workbook.', picker: true },
  { id: 'workbook-full', name: 'Workbook, full', group: 'academy', once: { amount: 67, kind: 'fixed' }, summary: 'The fuller workbook.', picker: true },
  { id: 'founders-course', name: "Founder's Build course", group: 'academy', once: { amount: 297, kind: 'fixed' }, summary: 'The paid course path after the free class.', picker: true },
  { id: 'founders-complete', name: "Founder's Build complete", group: 'academy', once: { amount: 997, kind: 'fixed' }, summary: 'Course, workbook, and an Owners Circle trial. Can be split into three payments.', picker: true },
  { id: 'owners-circle', name: 'Owners Circle', group: 'academy', monthly: { amount: 27, kind: 'fixed' }, summary: 'Monthly membership after the course.', picker: true },
]

export const HOURLY_RATE = 125
export const EXTRA_SEAT_MONTHLY = 15
export const RUSH_SETUP = 150

export type BuildSelection = {
  kitId?: KitId
  sizeId?: SizeId
  setupId?: SetupId
  items: string[]
  rush?: boolean
  extraSeats?: number
  extraLocations?: number
  annual?: boolean
}

export type EstimateLine = {
  label: string
  setup: number
  monthly: number
  note?: string
  kind: PriceKind
}

export type Estimate = {
  lines: EstimateLine[]
  setup: number
  monthly: number
  annual: number
  hasFrom: boolean
  hasQuote: boolean
  ready: boolean
  summary: string
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

export function moneyLabel(price?: Money, suffix = ''): string {
  if (!price) return '—'
  if (price.kind === 'quote') return 'Quote'
  if (price.kind === 'pass-through') return 'Billed by the provider'
  if (price.kind === 'included') return 'Included'
  if (price.kind === 'usage') return `${formatUsd(price.amount)}${suffix} + usage`
  const base = `${formatUsd(price.amount)}${suffix}`
  return price.kind === 'from' ? `From ${base}` : base
}

export function annualFromMonthly(monthly: number): number {
  return monthly * 11
}

export function kitById(id: KitId | undefined): Kit | undefined {
  return KITS.find((k) => k.id === id)
}

export function estimateBuild(sel: BuildSelection): Estimate {
  const lines: EstimateLine[] = []
  const kit = kitById(sel.kitId)
  const size = SIZES.find((s) => s.id === sel.sizeId)
  const setup = SETUPS.find((s) => s.id === sel.setupId)

  if (setup) {
    lines.push({ label: setup.name, setup: setup.price.amount, monthly: 0, kind: setup.price.kind, note: setup.summary })
  }
  if (sel.rush && setup) {
    lines.push({ label: 'Rush setup', setup: RUSH_SETUP, monthly: 0, kind: 'fixed', note: 'To go live in two business days when there is capacity.' })
  }
  if (kit && size) {
    const m = kit.monthly[size.id]
    lines.push({
      label: `${kit.name}, ${size.name}`,
      setup: 0,
      monthly: m.kind === 'quote' ? 0 : m.amount,
      kind: m.kind,
      note: `Includes the owner and staff dashboard. ${size.seats} staff seats, ${size.locations} location${size.locations === 1 ? '' : 's'}, ${size.help} of help, ${size.texts.toLocaleString('en-US')} text segments. Capacity: ${kit.capacity[size.id]}.`,
    })
  }
  const extraSeats = Math.max(0, sel.extraSeats ?? 0)
  if (extraSeats) {
    lines.push({ label: `${extraSeats} extra staff seat${extraSeats === 1 ? '' : 's'}`, setup: 0, monthly: extraSeats * EXTRA_SEAT_MONTHLY, kind: 'fixed' })
  }
  const extraLocations = Math.max(0, sel.extraLocations ?? 0)
  if (extraLocations) {
    lines.push({ label: `${extraLocations} extra location${extraLocations === 1 ? '' : 's'}`, setup: extraLocations * 125, monthly: extraLocations * 49, kind: 'fixed' })
  }

  const picked = new Set(sel.items)
  for (const item of CATALOG) {
    if (!picked.has(item.id)) continue
    lines.push({
      label: item.name,
      setup: item.once && item.once.kind !== 'quote' ? item.once.amount : 0,
      monthly: item.monthly && item.monthly.kind !== 'quote' && item.monthly.kind !== 'pass-through' ? item.monthly.amount : 0,
      kind: item.once?.kind === 'from' || item.monthly?.kind === 'from' ? 'from' : item.once?.kind === 'quote' || item.monthly?.kind === 'quote' ? 'quote' : 'fixed',
      note: item.summary,
    })
  }

  const setupTotal = lines.reduce((sum, l) => sum + l.setup, 0)
  const monthlyTotal = lines.reduce((sum, l) => sum + l.monthly, 0)
  const hasFrom = lines.some((l) => l.kind === 'from')
  const hasQuote = lines.some((l) => l.kind === 'quote') || Boolean(kit && kit.group === 'quote')
  const ready = kit ? kit.ready : true
  const parts = [
    setupTotal ? `${hasFrom ? 'from ' : ''}${formatUsd(setupTotal)} setup` : null,
    monthlyTotal ? `${hasFrom || hasQuote ? 'from ' : ''}${formatUsd(monthlyTotal)} per month` : hasQuote ? 'monthly quoted' : null,
    monthlyTotal ? `or ${formatUsd(annualFromMonthly(monthlyTotal))} a year (12 for 11)` : null,
  ].filter(Boolean)
  const summary = parts.join(', ') || 'Add a kit or a service to see an estimate.'

  return {
    lines,
    setup: setupTotal,
    monthly: monthlyTotal,
    annual: annualFromMonthly(monthlyTotal),
    hasFrom,
    hasQuote,
    ready,
    summary,
  }
}

export function describeBuild(sel: BuildSelection, estimate: Estimate, contact?: { phone?: string; website?: string }): string {
  const kit = kitById(sel.kitId)
  const size = SIZES.find((s) => s.id === sel.sizeId)
  const setup = SETUPS.find((s) => s.id === sel.setupId)
  const rows = [
    'Pricing build request (estimate, not a final quote)',
    kit ? `Kit: ${kit.name}` : 'Kit: not chosen',
    size ? `Size: ${size.name}` : 'Size: not chosen',
    setup ? `Setup: ${setup.name}` : 'Setup: not chosen',
    sel.rush ? 'Rush setup: yes' : null,
    (sel.extraSeats ?? 0) > 0 ? `Extra seats: ${sel.extraSeats}` : null,
    (sel.extraLocations ?? 0) > 0 ? `Extra locations: ${sel.extraLocations}` : null,
    estimate.lines.length ? 'Lines:' : null,
    ...estimate.lines.map((l) => {
      const bits = [l.setup ? `${l.kind === 'from' ? 'from ' : ''}${formatUsd(l.setup)} setup` : null, l.monthly ? `${l.kind === 'from' ? 'from ' : ''}${formatUsd(l.monthly)}/mo` : l.kind === 'quote' ? 'quoted' : null].filter(Boolean)
      return `  - ${l.label}${bits.length ? ` (${bits.join(', ')})` : ''}`
    }),
    `Estimated setup: ${estimate.hasFrom ? 'from ' : ''}${formatUsd(estimate.setup)}`,
    `Estimated monthly: ${estimate.hasQuote && !estimate.monthly ? 'quoted' : `${estimate.hasFrom || estimate.hasQuote ? 'from ' : ''}${formatUsd(estimate.monthly)}`}`,
    estimate.monthly ? `Annual 12-for-11: ${formatUsd(estimate.annual)}` : null,
    sel.annual ? 'Customer is interested in annual prepay (12 for 11).' : 'Customer is looking at monthly billing.',
    contact?.phone ? `Phone: ${contact.phone}` : null,
    contact?.website ? `Website: ${contact.website}` : null,
    'Totals are estimates. The written quote is final.',
  ]
  return rows.filter((r): r is string => Boolean(r)).join('\n')
}

/** Apply-form choices. Legacy operate/grow/founding values still decode for old links, but are not offered. */
export type OfferGroup = 'plan' | 'partner'
export type OfferChoice = { val: string; group: OfferGroup; label: string }

export const OFFER_GROUPS: readonly { id: OfferGroup; label: string }[] = [
  { id: 'plan', label: 'A kit' },
  { id: 'partner', label: 'Custom build or not sure' },
]

export const OFFER_CHOICES: readonly OfferChoice[] = [
  ...KITS.filter((k) => k.group !== 'quote').map((k) => ({ val: k.id, group: 'plan' as const, label: `${k.name} kit` })),
  { val: 'cannabis', group: 'partner' as const, label: 'Cannabis (quoted)' },
  { val: 'partner', group: 'partner' as const, label: 'Custom build, let’s talk' },
  { val: 'unsure', group: 'partner' as const, label: 'Not sure yet — help me decide' },
]

const LEGACY_OFFERS: Record<string, string> = {
  operate: 'Superseded Operate plan (legacy form value)',
  grow: 'Superseded Grow plan (legacy form value)',
  founding: 'Superseded Founding plan (legacy form value)',
}

export function offerLabel(val: string | null | undefined): string {
  if (!val) return 'Not specified'
  if (LEGACY_OFFERS[val]) return LEGACY_OFFERS[val]
  return OFFER_CHOICES.find((choice) => choice.val === val)?.label ?? val
}

/** @deprecated Superseded November 22, 2026. Kept only so older internal links do not crash. */
export const PARTNER = {
  id: 'partner' as const,
  name: 'Custom build',
  line: 'Custom builds, from $7,500, quoted.',
  detail: 'For a business that needs something built around it: priced on the work, in writing, before anything starts.',
  cta: 'Get my quote',
  href: BUILD_URL,
}

export type Seats = { total: number; left: number; open: boolean }
export const FOUNDING_DEFAULT_SEATS: Seats = { total: 0, left: 0, open: false }
