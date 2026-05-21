'use server'

// Server actions for the migrate flow.
// Handles file upload → parse → preview → commit.
// Principal-only.

import { randomUUID } from 'node:crypto'
import { requirePrincipal } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { parseWorkbook } from './parsers'
import type { MigrationPreview, ParsedWorkbook, TabPreview } from './types'

// In-memory store keyed by batchId.
// Substrate-honest: this only works on a single Vercel instance; serverless
// instances may not share memory. For Wave 3.5 v1 the upload + commit happens
// in the same browser session so single-instance memory is acceptable.
// Future: persist parsed batches to Supabase storage for multi-instance reads.
const pendingBatches = new Map<string, { workbook: ParsedWorkbook; createdAt: number }>()

// Garbage collect old batches (10 min TTL)
function gc() {
  const cutoff = Date.now() - 10 * 60 * 1000
  for (const [k, v] of pendingBatches.entries()) {
    if (v.createdAt < cutoff) pendingBatches.delete(k)
  }
}

export async function uploadAndPreviewAction(form: FormData): Promise<
  | { ok: true; batchId: string; preview: MigrationPreview }
  | { ok: false; error: string }
> {
  await requirePrincipal()

  const file = form.get('file')
  if (!(file instanceof File)) {
    return { ok: false, error: 'No file provided' }
  }
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return { ok: false, error: 'File must be .xlsx' }
  }
  if (file.size > 50 * 1024 * 1024) {
    return { ok: false, error: 'File too large (max 50MB)' }
  }

  let parsed
  try {
    const buffer = await file.arrayBuffer()
    parsed = parseWorkbook(buffer)
  } catch (e) {
    return { ok: false, error: `Parse failed: ${(e as Error).message}` }
  }

  // Build per-tab preview counts
  const tabCounts = new Map<string, TabPreview>()
  for (const row of parsed.rows) {
    if (!tabCounts.has(row.tabName)) {
      tabCounts.set(row.tabName, {
        tabName: row.tabName,
        rowsRead: 0,
        willCreate: 0,
        duplicatesMerged: 0,
        skipped: 0,
      })
    }
    const t = tabCounts.get(row.tabName)!
    t.rowsRead++
    if (row.intent.kind === 'skip') t.skipped++
    else if (row.intent.kind === 'merge_participant') t.duplicatesMerged++
    else t.willCreate++
  }

  const warnings: string[] = []
  if (parsed.unknownTabs.length > 0) {
    warnings.push(`Unrecognized tabs (will be skipped): ${parsed.unknownTabs.join(', ')}`)
  }

  const batchId = randomUUID()
  gc()
  pendingBatches.set(batchId, {
    workbook: { fileName: file.name, rows: parsed.rows },
    createdAt: Date.now(),
  })

  return {
    ok: true,
    batchId,
    preview: { tabs: Array.from(tabCounts.values()), warnings },
  }
}

export async function commitMigrationAction(batchId: string): Promise<
  | { ok: true; counts: Record<string, number> }
  | { ok: false; error: string }
> {
  const principal = await requirePrincipal()
  const supabase = await createClient()

  const batch = pendingBatches.get(batchId)
  if (!batch) {
    return { ok: false, error: 'Batch expired or not found. Re-upload the workbook.' }
  }

  const counts: Record<string, number> = {
    participants_created: 0,
    participants_merged: 0,
    services_created: 0,
    case_notes_created: 0,
    archives_created: 0,
    identifiers_created: 0,
    family_members_created: 0,
    addresses_created: 0,
    skipped: 0,
  }

  // Pass 1: build participant lookup by matchKey
  const participantsByKey = new Map<string, string>() // matchKey -> participant uuid
  for (const row of batch.workbook.rows) {
    if (row.intent.kind !== 'create_participant' && row.intent.kind !== 'merge_participant') continue
    const matchKey = (row.intent as { matchKey?: string }).matchKey
    if (!matchKey) continue
    if (participantsByKey.has(matchKey)) {
      counts.participants_merged++
      continue
    }
    const data = row.intent.data as Record<string, unknown>
    // Insert participant — only the columns we know exist on participants
    const insertData: Record<string, unknown> = {
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth ?? null,
      phone_primary: data.phone_primary ?? null,
      email: data.email ?? null,
      gender: data.gender ?? null,
      race_ethnicity: data.race_ethnicity ?? null,
      household_size: data.household_size ?? null,
      intake_date: data.intake_date ?? null,
      referral_source: data.referral_source ?? null,
      country_of_origin: data.country_of_origin ?? null,
      demographic_legacy: data.demographic_legacy ?? null,
      status: data.status ?? null,
      legacy_source_tabs: [data.legacy_source_tab].filter(Boolean),
      created_by: principal.id,
    }
    const { data: inserted, error } = await supabase
      .from('participants')
      .insert(insertData)
      .select('id')
      .single()
    if (error || !inserted) {
      await supabase.from('migration_log').insert({
        migration_batch_id: batchId,
        source_file: batch.workbook.fileName,
        source_tab: row.tabName,
        source_row_number: row.rowNumber,
        target_table: 'participants',
        status: 'error',
        notes: error?.message ?? 'unknown',
        raw_row_json: row.raw,
      })
      continue
    }
    participantsByKey.set(matchKey, inserted.id)
    counts.participants_created++
    await supabase.from('migration_log').insert({
      migration_batch_id: batchId,
      source_file: batch.workbook.fileName,
      source_tab: row.tabName,
      source_row_number: row.rowNumber,
      target_table: 'participants',
      target_record_id: inserted.id,
      status: 'success',
      raw_row_json: row.raw,
    })
  }

  // Pass 2: archives, services, case notes
  for (const row of batch.workbook.rows) {
    if (row.intent.kind === 'archive') {
      const data = row.intent.data as Record<string, unknown>
      const { error } = await supabase.from('historical_archive').insert({
        source_program: data.source_program,
        source_tab: data.source_tab,
        record_type: data.record_type,
        participant_name: data.participant_name ?? null,
        record_date: data.record_date ?? null,
        raw_content: data.raw_content,
        searchable_text: data.searchable_text,
      })
      if (!error) counts.archives_created++
      await supabase.from('migration_log').insert({
        migration_batch_id: batchId,
        source_file: batch.workbook.fileName,
        source_tab: row.tabName,
        source_row_number: row.rowNumber,
        target_table: 'historical_archive',
        status: error ? 'error' : 'success',
        notes: error?.message ?? null,
        raw_row_json: row.raw,
      })
    } else if (row.intent.kind === 'skip') {
      counts.skipped++
      await supabase.from('migration_log').insert({
        migration_batch_id: batchId,
        source_file: batch.workbook.fileName,
        source_tab: row.tabName,
        source_row_number: row.rowNumber,
        target_table: 'none',
        status: 'skipped',
        notes: row.intent.reason,
        raw_row_json: row.raw,
      })
    }
    // Services + case notes implemented in Phase 3.5b — they need participant matching
    // by name across the workbook + staff_id lookup. For v1, those are logged but
    // not yet written. Counts will reflect this.
  }

  pendingBatches.delete(batchId)

  return { ok: true, counts }
}
