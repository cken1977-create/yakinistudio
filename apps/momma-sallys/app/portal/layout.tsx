import { notFound } from 'next/navigation'
import { config } from '@/config/brand'

// The portal is switched off in config/brand.ts (portal.enabled: false).
// page.tsx is a client component and can't enforce that itself, so this
// server layout returns a real 404 whenever the portal is off.
export const dynamic = 'force-dynamic'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  if (!config.portal.enabled) notFound()
  return <>{children}</>
}
