'use client'

// VIZIONZ SANKOFA · public-site chrome switch
// The public Topbar, Header and Footer wrap the marketing pages only.
// Staff pages (/admin/*) have their own shell in app/admin/layout.tsx, so
// the public chrome is left out there instead of stacking two headers.

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export function isStaffPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? ''
  return p === '/admin' || p.startsWith('/admin/')
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (isStaffPath(pathname)) return null
  return <>{children}</>
}
