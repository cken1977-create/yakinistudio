'use client'

import { useEffect, useRef } from 'react'

/**
 * Lightweight canvas ember layer for hero sections. ~40 glowing particles
 * drifting upward with a soft flicker. No libraries, no images.
 * Respects prefers-reduced-motion (renders nothing animated).
 */
export function EmberCanvas({ density = 36 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = canvas.width = Math.max(1, Math.floor(r.width))
      h = canvas.height = Math.max(1, Math.floor(r.height))
    }
    resize()
    window.addEventListener('resize', resize)

    interface Particle {
      x: number
      y: number
      r: number
      vy: number
      vx: number
      a: number
      hue: number
    }
    const spawn = (): Particle => ({
      x: Math.random() * w,
      y: h + 10 + Math.random() * 40,
      r: 1 + Math.random() * 2.4,
      vy: 0.35 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.4,
      a: 0.25 + Math.random() * 0.5,
      hue: 16 + Math.random() * 24,
    })
    const parts: Particle[] = Array.from({ length: density }, spawn)

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        p.y -= p.vy
        p.x += p.vx + Math.sin(p.y * 0.02) * 0.3
        p.a -= 0.0016
        if (p.y < -12 || p.a <= 0) Object.assign(p, spawn())
        const glow = p.r * 4
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow)
        g.addColorStop(0, `hsla(${p.hue}, 95%, 62%, ${p.a.toFixed(3)})`)
        g.addColorStop(1, 'hsla(20, 95%, 50%, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, glow, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [density])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
