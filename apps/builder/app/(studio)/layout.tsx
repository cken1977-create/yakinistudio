import { StudioAnalytics } from '@/components/Analytics'
import '../globals.css' // studio styles only: client sites (app/%5Fsite) load just their own CSS

// Studio-only layout: analytics live here so client sites (app/%5Fsite) never load them.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StudioAnalytics />
      {children}
    </>
  )
}
