// Yakini's one public price list (locked Oct 21 2026, Clarence Kennedy).
// Every page that shows a plan, the Founding offer, or an apply-form choice reads this file.
// The portal's sign-up (portal.yakini.digital/start) charges from the same numbers (portal.settings.json kit.offers).
// Customer-facing copy names services (hosting, database, texting line, payments), never the companies behind them.

/** The portal. Previews point this at the portal Preview with NEXT_PUBLIC_PORTAL_URL. */
export const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.yakini.digital').replace(/\/$/, '')
/** On-site click-to-build. Every "Start" / "Start your setup" link opens this. */
export const START_URL = '/start'
export const FOUNDING_API = `${PORTAL_URL}/api/kit/founding`
/** Customer portal sign-in, linked from the site header on every page. */
export const PORTAL_LOGIN_URL = `${PORTAL_URL}/enter`

export function startUrl(planId?: string): string {
  return planId ? `${START_URL}?plan=${encodeURIComponent(planId)}` : START_URL
}

export const PITCH_HEAD = 'A real person sets it up with you. And stays.'
export const PITCH =
  'Other platforms hand you the software and leave you to set it up alone. Yakini prices differently because a real Yakini person sets everything up with you, then stays with you after go-live, with a help desk you can reach any time.'

// Refund deadline (Oct 22 2026): kickoff call or 14 days after sign-up, whichever comes first. Same words as the portal.
export const REFUND_RULE =
  'The setup fee is refundable in full until your kickoff call or 14 days after you sign up, whichever comes first. After that it is non-refundable.'

export const BILLING_NOTE =
  'You pay the one-time guided-setup fee when you sign up. Your monthly plan starts after setup.'

export const EXTRA_HELP_NOTE =
  'Need more help than your plan includes? Extra hours are $150/hour, or move up a plan.'

/** Included help hours don't roll over (Oct 22 2026). */
export const HELP_HOURS_NOTE =
  'Included help hours are for that month only: unused hours don’t roll over and expire at the end of each month.'

/** Drafted replies and transcripts stop at a fixed monthly limit; the customer is warned at 80%. */
export const AI_LIMIT_NOTE =
  'Drafted replies and voice transcripts have a fixed monthly limit on every plan. We’ll warn you at 80%, and nothing goes out without your OK.'

export const FLAT_PRICING_NOTE = 'Flat pricing. Yakini never takes a share of your revenue.'

export const PASS_THROUGH_NOTE =
  'Your hosting, database, email, texting line and payment processing are set up in your business’s name, so everything stays yours. Those services bill you directly at their own cost; they are not part of Yakini’s price.'

export const GUIDED_STEPS = [
  { title: 'Sign up and pay the setup fee', detail: 'Pick a plan and pay the one-time guided-setup fee by card. Your monthly plan starts after setup.' },
  { title: 'Kickoff call with your Yakini person', detail: 'About 30 minutes. We learn how your business runs today and agree the first thing to fix.' },
  { title: 'We set it up with you', detail: 'Your website, customer portal and the tools on your plan, in your business’s name. You approve each step.' },
  { title: 'Go live, and we stay', detail: 'Your monthly plan starts. Your Yakini person stays on, and the help desk is always open.' },
] as const

export type PlanModule = { plain: string; operate: boolean; grow: boolean; live?: boolean }

/** What each plan includes. Founding includes exactly what Operate includes. */
export const PLAN_MODULES: readonly PlanModule[] = [
  { plain: 'Your website and customer portal, set up with you', operate: true, grow: true },
  { plain: 'Help desk with a real Yakini person', operate: true, grow: true },
  { plain: 'Voice notes', operate: true, grow: true },
  { plain: 'Drafted replies, up to a monthly limit (we’ll warn you at 80%), checked before anything goes out', operate: true, grow: true },
  { plain: 'Business texting line for opted-in customers', operate: true, grow: true },
  { plain: 'Online booking you confirm', operate: true, grow: true },
  { plain: 'Incoming texts in one place', operate: true, grow: true },
  { plain: 'Card payments on your invoices', operate: false, grow: true, live: false },
  { plain: 'Missed-call text-back, sent with your OK', operate: false, grow: true },
  { plain: 'Review requests', operate: false, grow: true, live: false },
  { plain: 'Follow-up campaigns to opted-in customers', operate: false, grow: true, live: false },
  { plain: 'Monthly owner report', operate: false, grow: true },
]

