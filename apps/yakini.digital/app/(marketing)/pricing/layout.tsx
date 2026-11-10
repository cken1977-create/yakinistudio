import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plans and pricing · Yakini Digital',
  description:
    'Founding, Operate and Grow: a one-time $499 setup, then one flat monthly price, with a real Yakini person who sets it up with you. Industry kits and Yakini OS are priced after we talk.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
