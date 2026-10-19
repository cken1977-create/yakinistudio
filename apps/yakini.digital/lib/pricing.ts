// Yakini's one public price list.
// Every page that shows a plan, a kit, or an apply-form choice reads this file.
// Do not hardcode these amounts anywhere else.

export const PORTAL_SIGNUP_URL = 'https://portal.yakini.digital'

export const PASS_THROUGH_NOTE =
  'Supabase, Vercel, Twilio, Stripe, your domain, and your email are accounts in your name. You pay those bills directly. They are not part of Yakini’s price.'

export const FLAT_PRICING_NOTE =
  'Pricing is flat. Yakini does not take a share of revenue.'

export const SELF_SERVE_SETUP_NOTE =
  'One-time operator setup. A Yakini operator sets the system up. Sign up at the portal.'

/** What the one-time self-serve setup fee covers. Same work on both plans. */
export const selfServeSetupCovers =
  'A Yakini operator connects your own accounts, in your name, turns on your modules, and walks you through the system.'

/** Ongoing monthly operator support for both self-serve plans. */
export const supportScope =
  'Help from your Yakini operator in your room, with a reply within 1 business day.'

export const supportBeyond =
  'Work beyond that is billed separately.'

export type SelfServeModule = {
  plain: string
  operate: boolean
  plus: boolean
}

/** Guide module list. Operate Plus includes every Operate module. */
export const SELF_SERVE_MODULES: readonly SelfServeModule[] = [
  { plain: 'Your own client portal', operate: true, plus: true },
  { plain: 'Help desk where customers send requests and follow their status', operate: true, plus: true },
  { plain: 'Voice notes from customers and staff', operate: true, plus: true },
  { plain: 'Drafted replies and transcripts that wait for your OK before anything goes out', operate: true, plus: true },
  { plain: 'Text alerts with opt-in, and STOP/HELP handled', operate: true, plus: true },
  { plain: 'A booking page where customers ask for a time and you confirm each one', operate: true, plus: true },
  { plain: 'Incoming texts land in the customer’s thread. Nothing replies on its own.', operate: true, plus: true },
  { plain: 'Card payments on invoices, with Stripe in your name', operate: false, plus: true },
  { plain: 'Missed-call handling: it rings you, logs the missed call, and drafts a text-back for your OK. Opted-in callers only.', operate: false, plus: true },
  { plain: 'Review requests, each one approved by you', operate: false, plus: true },
  { plain: 'Campaigns to customers who opted in. Every message is approved, with quiet hours and send limits.', operate: false, plus: true },
  { plain: 'A monthly owner report, on screen, in print, or as a CSV', operate: false, plus: true },
]

export const selfServeNotIncluded = [
  {
    missing: 'On Operate: card payments, missed-call text-back, review requests, campaigns, and the monthly owner report.',
    where: 'Operate Plus',
    href: '#operate-plus',
  },
  {
    missing: 'On both plans: Composer, Sentinel, and a system Yakini builds with you. A person approves every release.',
    where: 'A fully built kit',
    href: '#kits',
  },
  {
    missing: 'On both plans: a build that does not fit a plan or a kit.',
    where: 'Custom, quoted separately',
    href: '/apply?tier=custom',
  },
] as const

/** Bills the client pays directly. No amounts — those bills are not Yakini’s price. */
export const clientPaidAccounts = [
  'Supabase',
  'Vercel',
  'Twilio',
  'Stripe',
  'Your domain',
  'Your email',
] as const

export type SelfServePlan = {
  id: 'operate' | 'operate-plus'
  name: string
  /** One-time fee for a Yakini operator to set the system up. */
  setup: number
  priceMonthly: number
  summary: string
  includes: readonly string[]
}

export const SELF_SERVE_PLANS: readonly SelfServePlan[] = [
  {
    id: 'operate',
    name: 'Operate',
    setup: 499,
    priceMonthly: 249,
    summary: 'Your client portal. A Yakini operator sets it up.',
    includes: SELF_SERVE_MODULES.filter((module) => module.operate).map((module) => module.plain),
  },
  {
    id: 'operate-plus',
    name: 'Operate Plus',
    setup: 799,
    priceMonthly: 449,
    summary: 'Everything in Operate, plus payments, follow-up, and an owner report.',
    includes: SELF_SERVE_MODULES.filter((module) => module.plus).map((module) => module.plain),
  },
]

