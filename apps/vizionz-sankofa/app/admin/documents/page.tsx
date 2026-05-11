// VIZIONZ SANKOFA · /admin/documents (Wave 3.2)
// Operator-only document library. Carly, Khadijah, Clarence upload and
// file organizational documents (grants, budgets, bank statements, etc.).
// Wave 3.3 will surface processing status here; Wave 3.4 adds chat.

import Link from 'next/link'
import { requireOperator } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from './types'
import { DocumentRow } from './DocumentRow'
import UploadButton from './UploadButton'

export const dynamic = 'force-dynamic'

type DocumentRecord = {
  id: string
  title: string
  category: DocumentCategory
  description: string | null
  document_date: string | null
  storage_path: string
  file_name: string
  file_size_bytes: number
  mime_type: string
  processing_status: 'pending' | 'processing' | 'ready' | 'error'
  processing_error: string | null
  chunk_count: number
  related_program: string | null
  related_intake: string | null
  uploaded_by: string
  uploaded_at: string
  created_at: string
}

type UploaderInfo = {
  user_id: string
  display_name: string | null
  email: string
}

type FilterValue = DocumentCategory | 'all'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  await requireOperator()
  const supabase = await createClient()
  const params = await searchParams

  const filter = (params.category ?? 'all') as FilterValue
  const sortBy = (params.sort ?? 'uploaded_desc') as
    | 'uploaded_desc'
    | 'uploaded_asc'
    | 'date_desc'
    | 'date_asc'

  // Fetch documents
  let query = supabase.from('vs_documents').select('*')
  if (filter !== 'all') {
    query = query.eq('category', filter)
  }
  switch (sortBy) {
    case 'uploaded_desc':
      query = query.order('uploaded_at', { ascending: false })
      break
    case 'uploaded_asc':
      query = query.order('uploaded_at', { ascending: true })
      break
    case 'date_desc':
      query = query.order('document_date', {
        ascending: false,
        nullsFirst: false,
      })
      break
    case 'date_asc':
      query = query.order('document_date', {
        ascending: true,
        nullsFirst: false,
      })
      break
  }

  const { data: documents, error } = await query

  // Fetch uploader display names for any uploaded_by ids present
  const uploaderIds = Array.from(
    new Set((documents ?? []).map((d) => d.uploaded_by))
  )

  const uploaderMap = new Map<string, UploaderInfo>()
  if (uploaderIds.length > 0) {
    const { data: uploaders } = await supabase
      .from('vs_operators')
      .select('user_id, display_name, email')
      .in('user_id', uploaderIds)

    for (const u of uploaders ?? []) {
      uploaderMap.set(u.user_id, u as UploaderInfo)
    }
  }

  // Fetch category counts for filter pills
  const { data: countRows } = await supabase
    .from('vs_documents')
    .select('category')

  const categoryCounts = new Map<string, number>()
  for (const row of countRows ?? []) {
    const c = row.category as string
    categoryCounts.set(c, (categoryCounts.get(c) ?? 0) + 1)
  }
  const totalCount = countRows?.length ?? 0
  const pendingCount =
    documents?.filter((d) => d.processing_status === 'pending').length ?? 0

  return (
    <>
      {/* Page kicker + title row */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#CE1126',
            marginBottom: '8px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Documents · Wave 3
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <h1
              style={{
                fontSize: '32px',
                lineHeight: 1.15,
                fontWeight: 600,
                color: '#0A0A0A',
                marginBottom: '8px',
                fontFamily: '"DM Serif Display", Georgia, serif',
              }}
            >
              Document Library
            </h1>
            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.5,
                color: 'rgba(10, 10, 10, 0.65)',
                margin: 0,
              }}
            >
              Grants, budgets, bank statements, board minutes, and any other
              organizational documents. Upload here so Yakini Intelligence
              can read across them.
            </p>
          </div>

          <UploadButton />
        </div>
      </div>

      {/* Filter pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '20px',
        }}
      >
        <FilterPill
          href="/admin/documents"
          active={filter === 'all'}
          label="All"
          count={totalCount}
        />
        {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map(
          (cat) => {
            const count = categoryCounts.get(cat) ?? 0
            if (count === 0 && filter !== cat) return null
            return (
              <FilterPill
                key={cat}
                href={`/admin/documents?category=${cat}`}
                active={filter === cat}
                label={DOCUMENT_CATEGORY_LABELS[cat]}
                count={count}
              />
            )
          }
        )}
      </div>

      {/* Sort selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          fontSize: '12px',
          color: 'rgba(10, 10, 10, 0.65)',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ fontWeight: 600 }}>Sort:</span>
        <SortLink
          href={buildSortHref(filter, 'uploaded_desc')}
          active={sortBy === 'uploaded_desc'}
        >
          Newest upload
        </SortLink>
        <span>·</span>
        <SortLink
          href={buildSortHref(filter, 'uploaded_asc')}
          active={sortBy === 'uploaded_asc'}
        >
          Oldest upload
        </SortLink>
        <span>·</span>
        <SortLink
          href={buildSortHref(filter, 'date_desc')}
          active={sortBy === 'date_desc'}
        >
          Newest doc date
        </SortLink>
        <span>·</span>
        <SortLink
          href={buildSortHref(filter, 'date_asc')}
          active={sortBy === 'date_asc'}
        >
          Oldest doc date
        </SortLink>
      </div>

      {/* Pending banner if relevant */}
      {pendingCount > 0 && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(206, 17, 38, 0.06)',
            borderLeft: '3px solid #CE1126',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#0A0A0A',
            lineHeight: 1.5,
          }}
        >
          <strong>{pendingCount}</strong>{' '}
          {pendingCount === 1 ? 'document is' : 'documents are'} waiting for
          processing. Yakini Intelligence will read them once Wave 3.3 ships.
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(206, 17, 38, 0.08)',
            borderLeft: '3px solid #CE1126',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#0A0A0A',
          }}
        >
          Could not load documents: {error.message}
        </div>
      )}

      {/* Empty state */}
      {!error && (!documents || documents.length === 0) && (
        <div
          style={{
            padding: '48px 24px',
            background: '#FFFFFF',
            border: '1px dashed rgba(10, 10, 10, 0.15)',
            borderRadius: '2px',
            textAlign: 'center',
            color: 'rgba(10, 10, 10, 0.55)',
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          {filter === 'all'
            ? 'No documents yet. Tap Upload Documents above to get started.'
            : `No documents in "${DOCUMENT_CATEGORY_LABELS[filter as DocumentCategory]}" yet.`}
        </div>
      )}

      {/* Document list */}
      {documents && documents.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {documents.map((doc) => {
            const uploader = uploaderMap.get(doc.uploaded_by)
            return (
              <DocumentRow
                key={doc.id}
                document={doc as DocumentRecord}
                uploaderName={
                  uploader?.display_name ??
                  uploader?.email?.split('@')[0] ??
                  'Unknown'
                }
              />
            )
          })}
        </div>
      )}
    </>
  )
}

function buildSortHref(filter: FilterValue, sort: string): string {
  const params = new URLSearchParams()
  if (filter !== 'all') params.set('category', filter)
  params.set('sort', sort)
  return `/admin/documents?${params.toString()}`
}

function FilterPill({
  href,
  active,
  label,
  count,
}: {
  href: string
  active: boolean
  label: string
  count: number
}) {
  return (
    <Link
      href={href}
      style={{
        padding: '6px 12px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: active ? '#FFFFFF' : '#0A0A0A',
        background: active ? '#0A2548' : '#FFFFFF',
        border: `1px solid ${active ? '#0A2548' : 'rgba(10, 10, 10, 0.15)'}`,
        borderRadius: '2px',
        textDecoration: 'none',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.7 }}>· {count}</span>
    </Link>
  )
}

function SortLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      style={{
        color: active ? '#0A2548' : 'rgba(10, 10, 10, 0.45)',
        textDecoration: 'none',
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </Link>
  )
}
