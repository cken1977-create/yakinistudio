import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Yakini — We build what you build on.',
  description: 'Digital infrastructure for small businesses and founders who are serious about growth.',
  keywords: ['web development', 'digital infrastructure', 'small business', 'personal chef websites', 'restaurant websites'],
  openGraph: {
    title: 'Yakini — We build what you build on.',
    description: 'Digital infrastructure for small businesses and founders who are serious about growth.',
    url: 'https://yakini.digital',
    siteName: 'Yakini',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
