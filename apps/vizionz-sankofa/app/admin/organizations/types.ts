// VIZIONZ SANKOFA · /admin/organizations · shared types

export type RelationshipKind = 'funder' | 'partner' | 'both'

export type OrganizationStatus =
  | 'active'
  | 'prospect'
  | 'lapsed'
  | 'inactive'

export type OrganizationType =
  | 'federal'
  | 'state'
  | 'county'
  | 'city'
  | 'foundation'
  | 'corporate'
  | 'coalition'
  | 'nonprofit'
  | 'united_way'
  | 'faith_based'
  | 'other'

export type OrganizationRecord = {
  id: string
  name: string
  short_name: string | null
  slug: string
  relationship_kind: RelationshipKind
  type: OrganizationType
  level: string | null
  status: OrganizationStatus | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  primary_contact_role: string | null
  website: string | null
  notes: string | null
  next_touch_due: string | null
  created_at: string
  updated_at: string
}

export type FunderAccessTokenRecord = {
  id: string
  organization_id: string
  token: string
  generated_at: string
  generated_by_id: string | null
  last_viewed_at: string | null
  view_count: number
  is_revoked: boolean
  revoked_at: string | null
  notes: string | null
  created_at: string
}

export type OrganizationWithTokens = OrganizationRecord & {
  active_token_count: number
  last_funder_view: string | null
  total_funder_views: number
}

export type OrganizationEditableFields = {
  name: string
  short_name: string | null
  slug: string
  relationship_kind: RelationshipKind
  type: OrganizationType
  level: string | null
  status: OrganizationStatus
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  primary_contact_role: string | null
  website: string | null
  notes: string | null
  next_touch_due: string | null
}

export const RELATIONSHIP_KIND_LABELS: Record<RelationshipKind, string> = {
  funder: 'Funder',
  partner: 'Partner',
  both: 'Funder + Partner',
}

export const RELATIONSHIP_KIND_COLORS: Record<
  RelationshipKind,
  { bg: string; fg: string }
> = {
  funder: { bg: 'rgba(0, 122, 51, 0.12)', fg: '#007A33' },
  partner: { bg: 'rgba(91, 44, 143, 0.12)', fg: '#5B2C8F' },
  both: { bg: 'rgba(180, 95, 0, 0.12)', fg: '#B45F00' },
}

export const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
  active: 'Active',
  prospect: 'Prospect',
  lapsed: 'Lapsed',
  inactive: 'Inactive',
}

export const ORGANIZATION_STATUS_COLORS: Record<
  OrganizationStatus,
  { bg: string; fg: string }
> = {
  active: { bg: 'rgba(0, 122, 51, 0.12)', fg: '#007A33' },
  prospect: { bg: 'rgba(91, 44, 143, 0.12)', fg: '#5B2C8F' },
  lapsed: { bg: 'rgba(180, 95, 0, 0.12)', fg: '#B45F00' },
  inactive: { bg: 'rgba(10, 10, 10, 0.08)', fg: 'rgba(10, 10, 10, 0.55)' },
}

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  federal: 'Federal',
  state: 'State',
  county: 'County',
  city: 'City / Municipal',
  foundation: 'Foundation',
  corporate: 'Corporate',
  coalition: 'Coalition',
  nonprofit: 'Nonprofit',
  united_way: 'United Way',
  faith_based: 'Faith-Based',
  other: 'Other',
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}

export function generateToken(): string {
  // URL-safe random token, 32 chars
  const bytes = new Uint8Array(24)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes)
  } else {
    // Fallback for server-side (will be replaced with crypto.randomBytes in route)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, 32)
}

export function isFunder(kind: RelationshipKind): boolean {
  return kind === 'funder' || kind === 'both'
}
