'use server'

// VIZIONZ SANKOFA · /admin/actions/donors.ts (Wave 3.5)
//
// Server actions for the donor management surface. Five mutations:
//   - createDonor    : single donor entry (from AddDonorModal)
//   - updateDonor    : edit existing donor (from DonorRow inline editor)
//   - deleteDonor    : remove donor + cascade to gifts
//   - recordGift     : log a gift for an existing donor
//   - bulkImportDonors : CSV import batch insert
//
// Pattern matches /admin/actions/documents.ts from Wave 3.2. Pure async
// function exports only (no const exports per Wave 3.2 hotfix lesson —
// types live in app/admin/donors/types.ts).

import { revalidatePath } from 'next/cache'
import { requireOperator } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  type CreateDonorInput,
  type UpdateDonorInput,
  type CreateGiftInput,
  type DonorMutationResult,
  type GiftMutationResult,
  type CSVImportRowResult,
  dollarsToCents,
} from '../donors/types'

// ─── Helpers ─────────────────────────────────────────────────────────────

function buildDisplayName(input: {
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
}): string | null {
  const explicit = input.display_name?.trim()
  if (explicit) return explicit

  const parts = [input.first_name, input.last_name]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)

  if (parts.length === 0) return null
  return parts.join(' ')
}

function normalizeTags(tags?: string[]): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i) // dedupe
}

// ─── createDonor ─────────────────────────────────────────────────────────

