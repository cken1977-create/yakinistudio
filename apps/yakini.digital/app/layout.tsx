import type { Metadata, Viewport } from 'next'
import { SHARE_IMAGE } from '@/lib/share'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  metadataBase: new URL('https://yakini.digital'),
  title: 'Yakini · Your business portal, set up with you',
  description:
    'Every client, text, payment and reply in one place. A real Yakini person sets up your portal with you, and stays. Custom builds quoted on request.',
  keywords: 'business portal, client portal, guided setup, help desk, business texting, Yakini',
  openGraph: {
    title: 'Yakini · Your business, in one portal',
    description: 'Set up with you, not left to you. A real Yakini person sets up your portal with you, and stays.',
    siteName: 'Yakini',
    type: 'website',
    images: [SHARE_IMAGE],
  },
  twitter: { card: 'summary_large_image', images: [SHARE_IMAGE.url] },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0A0908',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0A0908' }}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
