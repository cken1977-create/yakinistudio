// VIZIONZ SANKOFA · /admin/media
// Server component. Renders the upload UI + media library list.
// Operators (Khadijah, Will, Carly, Clarence) upload here and manage
// captions, event dates, and deletions.

// Wave 2.5: Media library is operator-only — content goes on the public
// site, only full operators decide what's published.
import { requireOperator } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { UploadSection } from './UploadSection'
import { MediaItemCard, type MediaItem } from './MediaItemCard'

export const dynamic = 'force-dynamic'

type FilterKind = 'all' | 'photo' | 'video'

export default async function MediaAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  await requireOperator()

  const params = await searchParams
  const filter: FilterKind =
    params.filter === 'photo' || params.filter === 'video'
      ? params.filter
      : 'all'

  const supabase = await createClient()

  let query = supabase
    .from('media_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter !== 'all') {
    query = query.eq('kind', filter)
  }

  const { data: items, error } = await query

  const mediaItems = (items ?? []) as MediaItem[]
  const hasItems = mediaItems.length > 0

  // Count for filter pills
  const { count: totalCount } = await supabase
    .from('media_items')
    .select('*', { count: 'exact', head: true })
  const { count: photoCount } = await supabase
    .from('media_items')
    .select('*', { count: 'exact', head: true })
    .eq('kind', 'photo')
  const { count: videoCount } = await supabase
    .from('media_items')
    .select('*', { count: 'exact', head: true })
    .eq('kind', 'video')

  return (
    <div>
      {/* Header */}
      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#CE1126',
            marginBottom: '12px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Media · Wave 1.5
        </div>

        <h1
          style={{
            fontSize: '32px',
            lineHeight: 1.15,
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '12px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Photos &amp; Videos
        </h1>

        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          Upload event photos and program videos for the public Gallery on
          vizionz-sankofa.org. iPhone photos (HEIC) convert to JPEG
          automatically.
        </p>
      </section>

      {/* Upload */}
      <UploadSection />

      {/* Library */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(10, 10, 10, 0.55)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            Library · {totalCount ?? 0}{' '}
            {(totalCount ?? 0) === 1 ? 'item' : 'items'}
          </div>

          <FilterPills
            current={filter}
            counts={{
              all: totalCount ?? 0,
              photo: photoCount ?? 0,
              video: videoCount ?? 0,
            }}
          />
        </div>

        {error && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(206, 17, 38, 0.08)',
              borderLeft: '3px solid #CE1126',
              fontSize: '14px',
              color: '#0A0A0A',
              marginBottom: '16px',
            }}
          >
            Could not load media: {error.message}
          </div>
        )}

        {!hasItems && !error && <EmptyState filter={filter} />}

        {hasItems && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {mediaItems.map((item) => (
              <MediaItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function FilterPills({
  current,
  counts,
}: {
  current: FilterKind
  counts: { all: number; photo: number; video: number }
}) {
  const pills: { label: string; value: FilterKind; count: number }[] = [
    { label: 'All', value: 'all', count: counts.all },
    { label: 'Photos', value: 'photo', count: counts.photo },
    { label: 'Videos', value: 'video', count: counts.video },
  ]

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {pills.map((pill) => {
        const isActive = pill.value === current
        const href =
          pill.value === 'all' ? '/admin/media' : `/admin/media?filter=${pill.value}`
        return (
          <a
            key={pill.value}
            href={href}
            style={{
              padding: '8px 14px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isActive ? '#FFFFFF' : '#0A0A0A',
              background: isActive ? '#0A2548' : 'transparent',
              border: `1px solid ${isActive ? '#0A2548' : 'rgba(10, 10, 10, 0.15)'}`,
              borderRadius: '2px',
              textDecoration: 'none',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {pill.label} · {pill.count}
          </a>
        )
      })}
    </div>
  )
}

function EmptyState({ filter }: { filter: FilterKind }) {
  const message =
    filter === 'all'
      ? 'No media uploaded yet. Use the panel above to add the first photos and videos.'
      : filter === 'photo'
        ? 'No photos uploaded yet.'
        : 'No videos uploaded yet.'

  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: 'rgba(10, 10, 10, 0.02)',
        border: '1px dashed rgba(10, 10, 10, 0.15)',
        borderRadius: '2px',
      }}
    >
      <p
        style={{
          fontSize: '15px',
          color: 'rgba(10, 10, 10, 0.55)',
          margin: 0,
          maxWidth: '440px',
          marginInline: 'auto',
        }}
      >
        {message}
      </p>
    </div>
  )
}
