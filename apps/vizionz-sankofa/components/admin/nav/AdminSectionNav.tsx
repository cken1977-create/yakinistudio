'use client'

// VIZIONZ SANKOFA · admin section nav
// A slim row of links under the header, present on every /admin screen
// (including detail pages) so any section is one tap away. Sticky, and it
// scrolls sideways on phones instead of wrapping.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import type { VsAccessRole } from '@/lib/supabase/auth'
import { isActiveSection, sectionsForRole } from '@/lib/admin-nav/sections'

export function AdminSectionNav({ accessRole }: { accessRole: VsAccessRole | null }) {
  const pathname = usePathname() ?? '/admin'
  const items = sectionsForRole(accessRole)
  const listRef = useRef<HTMLUListElement>(null)

  // On phones the row scrolls sideways; keep the current section in view.
  useEffect(() => {
    const list = listRef.current
    const active = list?.querySelector<HTMLAnchorElement>('a[aria-current="page"]')
    if (!list || !active) return
    const left = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2
    list.scrollTo({ left: Math.max(0, left) })
  }, [pathname])

  return (
    <nav
      aria-label="Admin sections"
      className="vs-admin-section-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(10, 10, 10, 0.08)',
      }}
    >
      <style>{`
        .vs-admin-section-nav ul { scrollbar-width: none; }
        .vs-admin-section-nav ul::-webkit-scrollbar { display: none; }
        .vs-admin-section-nav a:focus-visible { outline: 2px solid #0A2548; outline-offset: -2px; }
      `}</style>
      <ul
        ref={listRef}
        style={{
          listStyle: 'none',
          margin: '0 auto',
          padding: '0 16px',
          maxWidth: '1200px',
          display: 'flex',
          gap: '2px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((s) => {
          const active = isActiveSection(s.href, pathname)
          return (
            <li key={s.href} style={{ flex: '0 0 auto' }}>
              <Link
                href={s.href}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: '44px',
                  padding: '0 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  color: active ? '#0A0A0A' : 'rgba(10, 10, 10, 0.55)',
                  borderBottom: active ? '3px solid #CE1126' : '3px solid transparent',
                  fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                }}
              >
                {s.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