export type KitTier = {
  id: 'pilot' | 'bench' | 'crew' | 'staff' | 'house'
  name: string
  forWho: string
  setup: number
  monthly: number
  /** House is quoted from these amounts. */
  from: boolean
  minimumMonths: number | null
}

export const KIT_TIERS: readonly KitTier[] = [
  {
    id: 'pilot',
    name: 'Pilot',
    forWho: 'First five organizations',
    setup: 2500,
    monthly: 500,
    from: false,
    minimumMonths: null,
  },
  {
    id: 'bench',
    name: 'Bench',
    forWho: 'Solo operator',
    setup: 3500,
    monthly: 750,
    from: false,
    minimumMonths: null,
  },
  {
    id: 'crew',
    name: 'Crew',
    forWho: 'Team of 2–3',
    setup: 6500,
    monthly: 1500,
    from: false,
    minimumMonths: 6,
  },
  {
    id: 'staff',
    name: 'Staff',
    forWho: 'Growing team',
    setup: 12000,
    monthly: 2500,
    from: false,
    minimumMonths: 6,
  },
  {
    id: 'house',
    name: 'House',
    forWho: 'Groups and multi-site operators',
    setup: 25000,
    monthly: 5000,
    from: true,
    minimumMonths: 6,
  },
]

export const KIT_INCLUDES = [
  'Composer, the way Yakini builds the system',
  'Sentinel, the way the system is monitored',
  'A person approves every release',
  'You own the system',
] as const

export const CUSTOM_OFFER = {
  id: 'custom' as const,
  name: 'Custom kit',
  summary: 'Quoted separately. No public price.',
}

export type OfferGroup = 'self-serve' | 'kit' | 'custom'

export type OfferChoice = {
  val: string
  group: OfferGroup
  label: string
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

export function selfServeMonthlyLabel(plan: Pick<SelfServePlan, 'priceMonthly'>): string {
  return `${formatUsd(plan.priceMonthly)}/mo`
}

export function selfServeSetupLabel(plan: Pick<SelfServePlan, 'setup'>): string {
  return formatUsd(plan.setup)
}

export function selfServePriceLabel(plan: Pick<SelfServePlan, 'setup' | 'priceMonthly'>): string {
  return `${selfServeSetupLabel(plan)} setup + ${selfServeMonthlyLabel(plan)}`
}

export function kitSetupLabel(tier: Pick<KitTier, 'setup' | 'from'>): string {
  const amount = formatUsd(tier.setup)
  return tier.from ? `From ${amount}` : amount
}

export function kitMonthlyLabel(tier: Pick<KitTier, 'monthly' | 'from'>): string {
  const amount = `${formatUsd(tier.monthly)}/mo`
  return tier.from ? `From ${amount}` : amount
}

export function kitPriceLabel(tier: KitTier): string {
  const minimum = tier.minimumMonths ? ' · 6-month minimum' : ''
  return `${kitSetupLabel(tier)} setup + ${kitMonthlyLabel(tier)}${minimum}`
}

export const OFFER_GROUPS: readonly { id: OfferGroup; label: string }[] = [
  { id: 'self-serve', label: 'Self-serve plan' },
  { id: 'kit', label: 'Fully built kit' },
  { id: 'custom', label: 'Custom' },
]

export const OFFER_CHOICES: readonly OfferChoice[] = [
  ...SELF_SERVE_PLANS.map((plan) => ({
    val: plan.id,
    group: 'self-serve' as const,
    label: `${plan.name} · ${selfServePriceLabel(plan)}`,
  })),
  ...KIT_TIERS.map((tier) => ({
    val: tier.id,
    group: 'kit' as const,
    label: `${tier.name} · ${kitPriceLabel(tier)}`,
  })),
  {
    val: CUSTOM_OFFER.id,
    group: 'custom' as const,
    label: 'Custom kit · quoted separately',
  },
  {
    val: 'unsure',
    group: 'custom' as const,
    label: 'Not sure yet — help me decide',
  },
]

export function offerLabel(val: string | null | undefined): string {
  if (!val) return 'Not specified'
  return OFFER_CHOICES.find((choice) => choice.val === val)?.label ?? val
}
