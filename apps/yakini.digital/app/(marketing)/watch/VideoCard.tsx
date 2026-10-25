'use client'

import { useRef, useState } from 'react'
import type { Video } from '@/lib/watch'

/** One video with its own share button. Captions are part of the picture, so they are always on. */
type Chapter = { id: string; at: number; title: string; time: string }

export function VideoCard({ v, label, big = false, chapters }: { v: Video; label?: string; big?: boolean; chapters?: Chapter[] }) {
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)
  const jump = (at: number) => {
    const el = ref.current
    if (!el) return
    el.currentTime = at
    el.play().catch(() => {})
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
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
        <video ref={ref} controls playsInline preload={big ? 'metadata' : 'none'} poster={v.poster}>
          <source src={v.src} type="video/mp4" />
          Your browser can&apos;t play this video. <a href={v.src}>Open the video</a>.
        </video>
      </div>
      <div className="wv-body">
        <p className="wv-meta">{[label, v.device, v.duration].filter(Boolean).join(' · ')}</p>
        <h3 className="wv-title">{v.title}</h3>
        <p className="wv-sub">{v.sub}</p>
        {chapters && chapters.length > 0 && (
          <div className="wv-chapters">
            <p className="wv-chapters-h">Jump to a part</p>
            <ol>
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <button type="button" onClick={() => jump(c.at)}>
                    <span className="wv-chap-time">{c.time}</span>
                    <span>{i + 1}. {c.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="wv-actions">
          <button type="button" className="wv-share" onClick={share}>{copied ? 'Link copied' : 'Share this video'}</button>
          {!big && <a className="wv-open" href={`/watch/${v.id}`}>Open on its own page</a>}
        </div>
      </div>
    </article>
  )
}
