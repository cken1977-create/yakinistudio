// ═════════════════════════════════════════════════════════════════════════
// REP DEMO LIBRARY: the kit demos sales reps can open and share.
// Server-only: this list is rendered on /reps after a rep signs in and is
// never shipped to signed-out visitors. It holds ONLY public demo links
// (sample data, no sign-in). Never put customer data or private links here.
//
// To add a demo, add one line to KITS:
//   { slug: 'my-kit', name: 'Kit name', audience: 'Who it is for', pitch: 'One line.', url: 'https://public-demo-url', video: '/video', thumbnail: 'https://public-demo-url/og.jpg', blurb: 'a sample … for …' },
// `video` can be a path on the demo site ('/video') or a full URL.
// Missing tour or video: leave that field out. The card hides that button and shows
// "Tour coming" or "Video coming". With neither, the card shows "Coming soon".
// Only link public demo / sample-data versions. Never a client's live system or real people's data.
// Copy rules: no vendor names, no pricing, no income claims.
// ═════════════════════════════════════════════════════════════════════════
import 'server-only'

export type Kit = {
  slug: string
  name: string
  /** Who the kit is for, shown above the name. */
  audience: string
  /** One-line pitch on the card. */
  pitch: string
  /** Public guided-tour URL (no sign-in, sample data). Omit if there is no tour yet. */
  url?: string
  /** Narrated video: a path on the demo site (e.g. '/video') or a full public URL. Omit if none yet. */
  video?: string
  /** Poster / link-preview image from the demo site. */
  thumbnail?: string
  /** Finishes "Here's a short guided demo of …" in the share message. */
  /** Set to 'coming-soon' to show the card with no links at all. */
  blurb?: string
  status?: 'live' | 'coming-soon'
}

export const KITS: Kit[] = [
  { slug: 'cartel-oil', name: 'Cartel Oil Co.', audience: 'Cannabis grower & processor', pitch: 'Stock, buyer licenses, compliance and the daily numbers on one screen for the whole team.', url: 'https://cartel-oil-demo.vercel.app', video: '/video', thumbnail: 'https://cartel-oil-demo.vercel.app/cartel-walkthrough-og.jpg', blurb: 'a sample operations portal we put together for a cannabis grower and processor' },
  { slug: 'ramos-tree', name: 'Ramos Lawn and Tree Service', audience: 'Tree service', pitch: 'One system from first call to paid invoice: estimates, e-sign approvals, crew calendar and clean invoices.', url: 'https://ramos-tree-walkthrough.vercel.app', video: '/video', thumbnail: 'https://ramos-tree-walkthrough.vercel.app/ramos-walkthrough-og.jpg', blurb: 'a sample system we put together for a tree service, from first call to paid invoice' },
  { slug: 'real-estate', name: 'Real Estate Kit', audience: 'Agents & brokers', pitch: 'Curated homes, one-tap showing requests, and an agent desk where every request lands the moment it is made.', url: 'https://yakini-realestate-demo.vercel.app', video: '/video', thumbnail: 'https://yakini-realestate-demo.vercel.app/realestate-walkthrough-og.jpg', blurb: 'a sample home-buyer and showing experience we put together for real estate agents' },
  { slug: 'landlord', name: 'Landlord Kit', audience: 'Landlords & property managers', pitch: 'Tenants report issues with photos, issues get sorted automatically, you dispatch vendors in one tap, and the owner sees every property.', url: 'https://yakini-landlord-demo.vercel.app', video: '/video', thumbnail: 'https://yakini-landlord-demo.vercel.app/landlord-walkthrough-og.jpg', blurb: 'a sample tenant help desk and maintenance system we put together for landlords and property managers' },
  { slug: 'food-truck', name: 'Food Truck Kit', audience: 'Food truck owners', pitch: 'The truck\'s own website, pay-ahead pre-orders, one-tap sold out, catering quotes, opt-in specials and a phone line that answers while you cook.', url: 'https://yakini-foodtruck-demo.vercel.app', video: '/video', thumbnail: 'https://yakini-foodtruck-demo.vercel.app/foodtruck-walkthrough-og.jpg', blurb: 'a sample website, pre-order and catering system we put together for a food truck' },
  { slug: 'transport', name: 'Transportation Kit', audience: 'Small trucking & hauling companies', pitch: 'A shipper portal on your own website, one-tap dispatch, driver check-in with proof of delivery, invoices from the POD, and document alerts.', url: 'https://yakini-transport-demo.vercel.app', video: '/video', thumbnail: 'https://yakini-transport-demo.vercel.app/transport-walkthrough-og.jpg', blurb: 'a sample dispatch, proof-of-delivery and invoicing system we put together for a small trucking company' },
  { slug: 'kamili', name: 'Kamili', audience: 'Readiness & workforce programs', pitch: 'One honest readiness record per person, from enrollment and coaching through evaluator review to the funder view.', url: 'https://demo.kamilihq.com/demo', video: 'https://demo.kamilihq.com/watch', thumbnail: 'https://r3ttymbsgoc2vq9s.public.blob.vercel-storage.com/kamili/2026-10-25/kamili-demo-full-poster.jpg', blurb: 'a sample readiness program we put together, followed from the organization all the way to the funder' },
  { slug: 'waypoint', name: 'Waypoint Lead Engine', audience: 'Shops & service businesses', pitch: 'Every missed call gets a text back in under a minute, every quote gets followed up, and every lead has a next step.', url: 'https://yakini-demos.vercel.app/waypoint', blurb: 'a sample lead engine we put together for a vehicle upfitting shop, where a missed call turns into a booked consult' },
  { slug: 'abc-prep', name: 'ABC Prep Academy', audience: 'Youth sports academy', pitch: 'One fee engine for tuition, teams and travel, two sets of books kept apart, and a ledger that shows every dollar move.', url: 'https://yakini-demos.vercel.app/abc-prep', blurb: 'a sample payments and accounting system we put together for a youth sports academy' },
  { slug: 'vizionz-sankofa', name: 'Vizionz Sankofa', audience: 'Nonprofit case management', pitch: 'Intake, case management and follow-up for a community nonprofit. A public demo on sample data is being prepared.', status: 'coming-soon' },
]

export function tourUrl(k: Kit): string | null {
  if (k.status === 'coming-soon' || !k.url) return null
  return k.url
}

export function videoUrl(k: Kit): string | null {
  if (k.status === 'coming-soon' || !k.video) return null
  if (/^https:\/\//.test(k.video)) return k.video
  if (!k.url) return null
  return new URL(k.video, k.url).toString()
}
