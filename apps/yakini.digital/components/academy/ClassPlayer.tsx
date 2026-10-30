'use client'

import { useRef } from 'react'

/** Plays the class and reports "started" (first play) and "watched" (80%) once each. */
export function ClassPlayer({ token, src, poster, label }: { token: string; src: string; poster?: string; label: string }) {
  const sent = useRef<{ started?: boolean; watched?: boolean }>({})
  const report = (event: 'started' | 'watched') => {
    if (sent.current[event]) return
    sent.current[event] = true
    fetch('/api/class/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token, event }), keepalive: true })
      .catch(() => { sent.current[event] = false })
  }
  return (
    <div className="ya-watch-frame">
      <video src={src} poster={poster} controls playsInline preload="metadata" aria-label={label}
        onPlay={() => report('started')}
        onTimeUpdate={(e) => {
          const v = e.currentTarget
          if (v.duration && v.currentTime / v.duration >= 0.8) report('watched')
        }}>
        <a href={src}>{label}</a>
      </video>
    </div>
  )
}
