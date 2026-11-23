import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'See your kit · Yakini',
  description:
    'Enter your business website, pick a kit, and see a branded demo of your dashboard with an estimated setup and monthly total. Totals are estimates; the written quote is final.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
