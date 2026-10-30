// ═════════════════════════════════════════════════════════════════════════
// REP DEMO LIBRARY: the kit demos sales reps can open and share.
// Server-only: this list is rendered on /reps after a rep signs in and is
// never shipped to signed-out visitors. It holds ONLY public demo links
// (sample data, no sign-in). Never put customer data or private links here.
//
// To add a demo, add one line to KITS:
//   { slug: 'my-kit', name: 'Kit name', audience: 'Who it is for', pitch: 'One line.', url: 'https://public-demo-url', video: '/video', thumbnail: 'https://public-demo-url/og.jpg', blurb: 'a sample … for …' },
// Leave `url` out and set `status: 'coming-soon'` for a card that is not ready yet.
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
  /** Public guided-tour URL (no sign-in). Omit for coming-soon kits. */
  url?: string
  /** Path of the narrated video on the demo site, e.g. '/video'. */
  video?: string
  /** Poster / link-preview image from the demo site. */
  thumbnail?: string
  /** Finishes "Here's a short guided demo of …" in the share message. */
  blurb?: string
  status?: 'live' | 'coming-soon'
}

export const KITS: Kit[] = [
  { slug: 'cartel-oil', name: 'Cartel Oil Co.', audience: 'Cannabis grower & processor', pitch: 'Stock, buyer licenses, compliance and the daily numbers on one screen for the whole team.', url: 'https://cartel-oil-demo.vercel.app', video: '/video', thumbnail: 'https://cartel-oil-demo.vercel.app/cartel-walkthrough-og.jpg', blurb: 'a sample operations portal we put together for a cannabis grower and processor' },
  { slug: 'ramos-tree', name: 'Ramos Lawn and Tree Service', audience: 'Tree service', pitch: 'One system from first call to paid invoice: estimates, e-sign approvals, crew calendar and clean invoices.', url: 'https://ramos-tree-walkthrough.vercel.app', video: '/video', thumbnail: 'https://ramos-tree-walkthrough.vercel.app/ramos-walkthrough-og.jpg', blurb: 'a sample system we put together for a tree service, from first call to paid invoice' },
  { slug: 'real-estate', name: 'Real Estate Kit', audience: 'Agents & brokers', pitch: 'Curated homes, one-tap showing requests, and an agent desk where every request lands the moment it is made.', url: 'https://yakini-realestate-demo.vercel.app', video: '/video', thumbnail: 'https://yakini-realestate-demo.vercel.app/realestate-walkthrough-og.jpg', blurb: 'a sample home-buyer and showing experience we put together for real estate agents' },
  { slug: 'landlord', name: 'Landlord Kit', audience: 'Landlords & property managers', pitch: 'Tenants report issues with photos, issues get sorted automatically, you dispatch vendors in one tap, and the owner sees every property.', url: 'https://yakini-landlord-demo.vercel.app', video: '/video', thumbnail: 'https://yakini-landlord-demo.vercel.app/landlord-walkthrough-og.jpg', blurb: 'a sample tenant help desk and maintenance system we put together for landlords and property managers' },
]

export function isLive(k: Kit): k is Kit & { url: string } {
  return k.status !== 'coming-soon' && !!k.url
}

export function videoUrl(k: Kit): string | null {
  if (!k.url || !k.video) return null
  return new URL(k.video, k.url).toString()
}
