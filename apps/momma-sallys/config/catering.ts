/**
 * Catering builder pricing — Momma Sally's.
 *
 * ⚠️ ALL PRICES BELOW ARE STARTING ESTIMATES seeded from truck plate
 * prices ($15 / $25). Sally confirms every number before launch.
 * Change numbers here — the builder UI reads everything from this file,
 * no code changes needed.
 */

export interface CateringPackage {
  id: string
  name: string
  es: string
  /** Base price per guest, USD. */
  perGuest: number
  meatsIncluded: number
  sidesIncluded: number
  dessertsIncluded: number
  blurb: string
  esBlurb: string
  featured?: boolean
}

export const CATERING_PACKAGES: CateringPackage[] = [
  {
    id: 'classic',
    name: 'Classic BBQ',
    es: 'Clásica',
    perGuest: 16,
    meatsIncluded: 1,
    sidesIncluded: 2,
    dessertsIncluded: 0,
    blurb: 'One smoked meat, two homestyle sides. The crowd-pleaser.',
    esBlurb: 'Una carne ahumada, dos acompañamientos caseros.',
  },
  {
    id: 'pitmaster',
    name: 'Pitmaster',
    es: 'Pitmaster',
    perGuest: 22,
    meatsIncluded: 2,
    sidesIncluded: 2,
    dessertsIncluded: 0,
    blurb: 'Two meats off the pit, two sides. Our most-booked.',
    esBlurb: 'Dos carnes del asador, dos acompañamientos. La más pedida.',
    featured: true,
  },
  {
    id: 'full-spread',
    name: 'Full Spread',
    es: 'Banquete completo',
    perGuest: 28,
    meatsIncluded: 2,
    sidesIncluded: 3,
    dessertsIncluded: 1,
    blurb: 'Two meats, three sides, and something sweet. The whole table.',
    esBlurb: 'Dos carnes, tres acompañamientos y postre. La mesa completa.',
  },
]

export interface CateringOption {
  id: string
  name: string
  es: string
}

export const CATERING_MEATS: CateringOption[] = [
  { id: 'brisket', name: 'Brisket', es: 'Brisket' },
  { id: 'sausage', name: 'Sausage', es: 'Salchicha' },
  { id: 'chicken', name: 'Chicken', es: 'Pollo' },
  { id: 'pulled-pork', name: 'Pulled Pork', es: 'Cerdo deshebrado' },
]

export const CATERING_SIDES: CateringOption[] = [
  { id: 'beans', name: 'Beans', es: 'Frijoles' },
  { id: 'mac', name: 'Mac & Cheese', es: 'Macarrones con queso' },
  { id: 'potato-salad', name: 'Potato Salad', es: 'Ensalada de papa' },
]

export const CATERING_DESSERTS: CateringOption[] = [
  { id: 'banana-pudding', name: 'Banana Pudding', es: 'Pudín de plátano' },
  { id: 'peach-cobbler', name: 'Peach Cobbler', es: 'Cobbler de durazno' },
  { id: 'cookies-brownies', name: 'Cookies & Brownies', es: 'Galletas y brownies' },
]

export interface ServiceStyle {
  id: string
  name: string
  es: string
  /** Added per guest, USD. */
  perGuest: number
  blurb: string
  esBlurb: string
}

export const SERVICE_STYLES: ServiceStyle[] = [
  {
    id: 'dropoff',
    name: 'Drop-off',
    es: 'Entrega',
    perGuest: 0,
    blurb: 'We deliver hot, you serve. Pans ready to go.',
    esBlurb: 'Entregamos caliente, tú sirves.',
  },
  {
    id: 'buffet',
    name: 'Buffet Setup',
    es: 'Bufé montado',
    perGuest: 2,
    blurb: 'We set the spread, label everything, come back for pickup.',
    esBlurb: 'Montamos el bufé y lo etiquetamos todo.',
  },
  {
    id: 'full',
    name: 'Full Service',
    es: 'Servicio completo',
    perGuest: 7,
    blurb: 'Our crew serves your guests start to finish.',
    esBlurb: 'Nuestro equipo sirve a tus invitados.',
  },
]

export const CATERING_MIN_GUESTS = 20
export const CATERING_MAX_GUESTS = 300

/** Per-guest add-ons beyond package inclusions. */
export const EXTRA_MEAT_PER_GUEST = 5
export const EXTRA_SIDE_PER_GUEST = 3
export const EXTRA_DESSERT_PER_GUEST = 3
