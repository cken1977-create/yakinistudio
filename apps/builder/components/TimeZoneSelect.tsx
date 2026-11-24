'use client'
import { useEffect, useRef } from 'react'
import { US_TIME_ZONES } from '@/lib/claim'

/**
 * Time zone picker for the claim screen. Without JavaScript it reads "Pick from my address" and the
 * server works it out from the state. With JavaScript it starts on this device's zone when that is
 * a US zone, until the person picks something else.
 */
export function TimeZoneSelect({ id, className, initial }: { id: string; className: string; initial: string }) {
  const ref = useRef<HTMLSelectElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || el.value !== '') return
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (US_TIME_ZONES.some((z) => z.id === zone)) el.value = zone
    } catch { /* keep "from my address" */ }
  }, [])
  return (
    <select ref={ref} id={id} name="timezone" defaultValue={initial} className={className}>
      <option value="">Pick from my address</option>
      {US_TIME_ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
    </select>
  )
}
