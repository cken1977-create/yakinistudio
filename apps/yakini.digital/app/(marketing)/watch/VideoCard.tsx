'use client'

import { useState } from 'react'
import type { Video } from '@/lib/watch'

/** One video with its own share button. Captions are part of the picture, so they are always on. */
export function VideoCard({ v, label, big = false }: { v: Video; label?: string; big?: boolean }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = `${window.location.origin}/watch/${v.id}`
    try {
      if (navigator.share) await navigator.share({ title: `Yakini: ${v.title}`, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch { /* share sheet closed */ }
  }
  return (
    <article id={v.id} className={`wv-card${big ? ' wv-card-big' : ''}`}>
      <div className="wv-frame">
        <video controls playsInline preload={big ? 'metadata' : 'none'} poster={v.poster}>
          <source src={v.src} type="video/mp4" />
          Your browser can&apos;t play this video. <a href={v.src}>Open the video</a>.
        </video>
      </div>
      <div className="wv-body">
        <p className="wv-meta">{[label, v.device, v.duration].filter(Boolean).join(' · ')}</p>
        <h3 className="wv-title">{v.title}</h3>
        <p className="wv-sub">{v.sub}</p>
        <div className="wv-actions">
          <button type="button" className="wv-share" onClick={share}>{copied ? 'Link copied' : 'Share this video'}</button>
          {!big && <a className="wv-open" href={`/watch/${v.id}`}>Open on its own page</a>}
        </div>
      </div>
    </article>
  )
}
