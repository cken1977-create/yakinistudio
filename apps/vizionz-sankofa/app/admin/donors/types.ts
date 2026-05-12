// VIZIONZ SANKOFA · /admin/donors · Shared types & constants (Wave 3.5)
//
// Pattern matches /admin/documents/types.ts from Wave 3.2: co-located in
// the surface directory, importable from server actions, UI components,
// and Yakini Intelligence tools.

// ─── Enum types (match Postgres enums in Wave 3.5 migration) ────────────

export type DonorType =
  | 'individual'
  | 'family'
  | 'foundation'
  | 'corporation'
  | 'anonymous'

export type DonorStatus =
  | 'active'
  | 'lapsed'
  | 'declined_contact'
  | 'deceased'

export type GiftMethod =
  | 'cash'
  | 'check'
  | 'card'
  | 'ach'
  | 'in_kind'
  | 'stock'
  | 'grant'
  | 'other'

// ─── Display labels ──────────────────────────────────────────────────────

export const DONOR_TYPE_LABELS: Record<DonorType, string> = {
  individual: 'Individual',
  family: 'Family',
  foundation: 'Foundation',
  corporation: 'Corporation',
  anonymous: 'Anonymous',
}

export const DONOR_STATUS_LABELS: Record<DonorStatus, string> = {
  active: 'Active',
  lapsed: 'Lapsed',
  declined_contact: 'Do Not Contact',
  deceased: 'Deceased',
}

export const GIFT_METHOD_LABELS: Record<GiftMethod, string> = {
  cash: 'Cash',
  check: 'Check',
  card: 'Card',
  ach: 'ACH / Bank Transfer',
  in_kind: 'In-Kind',
  stock: 'Stock',
  grant: 'Grant',
  other: 'Other',
}

// ─── Status color tokens (visual canon — matches DocumentRow status colors) ─

export const DONOR_STATUS_COLORS: Record<DonorStatus, string> = {
  active: '#007A33',          // green — like ready documents
  lapsed: 'rgba(10, 10, 10, 0.55)', // muted gray — like pending documents
  declined_contact: '#CE1126', // red — like errored documents
  deceased: 'rgba(10, 10, 10, 0.35)', // ghost gray
}

// ─── Donor row (read shape from Supabase) ────────────────────────────────

export type DonorRecord = {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string
  email: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  donor_type: DonorType
  status: DonorStatus
  tags: string[]
  notes: string | null
  first_gift_date: string | null
  last_gift_date: string | null
  total_lifetime_amount_cents: number
  total_gifts_count: number
  recurring: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

// ─── Gift row ────────────────────────────────────────────────────────────

export type GiftRecord = {
  id: string
  donor_id: string
  amount_cents: number
  gift_date: string
  method: GiftMethod
  designation: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
}

// ─── Input types for server actions ──────────────────────────────────────

export type CreateDonorInput = {
  first_name?: string | null
  last_name?: string | null
  display_name: string
  email?: string | null
  phone?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  donor_type: DonorType
  status?: DonorStatus
  tags?: string[]
  notes?: string | null
  recurring?: boolean
}

export type UpdateDonorInput = Partial<CreateDonorInput>

export type CreateGiftInput = {
  donor_id: string
  amount_cents: number
  gift_date: string  // ISO date string YYYY-MM-DD
  method: GiftMethod
  designation?: string | null
  notes?: string | null
}

// ─── Result types ────────────────────────────────────────────────────────

export type DonorMutationResult =
  | { ok: true; donor_id: string }
  | { ok: false; error: string }

export type GiftMutationResult =
  | { ok: true; gift_id: string }
  | { ok: false; error: string }

// CSV import returns per-row results so the importer UI can show
// individual successes/failures in the summary state.
export type CSVImportRowResult =
  | { ok: true; row_index: number; donor_id: string; display_name: string }
  | { ok: false; row_index: number; display_name: string; error: string }

// ─── Money utilities ─────────────────────────────────────────────────────

/**
 * Convert a dollar amount (number or numeric string) to integer cents.
 * Handles "1234.56" → 123456, "1,234.56" → 123456, 1234.5 → 123450, etc.
 * Returns null if the input can't be parsed as a valid amount.
 */
export function dollarsToCents(input: string | number): number | null {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) return null
    return Math.round(input * 100)
  }
  if (typeof input !== 'string') return null
  const cleaned = input.trim().replace(/[$,]/g, '').replace(/\s+/g, '')
  if (!cleaned) return null
  const parsed = parseFloat(cleaned)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

export function centsToDollars(cents: number): number {
  return cents / 100
}

/**
 * Format integer cents as a currency string. Default: USD with no decimals
 * unless cents are present.
 *   formatCurrency(12345) → "$123.45"
 *   formatCurrency(12300) → "$123"
 *   formatCurrency(0)     → "$0"
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100
  const hasCents = cents % 100 !== 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(dollars)
}
