import type { KitId } from '@/lib/pricing'

export type PreviewStat = { label: string; value: string; hint?: string }
export type PreviewRow = { title: string; meta: string; status: string }
export type PreviewNav = { id: string; label: string }

export type KitPreview = {
  nav: PreviewNav[]
  stats: PreviewStat[]
  tableTitle: string
  rows: PreviewRow[]
  note: string
}

const SAMPLE = 'Sample data'

export const PREVIEW_BANNER = 'Sample data — this is a preview of your kit dashboard, not a live account.'

const PREVIEWS: Record<KitId, KitPreview> = {
  'food-truck': {
    nav: [
      { id: 'today', label: 'Today' },
      { id: 'orders', label: 'Orders' },
      { id: 'menu', label: 'Menu' },
      { id: 'stops', label: 'Stops' },
    ],
    stats: [
      { label: 'Today’s sales', value: '$1,284', hint: SAMPLE },
      { label: 'Orders', value: '18', hint: SAMPLE },
      { label: 'Next stop', value: 'Sat market, 11–3', hint: SAMPLE },
    ],
    tableTitle: 'Recent orders',
    rows: [
      { title: 'Two brisket plates, one lemonade', meta: 'Walk-up · 12:14 p.m.', status: 'Ready' },
      { title: 'Family taco pack', meta: 'Pay-ahead · 12:08 p.m.', status: 'In the window' },
      { title: 'Three tacos, agua fresca', meta: 'Walk-up · 11:57 a.m.', status: 'Picked up' },
    ],
    note: 'A food truck kit keeps the menu, today’s orders, and your next stop in one place.',
  },
  landlord: {
    nav: [
      { id: 'units', label: 'Units' },
      { id: 'rent', label: 'Rent' },
      { id: 'work', label: 'Work orders' },
      { id: 'tenants', label: 'Tenants' },
    ],
    stats: [
      { label: 'Occupied', value: '9 of 10', hint: SAMPLE },
      { label: 'Rent still due', value: '$2,150', hint: SAMPLE },
      { label: 'Open work orders', value: '3', hint: SAMPLE },
    ],
    tableTitle: 'Open work orders',
    rows: [
      { title: 'Unit 4B — dripping faucet', meta: 'Reported yesterday', status: 'Scheduled' },
      { title: 'Unit 1A — dryer not heating', meta: 'Reported Monday', status: 'Parts ordered' },
      { title: 'Common hall — light out', meta: 'Reported today', status: 'New' },
    ],
    note: 'A landlord kit tracks units, rent, and work orders without a spreadsheet.',
  },
  'real-estate': {
    nav: [
      { id: 'listings', label: 'Listings' },
      { id: 'showings', label: 'Showings' },
      { id: 'leads', label: 'Leads' },
      { id: 'clients', label: 'Clients' },
    ],
    stats: [
      { label: 'Active listings', value: '6', hint: SAMPLE },
      { label: 'Showings this week', value: '9', hint: SAMPLE },
      { label: 'New leads', value: '4', hint: SAMPLE },
    ],
    tableTitle: 'Upcoming showings',
    rows: [
      { title: '1842 Maple Ave — 3 bed', meta: 'Tomorrow, 4:00 p.m.', status: 'Confirmed' },
      { title: '22 Mesa Court — townhome', meta: 'Thursday, 11:30 a.m.', status: 'Pending' },
      { title: '90 Rio Grande — condo', meta: 'Friday, 5:15 p.m.', status: 'Confirmed' },
    ],
    note: 'A real estate kit keeps listings, showings, and follow-up in one dashboard.',
  },
  restaurant: {
    nav: [
      { id: 'floor', label: 'Floor' },
      { id: 'reservations', label: 'Reservations' },
      { id: 'menu', label: 'Menu' },
      { id: 'orders', label: 'Orders' },
    ],
    stats: [
      { label: 'Covers tonight', value: '64', hint: SAMPLE },
      { label: 'Open tables', value: '7', hint: SAMPLE },
      { label: 'Reservations left', value: '11', hint: SAMPLE },
    ],
    tableTitle: 'Tonight’s reservations',
    rows: [
      { title: 'Garcia, party of 4', meta: '6:15 p.m. · Patio', status: 'Seated' },
      { title: 'Nguyen, party of 2', meta: '6:45 p.m. · Window', status: 'Confirmed' },
      { title: 'Ellis, party of 6', meta: '7:30 p.m. · Main', status: 'Confirmed' },
    ],
    note: 'A restaurant kit covers the floor, reservations, and orders for one or more locations.',
  },
  'tree-lawn': {
    nav: [
      { id: 'jobs', label: 'Jobs' },
      { id: 'crews', label: 'Crews' },
      { id: 'estimates', label: 'Estimates' },
      { id: 'schedule', label: 'Schedule' },
    ],
    stats: [
      { label: 'Jobs today', value: '5', hint: SAMPLE },
      { label: 'Crews out', value: '2', hint: SAMPLE },
      { label: 'Estimates waiting', value: '6', hint: SAMPLE },
    ],
    tableTitle: 'Today’s jobs',
    rows: [
      { title: 'Oak trim, 14 Pine St', meta: 'Crew A · 8:00 a.m.', status: 'On site' },
      { title: 'Spring clean-up, 3 lots', meta: 'Crew B · 9:30 a.m.', status: 'En route' },
      { title: 'Stump grind, 88 Adobe', meta: 'Crew A · 1:00 p.m.', status: 'Scheduled' },
    ],
    note: 'A tree and lawn kit schedules crews, estimates, and follow-up in one place.',
  },
  nonprofit: {
    nav: [
      { id: 'programs', label: 'Programs' },
      { id: 'donors', label: 'Donors' },
      { id: 'volunteers', label: 'Volunteers' },
      { id: 'events', label: 'Events' },
    ],
    stats: [
      { label: 'Gifts this month', value: '$8,420', hint: SAMPLE },
      { label: 'Active volunteers', value: '27', hint: SAMPLE },
      { label: 'Upcoming events', value: '3', hint: SAMPLE },
    ],
    tableTitle: 'Recent gifts and sign-ups',
    rows: [
      { title: 'Monthly gift — $50', meta: 'Jordan P. · yesterday', status: 'Thanked' },
      { title: 'Saturday meal service', meta: '6 volunteer spots left', status: 'Open' },
      { title: 'Spring drive donation', meta: 'Anonymous · Monday', status: 'Recorded' },
    ],
    note: 'A nonprofit kit tracks programs, donors, and volunteers without a maze of tools.',
  },
  'training-school': {
    nav: [
      { id: 'students', label: 'Students' },
      { id: 'classes', label: 'Classes' },
      { id: 'tuition', label: 'Tuition' },
      { id: 'schedule', label: 'Schedule' },
    ],
    stats: [
      { label: 'Active students', value: '42', hint: SAMPLE },
      { label: 'Classes this week', value: '8', hint: SAMPLE },
      { label: 'Tuition due', value: '$3,600', hint: SAMPLE },
    ],
    tableTitle: 'This week’s classes',
    rows: [
      { title: 'Intro to electrical — Cohort B', meta: 'Mon / Wed · 18 enrolled', status: 'In session' },
      { title: 'Welding lab', meta: 'Tue / Thu · 12 enrolled', status: 'Open seats' },
      { title: 'Safety refresh', meta: 'Friday morning · 22 enrolled', status: 'Scheduled' },
    ],
    note: 'A training school kit keeps enrollments, classes, and tuition in one dashboard.',
  },
  trucking: {
    nav: [
      { id: 'loads', label: 'Loads' },
      { id: 'trucks', label: 'Trucks' },
      { id: 'drivers', label: 'Drivers' },
      { id: 'pay', label: 'Settlements' },
    ],
    stats: [
      { label: 'Loads in motion', value: '4', hint: SAMPLE },
      { label: 'Trucks available', value: '1', hint: SAMPLE },
      { label: 'Deliveries today', value: '2', hint: SAMPLE },
    ],
    tableTitle: 'Active loads',
    rows: [
      { title: 'Albuquerque → Denver', meta: 'Truck 12 · ETA 4:40 p.m.', status: 'En route' },
      { title: 'El Paso → Phoenix', meta: 'Truck 7 · pickup 2:00 p.m.', status: 'At shipper' },
      { title: 'Santa Fe → Dallas', meta: 'Truck 3 · tomorrow 6:00 a.m.', status: 'Dispatched' },
    ],
    note: 'A trucking kit tracks loads, trucks, and settlements from one screen.',
  },
  oilfield: {
    nav: [
      { id: 'tickets', label: 'Tickets' },
      { id: 'crews', label: 'Crews' },
      { id: 'equipment', label: 'Equipment' },
      { id: 'sites', label: 'Sites' },
    ],
    stats: [
      { label: 'Open tickets', value: '7', hint: SAMPLE },
      { label: 'Crews in the field', value: '2', hint: SAMPLE },
      { label: 'Equipment down', value: '1', hint: SAMPLE },
    ],
    tableTitle: 'Field tickets',
    rows: [
      { title: 'Well site 14 — pump check', meta: 'Crew A · this morning', status: 'On site' },
      { title: 'Lease road repair', meta: 'Crew B · scheduled 1 p.m.', status: 'Queued' },
      { title: 'Tank battery inspect', meta: 'Crew A · tomorrow', status: 'Planned' },
    ],
    note: 'An oilfield kit keeps tickets, crews, and equipment in one working dashboard.',
  },
  specialized: {
    nav: [
      { id: 'jobs', label: 'Jobs' },
      { id: 'crew', label: 'Crew' },
      { id: 'invoices', label: 'Invoices' },
      { id: 'clients', label: 'Clients' },
    ],
    stats: [
      { label: 'Jobs this week', value: '8', hint: SAMPLE },
      { label: 'Invoices open', value: '$6,410', hint: SAMPLE },
      { label: 'Follow-ups due', value: '3', hint: SAMPLE },
    ],
    tableTitle: 'This week’s work',
    rows: [
      { title: 'Site walk-through, North yard', meta: 'Tomorrow, 9:00 a.m.', status: 'Confirmed' },
      { title: 'Equipment install, Building C', meta: 'Wednesday · all day', status: 'Scheduled' },
      { title: 'Follow-up visit, Mesa client', meta: 'Friday, 2:00 p.m.', status: 'To confirm' },
    ],
    note: 'A specialized operations kit is a working dashboard for a crew-based business.',
  },
  cannabis: {
    nav: [
      { id: 'overview', label: 'Overview' },
      { id: 'intake', label: 'Intake' },
      { id: 'compliance', label: 'Compliance' },
      { id: 'clients', label: 'Clients' },
    ],
    stats: [
      { label: 'Quoted individually', value: 'Yes', hint: SAMPLE },
      { label: 'Published monthly price', value: 'Quote only', hint: SAMPLE },
      { label: 'Next step', value: 'Written quote', hint: SAMPLE },
    ],
    tableTitle: 'What we would confirm on a quote',
    rows: [
      { title: 'Licensing and operating requirements', meta: 'Reviewed with you', status: 'Quote' },
      { title: 'Intake and customer records', meta: 'Scoped to your operation', status: 'Quote' },
      { title: 'Dashboard and staff logins', meta: 'Set after the written quote', status: 'Quote' },
    ],
    note: 'Cannabis kits are quoted individually. Send your build and a Yakini person will follow up in writing.',
  },
  'home-healthcare': {
    nav: [
      { id: 'overview', label: 'Overview' },
      { id: 'care', label: 'Care' },
      { id: 'staff', label: 'Staff' },
      { id: 'visits', label: 'Visits' },
    ],
    stats: [
      { label: 'Kit status', value: 'Not sold yet', hint: SAMPLE },
      { label: 'Pricing', value: 'Quote only', hint: SAMPLE },
      { label: 'Next step', value: 'Talk with us', hint: SAMPLE },
    ],
    tableTitle: 'What a finished kit would cover',
    rows: [
      { title: 'Visit schedules and staff logins', meta: 'Once the kit is built', status: 'Not sold yet' },
      { title: 'Family updates and records', meta: 'Once the kit is built', status: 'Not sold yet' },
      { title: 'Billing follow-up', meta: 'Once the kit is built', status: 'Not sold yet' },
    ],
    note: 'Home healthcare is quote-only and is not sold until this kit is built. You can still send a quote request.',
  },
  reentry: {
    nav: [
      { id: 'overview', label: 'Overview' },
      { id: 'programs', label: 'Programs' },
      { id: 'people', label: 'People' },
      { id: 'partners', label: 'Partners' },
    ],
    stats: [
      { label: 'Kit status', value: 'Not sold yet', hint: SAMPLE },
      { label: 'Pricing', value: 'Quote only', hint: SAMPLE },
      { label: 'Next step', value: 'Talk with us', hint: SAMPLE },
    ],
    tableTitle: 'What a finished kit would cover',
    rows: [
      { title: 'Program enrollment', meta: 'Once the kit is built', status: 'Not sold yet' },
      { title: 'Check-ins and follow-up', meta: 'Once the kit is built', status: 'Not sold yet' },
      { title: 'Partner referrals', meta: 'Once the kit is built', status: 'Not sold yet' },
    ],
    note: 'Reentry is quote-only and is not sold until this kit is built. You can still send a quote request.',
  },
}

