'use server'

// VIZIONZ SANKOFA · /admin/documents · Server actions (Wave 3.2)
// Batch upload, list, update metadata, delete documents.
// All actions require operator role — sensitive content (bank
// statements, grants). Wave 3.3 will hook auto-fire processing here.

import { revalidatePath } from 'next/cache'
import { requireOperator } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export type DocumentCategory =
  | 'grant_application'
  | 'grant_award'
  | 'budget'
  | 'bank_statement'
  | 'financial_report'
  | 'tax_form'
  | 'board_minutes'
  | 'mou'
  | 'contract'
  | 'program_documentation'
  | 'policy'
  | 'correspondence'
  | 'other'

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  grant_application: 'Grant Application',
  grant_award: 'Grant Award',
  budget: 'Budget',
  bank_statement: 'Bank Statement',
  financial_report: 'Financial Report',
  tax_form: 'Tax Form',
  board_minutes: 'Board Minutes',
  mou: 'MOU',
  contract: 'Contract',
  program_documentation: 'Program Documentation',
  policy: 'Policy',
  correspondence: 'Correspondence',
  other: 'Other',
}

export type UploadDocumentInput = {
  title: string
  category: DocumentCategory
  description: string | null
  document_date: string | null
  related_intake: string | null
  related_program: string | null
  file_name: string
  file_size_bytes: number
  mime_type: string
  storage_path: string
}

export type UploadResult =
  | { ok: true; document_id: string; storage_path: string }
  | { ok: false; error: string; file_name: string }

// ─── Bulk record insert after client uploads ───────────────────────
// The client-side handles the actual binary upload to Storage (because
// File objects don't serialize across server-action boundaries cleanly).
// This action takes the metadata + completed storage_path and inserts
// the vs_documents row. Returns per-file results.

export async function registerUploadedDocuments(
  inputs: UploadDocumentInput[]
): Promise<UploadResult[]> {
  const user = await requireOperator()
  const supabase = await createClient()

  const results: UploadResult[] = []

  for (const input of inputs) {
    // Validate required fields
    if (!input.title.trim()) {
      results.push({
        ok: false,
        error: 'Title is required',
        file_name: input.file_name,
      })
      continue
    }
    if (!input.storage_path) {
      results.push({
        ok: false,
        error: 'Storage path missing — file upload likely failed',
        file_name: input.file_name,
      })
      continue
    }
    if (input.file_size_bytes <= 0) {
      results.push({
        ok: false,
        error: 'File size invalid',
        file_name: input.file_name,
      })
      continue
    }

    // Insert metadata row
    const { data, error } = await supabase
      .from('vs_documents')
      .insert({
        title: input.title.trim(),
        category: input.category,
        description: input.description?.trim() || null,
        document_date: input.document_date || null,
        related_intake: input.related_intake || null,
        related_program: input.related_program?.trim() || null,
        file_name: input.file_name,
        file_size_bytes: input.file_size_bytes,
        mime_type: input.mime_type,
        storage_path: input.storage_path,
        processing_status: 'pending',
        uploaded_by: user.id,
      })
      .select('id, storage_path')
      .single()

    if (error || !data) {
      results.push({
        ok: false,
        error: error?.message ?? 'Database insert failed',
        file_name: input.file_name,
      })
      continue
    }

    results.push({
      ok: true,
      document_id: data.id,
      storage_path: data.storage_path,
    })

    // Wave 3.3 hook point: fire processing pipeline here when ready
    // For now, document stays in 'pending' until Wave 3.3 ships.
  }

  revalidatePath('/admin/documents')
  revalidatePath('/admin')

  return results
}

// ─── Generate signed upload URL ─────────────────────────────────────
// Returns a path the client can use to upload directly to Storage.
// Format: {user_id}/{timestamp}-{safe-filename}
// User ID prefix lets us trace uploads in Storage browser.

export async function generateUploadPath(
  fileName: string
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const user = await requireOperator()

  // Sanitize filename — keep only safe chars
  const safeName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)

  const timestamp = Date.now()
  const path = `${user.id}/${timestamp}-${safeName}`

  return { ok: true, path }
}

// ─── Update document metadata ───────────────────────────────────────

export type UpdateDocumentInput = {
  title?: string
  category?: DocumentCategory
  description?: string | null
  document_date?: string | null
  related_intake?: string | null
  related_program?: string | null
}

export async function updateDocumentMetadata(
  documentId: string,
  updates: UpdateDocumentInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireOperator()
  const supabase = await createClient()

  const patch: Record<string, unknown> = {}
  if (updates.title !== undefined) patch.title = updates.title.trim()
  if (updates.category !== undefined) patch.category = updates.category
  if (updates.description !== undefined)
    patch.description = updates.description?.trim() || null
  if (updates.document_date !== undefined)
    patch.document_date = updates.document_date || null
  if (updates.related_intake !== undefined)
    patch.related_intake = updates.related_intake || null
  if (updates.related_program !== undefined)
    patch.related_program = updates.related_program?.trim() || null

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No updates provided' }
  }

  const { error } = await supabase
    .from('vs_documents')
    .update(patch)
    .eq('id', documentId)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/documents')
  return { ok: true }
}

// ─── Delete document ────────────────────────────────────────────────
// Cascades to vs_document_chunks via FK. Also removes Storage object.

export async function deleteDocument(
  documentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireOperator()
  const supabase = await createClient()

  // Fetch storage_path first so we can delete the file too
  const { data: doc, error: fetchError } = await supabase
    .from('vs_documents')
    .select('storage_path')
    .eq('id', documentId)
    .single()

  if (fetchError || !doc) {
    return { ok: false, error: 'Document not found' }
  }

  // Delete the Storage object (best-effort — if this fails, row delete
  // still proceeds; orphan file in Storage is recoverable manually)
  await supabase.storage
    .from('vs-documents')
    .remove([doc.storage_path])
    .catch(() => {
      // Silently swallow — orphan file is acceptable; row removal is
      // the load-bearing operation
    })

  // Delete the metadata row (cascades chunks)
  const { error: deleteError } = await supabase
    .from('vs_documents')
    .delete()
    .eq('id', documentId)

  if (deleteError) {
    return { ok: false, error: deleteError.message }
  }

  revalidatePath('/admin/documents')
  revalidatePath('/admin')
  return { ok: true }
}
