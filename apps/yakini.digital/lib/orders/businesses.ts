// Customer-facing business types. Each one maps to a template the live catalog
// already publishes. No new template ids are invented here.
import type { Catalog } from '@/lib/orders/logic'

export type BusinessChoice = {
  id: string
  label: string
  /** Nearest catalog template. Falls back to builtin when that id is absent. */
  templateId: 'home-services' | 'construction' | 'hospitality' | 'builtin'
  keywords: string
}

export const BUSINESSES: readonly BusinessChoice[] = [
  { id: 'restaurants', label: 'Restaurants and food trucks', templateId: 'hospitality', keywords: 'restaurant food truck cafe kitchen catering bakery bar' },
  { id: 'salons', label: 'Salons and barbers', templateId: 'builtin', keywords: 'salon barber hair stylist beauty nail' },
  { id: 'medspa', label: 'Med spa and wellness', templateId: 'builtin', keywords: 'med spa medspa wellness spa massage' },
  { id: 'fitness', label: 'Fitness', templateId: 'builtin', keywords: 'gym fitness trainer studio yoga' },
  { id: 'auto', label: 'Auto and dealerships', templateId: 'builtin', keywords: 'auto car dealer dealership mechanic repair shop' },
  { id: 'trades', label: 'Home services and trades', templateId: 'home-services', keywords: 'hvac plumber plumbing electrician roof handyman trade' },
  { id: 'cleaning', label: 'Cleaning', templateId: 'home-services', keywords: 'cleaning maid janitorial house clean' },
  { id: 'landscaping', label: 'Landscaping and tree service', templateId: 'home-services', keywords: 'lawn landscape tree yard mow' },
  { id: 'construction', label: 'Construction and contractors', templateId: 'construction', keywords: 'construction contractor builder remodel job site' },
  { id: 'real-estate', label: 'Real estate', templateId: 'builtin', keywords: 'realtor real estate broker property' },
  { id: 'legal', label: 'Legal', templateId: 'builtin', keywords: 'lawyer attorney law firm legal' },
  { id: 'accounting', label: 'Accounting', templateId: 'builtin', keywords: 'accountant bookkeeping cpa tax' },
  { id: 'insurance', label: 'Insurance', templateId: 'builtin', keywords: 'insurance agent broker' },
  { id: 'healthcare', label: 'Healthcare and dental', templateId: 'builtin', keywords: 'doctor dental dentist clinic healthcare medical chiro' },
  { id: 'childcare', label: 'Childcare and education', templateId: 'builtin', keywords: 'childcare daycare school tutor education' },
  { id: 'nonprofit', label: 'Nonprofits and community orgs', templateId: 'builtin', keywords: 'nonprofit church community charity' },
  { id: 'retail', label: 'Retail', templateId: 'builtin', keywords: 'retail shop store boutique' },
  { id: 'events', label: 'Events and venues', templateId: 'hospitality', keywords: 'event venue wedding banquet hall' },
  { id: 'professional', label: 'Professional services', templateId: 'builtin', keywords: 'consultant agency professional services' },
  { id: 'other', label: 'Other', templateId: 'builtin', keywords: 'other something else' },
]

export function filterBusinesses(query: string): BusinessChoice[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...BUSINESSES]
  const hits = BUSINESSES.filter((item) => item.id !== 'other' && `${item.label} ${item.keywords}`.toLowerCase().includes(q))
  const other = BUSINESSES.find((item) => item.id === 'other')
  return other ? [...hits, other] : hits
}

/** Catalog template id to send. Never a key the catalog did not publish. */
export function resolveTemplate(businessId: string, catalog: Catalog): string {
  const choice = BUSINESSES.find((item) => item.id === businessId)
  if (!choice) return ''
  if (catalog.templates.some((item) => item.id === choice.templateId)) return choice.templateId
  if (catalog.templates.some((item) => item.id === 'builtin')) return 'builtin'
  return catalog.templates[0]?.id ?? ''
}

export function businessLabel(businessId: string, other: string): string {
  if (businessId === 'other') return other.trim()
  return BUSINESSES.find((item) => item.id === businessId)?.label ?? ''
}