export function previewFor(kitId: KitId | undefined): KitPreview {
  return PREVIEWS[kitId || 'food-truck']
}

export type AddonCard = { id: string; title: string; detail: string }

export function addonCards(items: string[]): AddonCard[] {
  const cards: AddonCard[] = []
  if (items.includes('website-simple') || items.includes('website-custom')) {
    cards.push({
      id: 'website',
      title: 'Public website',
      detail: items.includes('website-custom')
        ? 'A custom public site is quoted separately and shown here as a placeholder.'
        : 'A template website, in your brand, up to 5 pages. You pick the type; we build from that template.',
    })
  }
  if (items.includes('ordering')) {
    cards.push({
      id: 'ordering',
      title: 'Pay-ahead orders',
      detail: 'Sample: 3 pay-ahead orders waiting at the window, paid on your own payment account.',
    })
  }
  if (items.includes('receptionist')) {
    cards.push({
      id: 'receptionist',
      title: 'Phone receptionist',
      detail: 'Sample: 4 missed-call texts sent back this morning, with two transfers to you.',
    })
  }
  if (items.includes('course-portal')) {
    cards.push({
      id: 'course',
      title: 'Course portal',
      detail: 'Sample: 18 students with lessons in progress. A practice tutorial, when one exists, is included.',
    })
  }
  if (items.includes('ecommerce')) {
    cards.push({
      id: 'store',
      title: 'Catalog and checkout',
      detail: 'Sample: 12 items in a small catalog, checkout on your payment account.',
    })
  }
  if (items.includes('business-setup')) {
    cards.push({
      id: 'setup',
      title: 'Business Setup',
      detail: '$495 plus state filing fees. Yakini covers the first year of the domain and activation fees.',
    })
  }
  if (items.includes('qr-menu')) {
    cards.push({
      id: 'qr',
      title: 'QR codes',
      detail: 'Sample: print-ready codes linking to your menu, booking, or ordering page.',
    })
  }
  return cards
}
