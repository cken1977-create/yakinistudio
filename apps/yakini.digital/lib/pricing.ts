// Yakini's one public price list (locked Oct 21 2026, Clarence Kennedy; Grow setup cut to $499 Oct 23 2026, so every plan has a $499 setup).
// Every page that shows a plan, the Founding offer, or an apply-form choice reads this file.
// The portal's sign-up (portal.yakini.digital/start) charges from the same numbers (portal.settings.json kit.offers).
// Customer-facing copy names services (hosting, database, texting line, payments), never the companies behind them.

/** The portal. Previews point this at the portal Preview with NEXT_PUBLIC_PORTAL_URL. */
export const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.yakini.digital').replace(/\/$/, '')
export const START_URL = `${PORTAL_URL}/start`
export const FOUNDING_API = `${PORTAL_URL}/api/kit/founding`
/** Customer portal sign-in, linked from the site header on every page. */
export const PORTAL_LOGIN_URL = `${PORTAL_URL}/enter`

export function startUrl(planId?: string): string {
  return planId ? `${START_URL}?kit=${planId}#form` : START_URL
}

export const PITCH_HEAD = 'A real person sets it up with you. And stays.'
export const PITCH =
  'Other platforms hand you the software and leave you to set it up alone. Yakini prices differently because a real Yakini person sets everything up with you, then stays with you after go-live, with a help desk you can reach any time.'

// Refund deadline (Oct 22 2026): kickoff call or 14 days after sign-up, whichever comes first. Same words as the portal.
export const REFUND_RULE =
  'The setup fee is refundable in full until your kickoff call or 14 days after you sign up, whichever comes first. After that it is non-refundable.'

export const BILLING_NOTE =
  'When you sign up, you pay the one-time guided-setup fee by card or bank account. Your monthly plan starts after setup.'

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
  { title: 'Pick a plan and sign up', detail: 'Tell us about your business and pay the one-time guided-setup fee by card or bank account. Your monthly plan starts after setup.' },
  { title: 'Kickoff call with your Yakini person', detail: 'About 30 minutes. We learn how your business runs today and agree the first thing to fix.' },
  { title: 'We set it up with you', detail: 'Your website, customer portal and the tools on your plan, in your business’s name. You approve each step.' },
  { title: 'Go live, and we stay', detail: 'Your monthly plan starts. Your Yakini person stays on, and the help desk is always open.' },
] as const

export type PlanModule = { plain: string; operate: boolean; grow: boolean }

/** What each plan includes. Founding includes exactly what Operate includes. */
export const PLAN_MODULES: readonly PlanModule[] = [
  { plain: 'Your website and customer portal, set up with you', operate: true, grow: true },
  { plain: 'Help desk with a real Yakini person', operate: true, grow: true },
  { plain: 'Voice notes', operate: true, grow: true },
  { plain: 'Drafted replies, up to a monthly limit (we’ll warn you at 80%), checked before anything goes out', operate: true, grow: true },
  { plain: 'Business texting line for opted-in customers', operate: true, grow: true },
  { plain: 'Online booking you confirm', operate: true, grow: true },
  { plain: 'Incoming texts in one place', operate: true, grow: true },
  { plain: 'Card payments on your invoices', operate: false, grow: true },
  { plain: 'Missed-call text-back, sent with your OK', operate: false, grow: true },
  { plain: 'Review requests', operate: false, grow: true },
  { plain: 'Follow-up campaigns to opted-in customers', operate: false, grow: true },
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

const operateIncludes = PLAN_MODULES.filter((m) => m.operate).map((m) => m.plain)
const growIncludes = PLAN_MODULES.filter((m) => m.grow).map((m) => m.plain)

export const PLANS: readonly Plan[] = [
  {
    id: 'operate',
    name: 'Operate',
    tag: 'For the solo owner',
    setup: 499,
    monthly: 249,
    helpHours: 1,
    summary: 'Your website and customer portal, set up with you by a real Yakini person.',
    includes: operateIncludes,
  },
  {
    id: 'grow',
    name: 'Grow',
    tag: 'For small teams',
    setup: 499,
    monthly: 449,
    helpHours: 3,
    summary: 'Everything in Operate, plus payments, follow-up tools and automation.',
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
    summary: 'Everything in Operate at a price locked for 12 months. Closes after the 10th customer.',
    includes: operateIncludes,
  },
]

export const FOUNDING = PLANS.find((p) => p.id === 'founding')!

/** Partner is quoted privately and never shown publicly. Kept for the call link and the apply form's value ('partner'). */
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
  { id: 'partner', label: 'Custom build' },
]

export const OFFER_CHOICES: readonly OfferChoice[] = [
  ...PLANS.map((plan) => ({ val: plan.id, group: 'plan' as const, label: `${plan.name} · ${priceLabel(plan)}${plan.lockedMonths ? ` (locked ${plan.lockedMonths} months)` : ''}` })),
  { val: PARTNER.id, group: 'partner' as const, label: 'Custom build, let’s talk' },
  { val: 'unsure', group: 'partner' as const, label: 'Not sure yet — help me decide' },
]

/** Internal label (admin email only). Partner keeps its internal name here; the public form says "Custom build". */
export function offerLabel(val: string | null | undefined): string {
  if (!val) return 'Not specified'
  if (val === PARTNER.id) return 'Partner · custom build'
  return OFFER_CHOICES.find((choice) => choice.val === val)?.label ?? val
}
