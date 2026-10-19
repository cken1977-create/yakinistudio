import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Yakini — We build what you build on.',
  description: 'Operators, not vendors. Yakini diagnoses your business, fixes the one problem costing you the most, installs it in a system you own, and stays on to run it with you. Any industry, nationwide.',
  keywords: 'digital infrastructure, AI platforms, founder tools, custom software, Yakini',
  openGraph: {
    title: 'Yakini Digital Infrastructure',
    description: 'We build what you build on. Operators, not vendors. Any industry, nationwide.',
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