export async function createDonor(
  input: CreateDonorInput
): Promise<DonorMutationResult> {
  try {
    await requireOperator()
  } catch {
    return { ok: false, error: 'Operator role required.' }
  }

  const displayName = buildDisplayName(input)
  if (!displayName) {
    return {
      ok: false,
      error: 'Donor must have at least a display name or first/last name.',
    }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('donors')
    .insert({
      first_name: input.first_name?.trim() || null,
      last_name: input.last_name?.trim() || null,
      display_name: displayName,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address_line1: input.address_line1?.trim() || null,
      address_line2: input.address_line2?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      postal_code: input.postal_code?.trim() || null,
      donor_type: input.donor_type,
      status: input.status ?? 'active',
      tags: normalizeTags(input.tags),
      notes: input.notes?.trim() || null,
      recurring: input.recurring ?? false,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/donors')
  revalidatePath('/admin')
  revalidatePath('/admin/intelligence')

  return { ok: true, donor_id: (data as { id: string }).id }
}

// ─── updateDonor ─────────────────────────────────────────────────────────

export async function updateDonor(
  donor_id: string,
  input: UpdateDonorInput
): Promise<DonorMutationResult> {
  try {
    await requireOperator()
  } catch {
    return { ok: false, error: 'Operator role required.' }
  }

  if (!donor_id) {
    return { ok: false, error: 'donor_id is required.' }
  }

  // Build a partial update payload. Only include fields the caller sent.
  const payload: Record<string, unknown> = {}

  if (input.first_name !== undefined) payload.first_name = input.first_name?.trim() || null
  if (input.last_name !== undefined) payload.last_name = input.last_name?.trim() || null
  if (input.email !== undefined) payload.email = input.email?.trim() || null
  if (input.phone !== undefined) payload.phone = input.phone?.trim() || null
  if (input.address_line1 !== undefined) payload.address_line1 = input.address_line1?.trim() || null
  if (input.address_line2 !== undefined) payload.address_line2 = input.address_line2?.trim() || null
  if (input.city !== undefined) payload.city = input.city?.trim() || null
  if (input.state !== undefined) payload.state = input.state?.trim() || null
  if (input.postal_code !== undefined) payload.postal_code = input.postal_code?.trim() || null
  if (input.donor_type !== undefined) payload.donor_type = input.donor_type
  if (input.status !== undefined) payload.status = input.status
  if (input.tags !== undefined) payload.tags = normalizeTags(input.tags)
  if (input.notes !== undefined) payload.notes = input.notes?.trim() || null
  if (input.recurring !== undefined) payload.recurring = input.recurring

  // Handle display_name with auto-fill if blank but first/last provided.
  if (input.display_name !== undefined) {
    const built = buildDisplayName({
      display_name: input.display_name,
      first_name: input.first_name,
      last_name: input.last_name,
    })
    if (built === null) {
      return {
        ok: false,
        error: 'display_name cannot be blank without first/last name.',
      }
    }
    payload.display_name = built
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: 'No fields to update.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('donors')
    .update(payload)
    .eq('id', donor_id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/donors')
  revalidatePath('/admin')

  return { ok: true, donor_id }
}

// ─── deleteDonor ─────────────────────────────────────────────────────────

export async function deleteDonor(
  donor_id: string
): Promise<DonorMutationResult> {
  try {
    await requireOperator()
  } catch {
    return { ok: false, error: 'Operator role required.' }
  }

  if (!donor_id) {
    return { ok: false, error: 'donor_id is required.' }
  }

  const supabase = createAdminClient()
  // donor_gifts will cascade-delete via FK ON DELETE CASCADE.
  const { error } = await supabase.from('donors').delete().eq('id', donor_id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/donors')
  revalidatePath('/admin')
  revalidatePath('/admin/intelligence')

  return { ok: true, donor_id }
}

// ─── recordGift ──────────────────────────────────────────────────────────

export async function recordGift(
  input: CreateGiftInput
): Promise<GiftMutationResult> {
  try {
    await requireOperator()
  } catch {
    return { ok: false, error: 'Operator role required.' }
  }

  // Validate amount_cents — defense in depth even though it's typed as number.
  let amountCents = input.amount_cents
  if (typeof amountCents !== 'number' || !Number.isFinite(amountCents) || amountCents <= 0) {
    // Last-chance recovery: if a string slipped through, try to parse.
    const recovered = dollarsToCents(amountCents as unknown as string)
    if (recovered === null || recovered <= 0) {
      return { ok: false, error: 'amount_cents must be a positive number.' }
    }
    amountCents = recovered
  }

  if (!input.donor_id) {
    return { ok: false, error: 'donor_id is required.' }
  }

  if (!input.gift_date) {
    return { ok: false, error: 'gift_date is required (YYYY-MM-DD).' }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('donor_gifts')
    .insert({
      donor_id: input.donor_id,
      amount_cents: amountCents,
      gift_date: input.gift_date,
      method: input.method,
      designation: input.designation?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/donors')
  revalidatePath('/admin')
  revalidatePath('/admin/intelligence')

  return { ok: true, gift_id: (data as { id: string }).id }
}

// ─── bulkImportDonors ────────────────────────────────────────────────────

export async function bulkImportDonors(
  rows: CreateDonorInput[]
): Promise<{ ok: boolean; results: CSVImportRowResult[] }> {
  try {
    await requireOperator()
  } catch {
    return {
      ok: false,
      results: rows.map((r, i) => ({
        ok: false,
        row_index: i,
        display_name: buildDisplayName(r) ?? '(unnamed)',
        error: 'Operator role required.',
      })),
    }
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, results: [] }
  }

  // Validate every row up-front. Don't insert ANY if validation fails on any row —
  // CSV importer UI will surface row-level errors and let the operator fix them.
  const validated: Array<
    | { ok: true; row_index: number; payload: Record<string, unknown>; display_name: string }
    | { ok: false; row_index: number; display_name: string; error: string }
  > = rows.map((input, i) => {
    const displayName = buildDisplayName(input)
    if (!displayName) {
      return {
        ok: false,
        row_index: i,
        display_name: '(unnamed)',
        error: 'Donor must have at least display name or first/last name.',
      }
    }
    return {
      ok: true,
      row_index: i,
      display_name: displayName,
      payload: {
        first_name: input.first_name?.trim() || null,
        last_name: input.last_name?.trim() || null,
        display_name: displayName,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        address_line1: input.address_line1?.trim() || null,
        address_line2: input.address_line2?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        postal_code: input.postal_code?.trim() || null,
        donor_type: input.donor_type,
        status: input.status ?? 'active',
        tags: normalizeTags(input.tags),
        notes: input.notes?.trim() || null,
        recurring: input.recurring ?? false,
      },
    }
  })

  const validRows = validated.filter((v) => v.ok === true) as Array<{
    ok: true
    row_index: number
    payload: Record<string, unknown>
    display_name: string
  }>
  const invalidRows = validated.filter((v) => v.ok === false) as Array<{
    ok: false
    row_index: number
    display_name: string
    error: string
  }>

  if (validRows.length === 0) {
    return { ok: false, results: invalidRows }
  }

  // Insert valid rows. Use bulk insert for efficiency; Supabase returns inserted IDs in order.
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('donors')
    .insert(validRows.map((v) => v.payload))
    .select('id')

  if (error) {
    // Whole batch failed — surface the error against every valid row.
    return {
      ok: false,
      results: [
        ...invalidRows,
        ...validRows.map((v) => ({
          ok: false as const,
          row_index: v.row_index,
          display_name: v.display_name,
          error: error.message,
        })),
      ],
    }
  }

  const insertedIds = (data ?? []) as Array<{ id: string }>
  const successResults: CSVImportRowResult[] = validRows.map((v, i) => ({
    ok: true,
    row_index: v.row_index,
    donor_id: insertedIds[i]?.id ?? '',
    display_name: v.display_name,
  }))

  revalidatePath('/admin/donors')
  revalidatePath('/admin')
  revalidatePath('/admin/intelligence')

  return {
    ok: invalidRows.length === 0,
    results: [...successResults, ...invalidRows].sort(
      (a, b) => a.row_index - b.row_index
    ),
  }
}
