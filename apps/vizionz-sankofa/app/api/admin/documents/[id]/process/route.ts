// VIZIONZ SANKOFA · /api/admin/documents/[id]/process (Wave 3.3a)
//
// Fire-and-forget trigger for the document processing pipeline.
// Returns 202 Accepted immediately; pipeline runs to completion in
// background via Vercel's waitUntil().
//
// Called from:
//   - registerUploadedDocuments() in actions/documents.ts (auto-trigger
//     after each successful upload row insert)
//   - The Retry button in DocumentRow.tsx (when status='error')
//
// Auth: requireOperator(). Non-operators get 403.

import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { requireOperator } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { processDocument } from '@/lib/processing/pipeline'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth gate.
  try {
    await requireOperator()
  } catch {
    return NextResponse.json(
      { error: 'Operator role required.' },
      { status: 403 }
    )
  }

  // 2. Resolve dynamic route param. Next.js 16 returns params as a Promise.
  const { id: documentId } = await params

  if (!documentId || typeof documentId !== 'string') {
    return NextResponse.json(
      { error: 'documentId is required.' },
      { status: 400 }
    )
  }

  // 3. Verify the document exists and is in a processable state.
  //    We use the admin client here because we want a server-side
  //    authoritative read regardless of RLS quirks.
  const supabase = createAdminClient()
  const { data: doc, error: lookupError } = await supabase
    .from('vs_documents')
    .select('id, processing_status')
    .eq('id', documentId)
    .single()

  if (lookupError || !doc) {
    return NextResponse.json(
      { error: 'Document not found.' },
      { status: 404 }
    )
  }

  if (doc.processing_status !== 'pending' && doc.processing_status !== 'error') {
    // Already processing or already ready. Idempotent no-op: tell the caller
    // we accepted the request but processing was a no-op.
    return NextResponse.json(
      { id: documentId, status: doc.processing_status, note: 'No-op.' },
      { status: 202 }
    )
  }

  // 4. Fire the pipeline in the background via Vercel waitUntil.
  //    The response returns immediately; the function keeps running until
  //    processDocument resolves.
  after(async () => {
    try {
      await processDocument(documentId)
    } catch (err) {
      // processDocument catches all its own errors and writes them to the
      // row. If something escapes the catch, log it; we can't update the
      // response (already sent), so failure has to surface via the row.
      console.error(
        `[process route] uncaught error for document ${documentId}:`,
        err
      )
    }
  })

  return NextResponse.json(
    { id: documentId, status: 'processing', accepted: true },
    { status: 202 }
  )
}
