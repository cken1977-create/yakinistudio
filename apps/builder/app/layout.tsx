import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_STUDIO_ORIGIN || 'https://studio.yakini.digital'),
  title: { default: 'Yakini Studio', template: '%s · Yakini Studio' },
  description: 'Your website, set up in your brand by Yakini Digital.',
  robots: { index: false, follow: false }, // Phase 0: not launched
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0A0908' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}
