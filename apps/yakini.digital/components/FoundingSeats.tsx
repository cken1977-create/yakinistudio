'use client'

import { useEffect, useState } from 'react'
import { FOUNDING_API, FOUNDING_DEFAULT_SEATS, type Seats } from '@/lib/pricing'

/** Whether Founding is still open, from the portal (the same count the sign-up enforces). Never shown as a number. */
export function useFoundingSeats(): Seats {
  const [seats, setSeats] = useState<Seats>(FOUNDING_DEFAULT_SEATS)
  useEffect(() => {
    let alive = true
    const test = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('founding_test') : null
    fetch(`${FOUNDING_API}${test ? `?founding_test=${encodeURIComponent(test)}` : ''}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        // The portal sends only { open } now (no amounts or seat count leave it, Nov 20 2026); older builds also sent counts.
        if (alive && j && typeof j.open === 'boolean') setSeats((s) => ({ ...s, open: j.open }))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return seats
}

// The visible seat counter ("X of 10 Founding spots left") was removed Nov 20 2026: the public site shows no
// spot counter. useFoundingSeats stays only so a closed Founding plan can be greyed out and its strip hidden.

export { SEAT_CSS } from './seat-css'
