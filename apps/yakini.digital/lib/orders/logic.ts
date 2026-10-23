// Pure helpers for the click-to-build flow.
// Prices come only from the live catalog. Nothing here names a vendor.

export type CatalogTemplate = {
  id: string
  label: string
  playbook: string
}

export type CatalogFeature = {
  id: string
  label: string
  detail: string
  group: string
  state: string
  needs: string[]
}

export type CatalogPlan = {
  id: string
  name: string
  priceCents: number
  setupCents: number
  interval: string
  modules: string[]
  lockedMonths: number | null
  open: boolean
}

export type Catalog = {
  templates: CatalogTemplate[]
  features: CatalogFeature[]
  plans: CatalogPlan[]
  domain: {
    defaultKind: string
    registerTlds: string[]
  }
}

export type FoundingSeats = {
  total: number
  left: number
  open: boolean
}

/** Existing domain, or names Yakini registers at sign-up. */
export type DomainChoice =
  | { kind: 'existing'; domain: string; hostname: string }
  | { kind: 'register'; preferredNames: string[] }

export type ContactDetails = {
  name: string
  email: string
  phone: string
  businessName: string
}

/** Body sent to the portal order intake. Field names follow the catalog. */
export type OrderIntake = {
  templateId: string
  featureIds: string[]
  planId: string
  domain: DomainChoice
  contact: ContactDetails
}

export type Draft = {
  templateId: string
  /** Customer-facing business choice. Mapped to templateId. Not sent to the portal. */
  businessId: string
  businessOther: string
  featureIds: string[]
  planId: string
  planTouched: boolean
  domainKind: 'existing' | 'register'
  domain: string
  hostname: string
  hostnameTouched: boolean
  preferredNames: string[]
  contact: ContactDetails
}

const PLAN_RANK = ['founding', 'operate', 'grow']

export const FEATURE_GROUPS = [
  'Get found and booked',
  'Talk to customers',
  'Get paid',
  'Keep them coming back',
] as const

export function isSelectable(feature: CatalogFeature): boolean {
  return feature.state === 'selectable' || feature.state === 'live'
}

export function isComingSoon(feature: CatalogFeature): boolean {
  return !isSelectable(feature) && feature.state !== 'ask'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function strList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
}

/** Accept the live catalog shape and drop anything that is not a real plan or feature. */
export function parseCatalog(raw: unknown): Catalog | null {
  if (!isRecord(raw)) return null
  const templates = Array.isArray(raw.templates)
    ? raw.templates.flatMap((item) => {
        if (!isRecord(item)) return []
        const id = str(item.id)
        const label = str(item.label)
        if (!id || !label) return []
        return [{ id, label, playbook: str(item.playbook) ?? id }]
      })
    : []
  const features = Array.isArray(raw.features)
    ? raw.features.flatMap((item) => {
        if (!isRecord(item)) return []
        const id = str(item.id)
        const label = str(item.label)
        if (!id || !label) return []
        return [{
          id,
          label,
          detail: str(item.detail) ?? '',
          group: str(item.group) ?? 'More',
          state: str(item.state) ?? 'ask',
          needs: strList(item.needs),
        }]
      })
    : []
  const plans = Array.isArray(raw.plans)
    ? raw.plans.flatMap((item) => {
        if (!isRecord(item)) return []
        const id = str(item.id)
        const name = str(item.name)
        if (!id || !name) return []
        if (typeof item.priceCents !== 'number' || typeof item.setupCents !== 'number') return []
        return [{
          id,
          name,
          priceCents: item.priceCents,
          setupCents: item.setupCents,
          interval: str(item.interval) ?? 'month',
          modules: strList(item.modules),
          lockedMonths: typeof item.lockedMonths === 'number' ? item.lockedMonths : null,
          open: item.open !== false,
        }]
      })
    : []
  if (!templates.length || !plans.length) return null
  const domain = isRecord(raw.domain) ? raw.domain : {}
  return {
    templates,
    features,
    plans,
    domain: {
      defaultKind: str(domain.defaultKind) ?? 'portal',
      registerTlds: strList(domain.registerTlds),
    },
  }
}

export function parseSeats(raw: unknown): FoundingSeats | null {
  if (!isRecord(raw)) return null
  if (typeof raw.total !== 'number' || typeof raw.left !== 'number') return null
  return { total: raw.total, left: raw.left, open: Boolean(raw.open) }
}