export type Plan = {
  id: 'operate' | 'grow' | 'founding'
  name: string
  tag: string
  /** One-time guided setup, whole dollars. */
  setup: number
  monthly: number
  helpHours: number
  summary: string
  lockedMonths?: number
  spots?: { total: number; takenElsewhere: number }
  includes: readonly string[]
}

const operateIncludes = PLAN_MODULES.filter((m) => m.operate && m.live !== false).map((m) => m.plain)
const growIncludes = PLAN_MODULES.filter((m) => m.grow && m.live !== false).map((m) => m.plain)

/**
 * Punchy plan-card lines. Prices on the card still come from the live catalog.
 * Backing, checked Oct 23 2026:
 * - Help hours: helpHours on PLANS below (Operate and Founding 1, Grow 3).
 * - AI cap: owner-confirmed. The approved plan cites portal ai-cap.ts ($10 Operate/Founding, $25 Grow, warn at 80%).
 *   The private portal repo was not readable from this change, so the file was not re-opened.
 * - 12-month lock and first 10: lockedMonths and spots here, and the live founding seat count.
 * - Texting, missed-call text-back, owner report, help desk: live catalog modules on those plans.
 * - Portal on your domain: the kickoff domain step. No room count is stated. portal.settings.json was not readable.
 * - Not claimed: unlimited contacts, users, rooms, or texts.
 */
export const PLAN_HIGHLIGHTS = {
  founding: {
    tagline: 'For the first 10. The Operate setup, price locked.',
    bullets: [
      'Price locked 12 months',
      '1 hour a month with your operator',
      '$10 a month for drafted replies',
      'Your portal on your own domain',
      'A real Yakini operator on the help desk',
      'One price. No surprise fees.',
    ],
  },
  operate: {
    tagline: 'For the owner running the day to day.',
    bullets: [
      '1 hour a month with your operator',
      '$10 a month for drafted replies',
      'Your portal on your own domain',
      'Business texting for people who opted in',
      'A real Yakini operator on the help desk',
      'One price. No surprise fees.',
    ],
  },
  grow: {
    tagline: 'For a small team that wants more follow-through.',
    bullets: [
      '3 hours a month with your operator',
      '$25 a month for drafted replies',
      'Missed-call text-back, with your OK',
      'A monthly owner report',
      'Your portal on your own domain',
      'One price. No surprise fees.',
    ],
  },
} as const

export const PRICE_PROMISE = {
  title: 'What you see is what you pay',
  body: 'One price. No surprise usage bills, no wallet that refills itself, no hidden add-ons. Help hours are included with your plan. Drafted replies and transcripts stay inside the plan’s cap, and we warn you at 80%. Anything past that is quoted before it starts: $150 an hour, or a move up to the next plan.',
} as const

/** Live on every published plan, or part of delivery. Not a list of extras. */
export const INCLUDED_NOT_ADDONS = [
  'Your own branded portal, on your own domain',
  'AI help inside your plan’s cap',
  'A real Yakini operator, plus your plan’s help hours',
  'Domain connection on the kickoff call',
  'Online booking you confirm',
] as const

/**
 * None of these connections are a live catalog module.
 * publicApi, pipeline, and email campaigns are catalog state "ask".
 * Card payments are opening soon, which is Yakini invoicing, not a customer’s existing processor.
 */
/**
 * What the $499 setup actually does. Customer-list import is omitted: the portal
 * catalog does not have a live import. Extra team logins are omitted: the team
 * module is not live. Who pays for a domain is omitted: the catalog does not say.
 * Branding is the "brand" input on the approved plan's setup path.
 */
export const SETUP_INCLUDES = [
  'Your own system, created with the features you picked',
  'Branded with your name, logo, and colors',
  'Connected to your own domain. We walk through the one record with you. If you need a domain, we register it in your business’s name.',
  'A kickoff call with your Yakini operator',
  'Your booking page, services, and hours, set up with you',
  'Your business texting line requested, and the carrier registration filed. It goes live after approval, usually 1 to 4 weeks.',
  'Your login, so you can sign in',
  'A walkthrough with your operator, so you can run it',
  'A go-live check on your domain',
] as const

