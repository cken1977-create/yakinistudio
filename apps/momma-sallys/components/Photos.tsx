import Image from 'next/image'

export const PHOTOS = {
  sausagePlate: { src: '/photos/sausage-brisket-plate.webp', w: 1333, h: 1600, alt: 'Sausage and brisket plate with corn, mac & cheese and green beans' },
  brisketPlate: { src: '/photos/brisket-plate.webp', w: 1600, h: 1237, alt: 'Brisket plate with beans, potatoes, green beans and cornbread' },
  brisket: { src: '/photos/brisket-closeup.webp', w: 1336, h: 1600, alt: 'Smoked brisket close-up with bark' },
  grazing: { src: '/photos/grazing-table.webp', w: 1200, h: 1600, alt: 'Grazing table with fruit, cheese, bread and dips' },
  buffet: { src: '/photos/buffet.webp', w: 1020, h: 1600, alt: 'Catering buffet spread' },
  charcuterie: { src: '/photos/charcuterie-cake.webp', w: 1200, h: 1600, alt: 'Charcuterie spread for an event' },
  cobbler: { src: '/photos/peach-cobbler.webp', w: 1600, h: 1452, alt: 'Peach cobbler' },
  pudding: { src: '/photos/banana-pudding.webp', w: 1600, h: 1169, alt: 'Banana pudding' },
  eventSpread: { src: '/photos/event-spread.webp', w: 1600, h: 840, alt: 'Party dessert and food spread' },
} as const

export type PhotoKey = keyof typeof PHOTOS

export function Photo({ k, sizes = '(min-width: 900px) 33vw, 100vw', priority, aspect = '4 / 3' }: { k: PhotoKey; sizes?: string; priority?: boolean; aspect?: string }) {
  const p = PHOTOS[k]
  return (
    <div style={{ position: 'relative', aspectRatio: aspect, borderRadius: 16, overflow: 'hidden', background: '#111' }}>
      <Image src={p.src} alt={p.alt} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover' }} />
    </div>
  )
}

export function Gallery({ items, aspect }: { items: PhotoKey[]; aspect?: string }) {
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
      {items.map(k => <Photo key={k} k={k} aspect={aspect} />)}
    </div>
  )
}
