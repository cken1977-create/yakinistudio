import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plans and pricing · Yakini',
  description:
    'Setup from $299. Monthly plans from $149. Build a kit estimate, add the services you want, and send it for a written quote. Every kit includes the owner and staff dashboard.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
