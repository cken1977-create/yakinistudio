import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plans and pricing · Yakini guided setup',
  description:
    'Operate, Grow and Founding: a one-time guided setup, then a flat monthly plan. A real Yakini person sets up your portal with you, and stays.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
