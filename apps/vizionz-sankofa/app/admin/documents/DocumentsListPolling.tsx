'use client'

// VIZIONZ SANKOFA · /admin/documents · Polling side-effect (Wave 3.3a)
//
// Renders nothing. Mounted alongside the documents list to drive live
// status updates while any document is in a non-terminal state.
//
// Behavior:
//   - On mount and on every prop update, check if any document is in
//     'pending' or 'processing' state.
//   - If yes, start a 3-second interval that calls router.refresh().
//     router.refresh() re-runs the parent server component, re-fetches
//     documents from Supabase, and re-renders the row list with fresh
//     statuses. Next.js handles cache invalidation transparently.
//   - If no (all rows are 'ready' or 'error'), stop polling.
//
// This pattern keeps the page interactive without server-sent events or
// websocket infrastructure. At operator scale (3 users, dozens of docs
// per batch), the load is negligible.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const POLL_INTERVAL_MS = 3000

type PollableDocument = {
  processing_status: 'pending' | 'processing' | 'ready' | 'error'
}

export function DocumentsListPolling({
  documents,
}: {
  documents: PollableDocument[]
}) {
  const router = useRouter()

  // Compute whether polling is needed. This is recomputed on every render,
  // which is cheap (array filter on a few dozen items) and ensures the
  // useEffect dependency tracks the actual condition we care about.
  const hasInFlight = documents.some(
    (d) => d.processing_status === 'pending' || d.processing_status === 'processing'
  )

  useEffect(() => {
    if (!hasInFlight) return

    const interval = setInterval(() => {
      router.refresh()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [hasInFlight, router])

  return null
}
