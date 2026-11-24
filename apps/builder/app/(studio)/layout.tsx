import { connection } from 'next/server'
import { StudioAnalytics } from '@/components/Analytics'
import '../globals.css' // studio styles only: client sites (app/%5Fsite) load just their own CSS

// Studio-only layout: analytics live here so client sites (app/%5Fsite) never load them.
// The studio CSP uses a per-request nonce (proxy.ts), so every studio page must render
// per request: a prerendered page can't carry the nonce and its scripts would be blocked.
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await connection()
  return (
    <>
      <StudioAnalytics />
      {children}
    </>
  )
}
