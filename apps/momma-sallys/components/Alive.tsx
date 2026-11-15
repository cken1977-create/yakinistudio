'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * "Alive" motion pieces for the home page. Zero dependencies.
 * - Content never depends on JS: posters are real <img> tags, videos only
 *   fade in once they can actually play.
 * - prefers-reduced-motion: no video, no parallax, posters only.
 * - Phones / Save-Data / slow connections: poster only for the hero.
 */

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function slowOrSaveData() {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !!c && (c.saveData === true || /(^|-)2g|3g/.test(c.effectiveType || ''))
}

type Clip = { mp4: string; webm: string }
export type { Clip }

/**
 * The truck driving by, behind the original hero. Poster is a real <img> so the
 * hero is never empty (JS off, reduced motion, Save-Data). The video only
 * attaches after mount and fades in once it can play.
 */
export function TruckVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [on, setOn] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => { if (!reduced() && !slowOrSaveData()) setOn(true) }, [])
  useEffect(() => {
    const v = ref.current
    if (!v || !on) return
    const go = () => { v.play().then(() => setReady(true)).catch(() => {}) }
    v.addEventListener('canplay', go, { once: true })
    v.load()
    return () => v.removeEventListener('canplay', go)
  }, [on])
  return (
    <>
      <img src={poster} alt="" aria-hidden="true" className="h-hero-video" decoding="async" fetchPriority="high" />
      {on && (
        <video ref={ref} className="h-hero-video h-hero-live" style={{ opacity: ready ? 1 : 0 }} muted loop playsInline preload="metadata" aria-hidden="true">
          <source src={src.replace(/\.mp4$/, '.webm')} type="video/webm" />
          <source src={src} type="video/mp4" />
        </video>
      )}
    </>
  )
}

/** A dish clip that only loads + plays while it is on screen. */
export function LoopClip({ clip, poster, alt }: { clip: Clip; poster: string; alt: string }) {
  const box = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLVideoElement>(null)
  const [on, setOn] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el || reduced() || slowOrSaveData()) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setOn(true)
      const v = ref.current
      if (!v) return
      if (e.isIntersecting) v.play().catch(() => {})
      else v.pause()
    }, { rootMargin: '120px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const v = ref.current
    if (!v || !on) return
    const go = () => { v.play().then(() => setReady(true)).catch(() => {}) }
    v.addEventListener('canplay', go, { once: true })
    return () => v.removeEventListener('canplay', go)
  }, [on])

  return (
    <div ref={box} className="a-clip">
      <img src={poster} alt={alt} loading="lazy" decoding="async" />
      {on && (
        <video ref={ref} className={ready ? 'is-ready' : ''} muted loop playsInline preload="metadata" aria-hidden="true">
          <source src={clip.webm} type="video/webm" />
          <source src={clip.mp4} type="video/mp4" />
        </video>
      )}
    </div>
  )
}

/** Writes --p (scroll progress through viewport, -1..1) onto elements with [data-parallax]. */
export function ParallaxDriver() {
  useEffect(() => {
    if (reduced()) return
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))
    let raf = 0
    const tick = () => {
      raf = 0
      const vh = window.innerHeight
      for (const el of els) {
        const r = el.getBoundingClientRect()
        if (r.bottom < -200 || r.top > vh + 200) continue
        const p = ((r.top + r.height / 2) - vh / 2) / vh
        el.style.setProperty('--p', p.toFixed(4))
      }
      const hero = document.querySelector<HTMLElement>('.a-hero')
      if (hero) hero.style.setProperty('--s', Math.min(1, window.scrollY / vh).toFixed(4))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick) }
    tick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [])
  return null
}