/** Partner is never shown. Founding hides when the seat count says it is closed. */
export function publicPlans(catalog: Catalog, seats: FoundingSeats | null): CatalogPlan[] {
  const foundingOpen = seats ? seats.open : null
  return catalog.plans
    .filter((plan) => {
      if (plan.id === 'partner') return false
      if (!plan.open) return false
      if (!Number.isFinite(plan.priceCents) || !Number.isFinite(plan.setupCents)) return false
      if (plan.id === 'founding' && foundingOpen === false) return false
      return true
    })
    .slice()
    .sort((a, b) => {
      const ai = PLAN_RANK.indexOf(a.id)
      const bi = PLAN_RANK.indexOf(b.id)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
}

export function formatCents(cents: number): string {
  const whole = cents % 100 === 0
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })
}

export function monthlyLabel(plan: CatalogPlan): string {
  const per = plan.interval === 'month' ? 'a month' : `per ${plan.interval}`
  return `${formatCents(plan.priceCents)} ${per}`
}

/** Grow-only means the feature is on Grow and not on Operate (or Founding, which matches Operate). */
export function growOnlyIds(catalog: Catalog): Set<string> {
  const grow = catalog.plans.find((plan) => plan.id === 'grow')
  const base = catalog.plans.find((plan) => plan.id === 'operate')
    ?? catalog.plans.find((plan) => plan.id === 'founding')
  if (!grow || !base) return new Set()
  const baseSet = new Set(base.modules)
  return new Set(grow.modules.filter((id) => !baseSet.has(id)))
}

export function suggestPlanId(catalog: Catalog, featureIds: string[], seats: FoundingSeats | null): string | null {
  const plans = publicPlans(catalog, seats)
  if (!plans.length) return null
  const grow = plans.find((plan) => plan.id === 'grow')
  const only = growOnlyIds(catalog)
  if (grow && featureIds.some((id) => only.has(id))) return grow.id
  const founding = plans.find((plan) => plan.id === 'founding')
  if (founding) return founding.id
  return (plans.find((plan) => plan.id === 'operate') ?? plans[0]).id
}

export function toggleFeature(selected: string[], id: string, catalog: Catalog): string[] {
  const feature = catalog.features.find((item) => item.id === id)
  if (!feature || !isSelectable(feature)) return selected
  const on = new Set(selected)
  if (on.has(id)) {
    on.delete(id)
    for (const item of catalog.features) {
      if (on.has(item.id) && item.needs.includes(id)) on.delete(item.id)
    }
  } else {
    on.add(id)
    for (const need of feature.needs) {
      const required = catalog.features.find((item) => item.id === need)
      if (required && isSelectable(required)) on.add(need)
    }
  }
  return catalog.features.filter((item) => on.has(item.id) && isSelectable(item)).map((item) => item.id)
}

export function cleanHost(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '')
}

export function suggestHostname(domain: string, defaultKind = 'portal'): string {
  const clean = cleanHost(domain).replace(/^www\./, '')
  if (!clean) return ''
  const prefix = defaultKind === 'portal' ? 'portal.' : `${defaultKind}.`
  if (clean.startsWith(prefix) || clean.split('.').length > 2) return clean
  return `${prefix}${clean}`
}

const HOST_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/

export function validHost(value: string): boolean {
  return HOST_RE.test(cleanHost(value))
}

export function cleanName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 80)
}

export function validPreferredName(value: string): boolean {
  const name = cleanName(value)
  return name.length >= 2 && name.length <= 63 && /^[a-z0-9][a-z0-9 .-]*$/i.test(name)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim()) && value.trim().length <= 254
}

export function validPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

export function emptyDraft(planId = ''): Draft {
  return {
    templateId: '',
    businessId: '',
    businessOther: '',
    featureIds: [],
    planId,
    planTouched: Boolean(planId),
    domainKind: 'existing',
    domain: '',
    hostname: '',
    hostnameTouched: false,
    preferredNames: [''],
    contact: { name: '', email: '', phone: '', businessName: '' },
  }
}

export function domainFromDraft(draft: Draft, defaultKind: string): DomainChoice | null {
  if (draft.domainKind === 'register') {
    const preferredNames = draft.preferredNames.map(cleanName).filter(validPreferredName)
    if (!preferredNames.length) return null
    return { kind: 'register', preferredNames }
  }
  const domain = cleanHost(draft.domain).replace(/^www\./, '')
  const hostname = cleanHost(draft.hostnameTouched ? draft.hostname : suggestHostname(domain, defaultKind))
  if (!validHost(domain) || !validHost(hostname)) return null
  return { kind: 'existing', domain, hostname }
}

