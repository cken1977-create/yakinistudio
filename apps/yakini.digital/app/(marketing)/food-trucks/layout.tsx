import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Yakini Digital for Food Trucks',
  description: 'Your food truck, online in days. Mobile website, menu QR, pay links, catering pages and more. Works with Square, Toast and Clover.',
  openGraph: { title: 'Yakini Digital for Food Trucks', description: 'Your food truck, online in days.', url: 'https://yakini.digital/food-trucks', siteName: 'Yakini Digital', type: 'website' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
