import { StudioAnalytics } from '@/components/Analytics'

// Studio-only layout: analytics live here so client sites (app/%5Fsite) never load them.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StudioAnalytics />
      {children}
    </>
  )
}