export function intakeFromDraft(draft: Draft, catalog: Catalog, seats: FoundingSeats | null): OrderIntake | null {
  const plans = publicPlans(catalog, seats)
  const plan = plans.find((item) => item.id === draft.planId)
  const template = catalog.templates.find((item) => item.id === draft.templateId)
  if (!plan || !template) return null
  const allowed = new Set(catalog.features.filter(isSelectable).map((item) => item.id))
  if (draft.featureIds.some((id) => !allowed.has(id))) return null
  const featureIds = draft.featureIds.filter((id) => allowed.has(id))
  const only = growOnlyIds(catalog)
  if (plan.id !== 'grow' && featureIds.some((id) => only.has(id))) return null
  const domain = domainFromDraft(draft, catalog.domain.defaultKind)
  if (!domain) return null
  const contact = {
    name: draft.contact.name.trim(),
    email: draft.contact.email.trim(),
    phone: draft.contact.phone.trim(),
    businessName: draft.contact.businessName.trim(),
  }
  if (contact.name.length < 2 || contact.businessName.length < 2) return null
  if (!validEmail(contact.email) || !validPhone(contact.phone)) return null
  return { templateId: template.id, featureIds, planId: plan.id, domain, contact }
}

export function groupedFeatures(catalog: Catalog): { group: string; features: CatalogFeature[] }[] {
  const visible = catalog.features.filter((feature) => feature.state !== 'ask')
  const groups = new Map<string, CatalogFeature[]>()
  for (const feature of visible) {
    const list = groups.get(feature.group) ?? []
    list.push(feature)
    groups.set(feature.group, list)
  }
  const ordered = [
    ...FEATURE_GROUPS.filter((group) => groups.has(group)),
    ...[...groups.keys()].filter((group) => !FEATURE_GROUPS.includes(group as (typeof FEATURE_GROUPS)[number])),
  ]
  return ordered.map((group) => ({ group, features: groups.get(group) ?? [] }))
}

export function includedLabels(catalog: Catalog, plan: CatalogPlan, featureIds: string[]): string[] {
  const byId = new Map(catalog.features.map((feature) => [feature.id, feature.label]))
  const fromPlan = plan.modules.map((id) => byId.get(id)).filter((label): label is string => Boolean(label))
  const extra = featureIds
    .filter((id) => !plan.modules.includes(id))
    .map((id) => byId.get(id))
    .filter((label): label is string => Boolean(label))
  return [...new Set([...fromPlan, ...extra])]
}

export function monthlyStartLabel(from = new Date()): string {
  const date = new Date(from)
  date.setUTCDate(date.getUTCDate() + 30)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function tldSentence(tlds: string[]): string {
  const list = tlds.length ? tlds : ['.com', '.net', '.org', '.us']
  if (list.length === 1) return list[0]
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

export type TimelineBlock = { title: string; body: string }

/** Timeline wording from the approved plan. No card is taken today, because payments are not live. */
export function timelineBlocks(address: string): TimelineBlock[] {
  const where = address || 'your own domain'
  return [
    {
      title: 'Today',
      body: 'You choose your setup and reserve it. No card is charged. We create your system the same business day, and your Yakini person confirms your kickoff time. The setup fee is collected with them on that call.',
    },
    {
      title: 'Kickoff call (within 2 business days, about 45 minutes)',
      body: 'Your Yakini person connects your domain with you, which takes about 15 minutes. If we registered your domain for you, it is already done. Then we start your setup together.',
    },
    {
      title: 'Your first week',
      body: 'We set it up together: your services, hours, job steps, request form, booking page and your first customers. You approve every step.',
    },
    {
      title: 'Your address',
      body: `Your system goes live at ${where}. Most connections work within the hour. Some domain companies take up to 2 days, and if yours does, we give you a temporary address so we keep building.`,
    },
    {
      title: 'Texting',
      body: 'We register your business texting line in your name on day one. Phone carriers usually take 1 to 4 weeks to approve it, and no one can speed that up. Everything else works in the meantime, and texting turns on the day it is approved.',
    },
    {
      title: 'Going live',
      body: 'Most businesses are live on their own domain within 1–2 weeks. Your monthly fee starts 30 days after sign-up.',
    },
  ]
}
