import { COMMUNITY_GALLERY } from '@/lib/site/public-pages'

export function CommunityStrip() {
  return (
    <section aria-label="Community photos" style={{ padding: '0 0 4rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}>
          {COMMUNITY_GALLERY.map((photo) => (
            <img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              style={{ width: '100%', height: '220px', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
