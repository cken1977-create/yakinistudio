// VIZIONZ SANKOFA · Document processing pipeline (Wave 3.3a)
//
// Single exported function: processDocument(documentId).
// Orchestrates: state transitions → Storage download → MIME-routed text
// extraction → token-cap check → sentence-boundary chunking → OpenAI
// embedding → batch insert to vs_document_chunks → ready/error finalization.
//
// Invoked from the API route /api/admin/documents/[id]/process via Vercel's
// waitUntil() in fire-and-forget mode. All errors are caught and recorded
// to the document row's processing_error column.
//
// Status state machine:
//   pending  → processing  → ready
//   pending  → processing  → error
//   error    → processing  → ready    (via operator Retry button)
//   error    → processing  → error    (Retry failed again)

import { createAdminClient } from '@/lib/supabase/admin'
import { extractByMimeType, type ExtractedDocument } from './extractors'
import { chunkBySentences, countTokens } from './chunking'
import { embedChunks } from './embeddings'

const STORAGE_BUCKET = 'vs-documents'
const MAX_TOTAL_TOKENS = 1_000_000

// ─── Public entry point ───────────────────────────────────────────────────

export async function processDocument(documentId: string): Promise<void> {
  const supabase = createAdminClient()

  // 1. Atomically claim the document by flipping pending|error → processing.
  //    If zero rows are affected, another worker has it; exit silently.
  const claimed = await claimDocument(supabase, documentId)
  if (!claimed) return

  try {
    // 2. Re-read the row in its now-processing state for full metadata.
    const doc = await fetchDocumentRow(supabase, documentId)

    // 3. Download the file from Storage.
    const buffer = await downloadFile(supabase, doc.storage_path)

    // 4. Extract text + structural metadata, routed by MIME type.
    const extracted = await extractByMimeType(doc.mime_type, buffer)

    // 5. Compute total tokens across all extracted text. Enforce 1M cap.
    const fullText = collectFullText(extracted)
    const totalTokens = countTokens(fullText)

    if (totalTokens > MAX_TOTAL_TOKENS) {
      throw new Error(
        `File exceeds 1M token cap (${totalTokens.toLocaleString()} tokens). ` +
        `Split into smaller documents and re-upload.`
      )
    }

    if (totalTokens === 0) {
      // Empty document — possibly scanned/image-only PDF, blank file, etc.
      // Mark as ready with chunk_count=0 rather than error; the operator
      // can decide whether to delete or re-upload.
      await finalizeReady(supabase, documentId, 0)
      return
    }

    // 6. Chunk by sentence boundary, per MIME-aware text source.
    //    Each chunk row carries its own metadata for source attribution.
    const chunkRows = buildChunkRows(documentId, extracted)

    if (chunkRows.length === 0) {
      await finalizeReady(supabase, documentId, 0)
      return
    }

    // 7. Embed all chunks in batch.
    const chunkTexts = chunkRows.map((c) => c.content)
    const embeddings = await embedChunks(chunkTexts)

    if (embeddings.length !== chunkRows.length) {
      throw new Error(
        `Embedding count mismatch: got ${embeddings.length} for ${chunkRows.length} chunks.`
      )
    }

    // Attach embeddings to chunk rows in alignment-preserving order.
    const insertRows = chunkRows.map((c, i) => ({
      ...c,
      embedding: embeddings[i],
    }))

    // 8. Batch-insert all chunks.
    const { error: insertError } = await supabase
      .from('vs_document_chunks')
      .insert(insertRows)

    if (insertError) {
      throw new Error(`Chunk insert failed: ${insertError.message}`)
    }

    // 9. Finalize: ready + chunk_count.
    await finalizeReady(supabase, documentId, chunkRows.length)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await finalizeError(supabase, documentId, message)
  }
}

// ─── State transitions ────────────────────────────────────────────────────

async function claimDocument(
  supabase: ReturnType<typeof createAdminClient>,
  documentId: string
): Promise<boolean> {
  // Flip pending|error → processing in one atomic update.
  // If the row is already 'processing' or 'ready', .in() filter excludes it,
  // affected rows is 0, and we return false (silent no-op).
  const { data, error } = await supabase
    .from('vs_documents')
    .update({
      processing_status: 'processing',
      processing_error: null,
    })
    .eq('id', documentId)
    .in('processing_status', ['pending', 'error'])
    .select('id')

  if (error) {
    // Hard failure on the claim itself — log via stderr (Vercel captures
    // console.error to function logs) and exit.
    console.error('claimDocument failed:', error.message)
    return false
  }

  return Array.isArray(data) && data.length === 1
}

async function finalizeReady(
  supabase: ReturnType<typeof createAdminClient>,
  documentId: string,
  chunkCount: number
): Promise<void> {
  await supabase
    .from('vs_documents')
    .update({
      processing_status: 'ready',
      chunk_count: chunkCount,
      processing_error: null,
    })
    .eq('id', documentId)
}

async function finalizeError(
  supabase: ReturnType<typeof createAdminClient>,
  documentId: string,
  message: string
): Promise<void> {
  await supabase
    .from('vs_documents')
    .update({
      processing_status: 'error',
      processing_error: message.slice(0, 1000), // hard cap on stored error length
    })
    .eq('id', documentId)
}

