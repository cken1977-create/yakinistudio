import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Yakini — Digital infrastructure for serious founders',
  description: 'We don\'t make websites. We build the platforms your business runs on — with intelligence baked into the foundation.',
  keywords: 'digital infrastructure, AI platforms, founder tools, custom software, Yakini',
  openGraph: {
    title: 'Yakini Digital Infrastructure',
    description: 'Digital infrastructure for serious founders. We build the platforms your business runs on.',
    url: 'https://yakini.digital',
    siteName: 'Yakini',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0A0908' }}>
        {children}
      </body>
    </html>
  )
}
