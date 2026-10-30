'use client'
import { useEffect } from 'react'

/** Counts one visit per tab session, tagged with ?src= (truck, facebook, google, flyer…). */
export function VisitBeacon({ path }: { path: '/catering' | '/events' }) {
  useEffect(() => {
    try {
      const key = `ms_visit_${path}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
      const src = new URLSearchParams(window.location.search).get('src') ?? ''
      const body = JSON.stringify({ path, source: src })
      if (navigator.sendBeacon) navigator.sendBeacon('/api/catering/visit', new Blob([body], { type: 'application/json' }))
      else fetch('/api/catering/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
    } catch { /* counting must never break the page */ }
  }, [path])
  return null
}