// ─── Row read ─────────────────────────────────────────────────────────────

type DocumentRow = {
  id: string
  storage_path: string
  mime_type: string
  file_name: string
}

async function fetchDocumentRow(
  supabase: ReturnType<typeof createAdminClient>,
  documentId: string
): Promise<DocumentRow> {
  const { data, error } = await supabase
    .from('vs_documents')
    .select('id, storage_path, mime_type, file_name')
    .eq('id', documentId)
    .single()

  if (error || !data) {
    throw new Error(
      `Document row not found: ${documentId} ` +
      `(${error?.message ?? 'no data'})`
    )
  }

  return data as DocumentRow
}

// ─── Storage download ─────────────────────────────────────────────────────

async function downloadFile(
  supabase: ReturnType<typeof createAdminClient>,
  storagePath: string
): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(storagePath)

  if (error || !data) {
    throw new Error(
      `Storage download failed for ${storagePath}: ${error?.message ?? 'no data'}`
    )
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ─── Text collection (for token-cap check) ────────────────────────────────

function collectFullText(extracted: ExtractedDocument): string {
  switch (extracted.kind) {
    case 'pdf':
      return extracted.pages.map((p) => p.text).join('\n\n')
    case 'docx':
      return extracted.text
    case 'xlsx':
      return extracted.sheets.map((s) => s.text).join('\n\n')
    case 'plain':
      return extracted.text
  }
}

// ─── Chunk row construction (per-MIME metadata) ────────────────────────
//
// Schema (Wave 3.1 migration): vs_document_chunks columns are
//   id, document_id, chunk_index, content, embedding, token_count,
//   source_ref, created_at.
//
// source_ref is a flexible text field used for human-readable source
// attribution in Wave 3.4 retrieval. Per-MIME format:
//   PDF      → "Page {n}"
//   DOCX     → nearest preceding heading text, or null
//   XLSX     → "Sheet: {sheetName}"
//   plain    → null

type ChunkRow = {
  document_id: string
  chunk_index: number
  content: string
  token_count: number
  source_ref: string | null
}

function buildChunkRows(
  documentId: string,
  extracted: ExtractedDocument
): ChunkRow[] {
  switch (extracted.kind) {
    case 'pdf':
      return buildChunkRowsFromPDF(documentId, extracted)
    case 'docx':
      return buildChunkRowsFromDOCX(documentId, extracted)
    case 'xlsx':
      return buildChunkRowsFromXLSX(documentId, extracted)
    case 'plain':
      return buildChunkRowsFromPlain(documentId, extracted)
  }
}

function buildChunkRowsFromPDF(
  documentId: string,
  extracted: { pages: Array<{ pageNumber: number; text: string }> }
): ChunkRow[] {
  const rows: ChunkRow[] = []
  let chunkIndex = 0

  for (const page of extracted.pages) {
    if (!page.text.trim()) continue
    const { chunks } = chunkBySentences(page.text)
    for (const chunk of chunks) {
      rows.push({
        document_id: documentId,
        chunk_index: chunkIndex++,
        content: chunk,
        token_count: countTokens(chunk),
        source_ref: `Page ${page.pageNumber}`,
      })
    }
  }

  return rows
}

function buildChunkRowsFromDOCX(
  documentId: string,
  extracted: {
    text: string
    headings: Array<{ level: number; text: string; position: number }>
  }
): ChunkRow[] {
  const { chunks } = chunkBySentences(extracted.text)
  const rows: ChunkRow[] = []

  let cursor = 0
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const offset = extracted.text.indexOf(chunk.slice(0, 80), cursor)
    const chunkPos = offset >= 0 ? offset : cursor
    cursor = chunkPos + chunk.length

    let sourceRef: string | null = null
    for (const h of extracted.headings) {
      if (h.position <= chunkPos) sourceRef = h.text
      else break
    }

    rows.push({
      document_id: documentId,
      chunk_index: i,
      content: chunk,
      token_count: countTokens(chunk),
      source_ref: sourceRef,
    })
  }

  return rows
}

function buildChunkRowsFromXLSX(
  documentId: string,
  extracted: { sheets: Array<{ name: string; text: string }> }
): ChunkRow[] {
  const rows: ChunkRow[] = []
  let chunkIndex = 0

  for (const sheet of extracted.sheets) {
    if (!sheet.text.trim()) continue
    const { chunks } = chunkBySentences(sheet.text)
    for (const chunk of chunks) {
      rows.push({
        document_id: documentId,
        chunk_index: chunkIndex++,
        content: chunk,
        token_count: countTokens(chunk),
        source_ref: `Sheet: ${sheet.name}`,
      })
    }
  }

  return rows
}

function buildChunkRowsFromPlain(
  documentId: string,
  extracted: { text: string }
): ChunkRow[] {
  const { chunks } = chunkBySentences(extracted.text)
  return chunks.map((chunk, i) => ({
    document_id: documentId,
    chunk_index: i,
    content: chunk,
    token_count: countTokens(chunk),
    source_ref: null,
  }))
}