export const SEE_BEFORE_YOU_PAY = 'See everything before you pay.'

/** One line on the plan cards and /pricing. Add-ons are not inside the plan price. */
export const ADDON_PLAN_LINE =
  'Need more? Add-ons like an AI that answers for you are available at extra cost.'

export const INTEGRATIONS_COPY = {
  title: 'Integrations: we connect to what you already use',
  body: 'Already have tools you like? Keep them. We connect your system to the payment processor, calendar, accounting, and customer list you already run, and to your website, phone line, email, and most tools that offer a connection. Your Yakini operator sets it up with you. Those connections are not in the system today, so each one is an add-on, priced with you, at an additional cost.',
} as const

export const PLANS: readonly Plan[] = [
  {
    id: 'operate',
    name: 'Operate',
    tag: 'For the solo owner',
    setup: 499,
    monthly: 249,
    helpHours: 1,
    summary: PLAN_HIGHLIGHTS.operate.tagline,
    includes: operateIncludes,
  },
  {
    id: 'grow',
    name: 'Grow',
    tag: 'For small teams',
    setup: 499,
    monthly: 449,
    helpHours: 3,
    summary: PLAN_HIGHLIGHTS.grow.tagline,
    includes: growIncludes,
  },
  {
    id: 'founding',
    name: 'Founding',
    tag: 'First 10 customers only',
    setup: 499,
    monthly: 179,
    helpHours: 1,
    lockedMonths: 12,
    spots: { total: 10, takenElsewhere: 1 },
    summary: PLAN_HIGHLIGHTS.founding.tagline,
    includes: operateIncludes,
  },
]

export const FOUNDING = PLANS.find((p) => p.id === 'founding')!

export const PARTNER = {
  id: 'partner' as const,
  name: 'Partner',
  line: 'Custom builds, let’s talk.',
  detail: 'For a business that needs something built around it: priced on the work, in writing, before anything starts.',
  cta: 'Book a call',
  href: '/apply?tier=partner',
}

export type Seats = { total: number; left: number; open: boolean }
/** Shown until the live count arrives from the portal: 9 of 10 (Momma Sally’s is Founding #1). */
export const FOUNDING_DEFAULT_SEATS: Seats = { total: 10, left: 9, open: true }

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

export function monthlyLabel(plan: Pick<Plan, 'monthly'>): string {
  return `${formatUsd(plan.monthly)}/mo`
}

export function setupLabel(plan: Pick<Plan, 'setup'>): string {
  return formatUsd(plan.setup)
}

export function priceLabel(plan: Pick<Plan, 'setup' | 'monthly'>): string {
  return `${setupLabel(plan)} setup + ${monthlyLabel(plan)}`
}

export function helpLabel(plan: Pick<Plan, 'helpHours'>): string {
  return `${plan.helpHours} ${plan.helpHours === 1 ? 'hour' : 'hours'} a month of help`
}

export type OfferGroup = 'plan' | 'partner'
export type OfferChoice = { val: string; group: OfferGroup; label: string }

export const OFFER_GROUPS: readonly { id: OfferGroup; label: string }[] = [
  { id: 'plan', label: 'Guided-setup plan' },
  { id: 'partner', label: 'Partner (custom)' },
]

export const OFFER_CHOICES: readonly OfferChoice[] = [
  ...PLANS.map((plan) => ({ val: plan.id, group: 'plan' as const, label: `${plan.name} · ${priceLabel(plan)}${plan.lockedMonths ? ` (locked ${plan.lockedMonths} months)` : ''}` })),
  { val: PARTNER.id, group: 'partner' as const, label: 'Partner · custom build, let’s talk' },
  { val: 'unsure', group: 'partner' as const, label: 'Not sure yet — help me decide' },
]

export function offerLabel(val: string | null | undefined): string {
  if (!val) return 'Not specified'
  return OFFER_CHOICES.find((choice) => choice.val === val)?.label ?? val
}
