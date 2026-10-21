'use client'

import { useEffect, useState } from 'react'
import { FOUNDING_API, FOUNDING_DEFAULT_SEATS, type Seats } from '@/lib/pricing'

/** Live Founding seat count from the portal (the same count the sign-up enforces). */
export function useFoundingSeats(): Seats {
  const [seats, setSeats] = useState<Seats>(FOUNDING_DEFAULT_SEATS)
  useEffect(() => {
    let alive = true
    const test = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('founding_test') : null
    fetch(`${FOUNDING_API}${test ? `?founding_test=${encodeURIComponent(test)}` : ''}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j && typeof j.total === 'number' && typeof j.left === 'number') setSeats({ total: j.total, left: j.left, open: Boolean(j.open) })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return seats
}

export function SeatMeter({ seats }: { seats: Seats }) {
  const taken = seats.total - seats.left
  return (
    <div className="yk-seats" aria-label={`${seats.left} of ${seats.total} Founding spots left`}>
      <div className="yk-seats-bar" aria-hidden>
        {Array.from({ length: seats.total }, (_, i) => (
          <span key={i} className={i < taken ? 'yk-seat yk-seat-taken' : 'yk-seat'} />
        ))}
      </div>
      <p className="yk-seats-copy">
        {seats.open ? (
          <>
            <strong>{seats.left} of {seats.total}</strong> Founding spots left
          </>
        ) : (
          <strong>All {seats.total} Founding spots are taken. Founding is closed.</strong>
        )}
      </p>
    </div>
  )
}

export const SEAT_CSS = `
  .yk-seats { margin-top: 18px; }
  .yk-seats-bar { display: flex; gap: 6px; }
  .yk-seat { flex: 1; height: 8px; border-radius: 999px; background: var(--gold, #C9A84C); box-shadow: 0 0 12px rgba(201,168,76,0.35); }
  .yk-seat-taken { background: rgba(245,239,227,0.18); box-shadow: none; }
  .yk-seats-copy { margin-top: 10px; font-size: 15px; color: rgba(245,239,227,0.85); }
  .yk-seats-copy strong { color: var(--gold, #C9A84C); }
`
