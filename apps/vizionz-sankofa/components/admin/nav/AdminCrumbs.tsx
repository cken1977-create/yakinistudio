'use client'

// VIZIONZ SANKOFA · back control + breadcrumb for every /admin drill-down
//
//   ← Back to Participants
//   Operations / Participants / Jane D.
//
// "Back" returns to the screen the user actually came from (browser
// history, so filters in the URL, the open tab and the scroll position come
// back with it). If there is no in-app history (opened from a bookmark or a
// shared link) it falls back to the parent list.

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { previousAdminUrl } from './history'
import { labelForAdminPath } from '@/lib/admin-nav/sections'

export type Crumb = { label: string; href?: string }

const mono = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace'

export function AdminCrumbs({
  trail,
  fallbackHref,
  fallbackLabel,
  accent = '#5B2C8F',
}: {
  /** Crumbs after "Operations". The last one is the current screen. */
  trail: Crumb[]
  /** Where "back" goes when there is no in-app history. */
  fallbackHref: string
  fallbackLabel: string
  accent?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const qs = searchParams?.toString() ?? ''
  const currentUrl = qs ? `${pathname}?${qs}` : pathname
  const [prev, setPrev] = useState<string | null>(null)

  // Read history after mount (sessionStorage is browser-only). NavHistory
  // records the arrival in the same tick, so wait one frame.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setPrev(previousAdminUrl(currentUrl)))
    return () => window.cancelAnimationFrame(id)
  }, [currentUrl])

  const label = prev ? labelForAdminPath(prev) : fallbackLabel
  const href = prev ?? fallbackHref
  const crumbs: Crumb[] = [{ label: 'Operations', href: '/admin' }, ...trail]

  return (
    <div style={{ marginBottom: '24px' }}>
      <Link
        href={href}
        onClick={(e) => {
          if (!prev) return
          // Go back in history so the previous screen's state comes back.
          e.preventDefault()
          router.back()
        }}
        aria-label={`Back to ${label}`}
        data-testid="admin-back"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          minHeight: '44px',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: accent,
          textDecoration: 'none',
          fontFamily: mono,
        }}
      >
        <span aria-hidden="true">←</span> Back to {label}
      </Link>
      <nav aria-label="Breadcrumb">
        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            letterSpacing: '0.06em',
            color: 'rgba(10, 10, 10, 0.5)',
            fontFamily: mono,
          }}
        >
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1
            return (
              <li key={`${c.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {c.href && !last ? (
                  <Link href={c.href} style={{ color: 'rgba(10, 10, 10, 0.6)', textDecoration: 'none' }}>
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} style={{ color: last ? '#0A0A0A' : undefined, fontWeight: last ? 600 : 400 }}>
                    {c.label}
                  </span>
                )}
                {!last && <span aria-hidden="true">/</span>}
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
