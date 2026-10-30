'use client'

import { useRef, useState } from 'react'

/** Vertical (9:16) intro video. Poster + big play button; plays inline with sound and native controls. */
export function InviteVideo({ src, poster, label, playLabel }: { src: string; poster: string; label: string; playLabel: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const play = () => {
    const v = ref.current
    if (!v) return
    setStarted(true)
    v.muted = false
    v.play().catch(() => { /* browser blocked it; native controls stay available */ })
  }
  return (
    <figure className="ya-video">
      <div className="ya-video-frame">
        <video ref={ref} src={src} poster={poster} playsInline preload="metadata" controls={started}
          onPlay={() => setStarted(true)} aria-label={label}>
          <a href={src}>{label}</a>
        </video>
        {!started && (
          <button type="button" className="ya-play" onClick={play} aria-label={playLabel}>
            <span className="ya-play-btn" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#0A0908"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="ya-play-label">{playLabel}</span>
          </button>
        )}
      </div>
      <figcaption className="ya-video-cap">{label}</figcaption>
    </figure>
  )
}
