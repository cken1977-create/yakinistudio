'use client'

// VIZIONZ SANKOFA · records /admin navigation for the back control and
// restores the scroll position when the user comes back to a list.

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { recordArrival, saveScroll, savedScroll } from './history'

export function NavHistory() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const qs = searchParams?.toString() ?? ''
  const url = qs ? `${pathname}?${qs}` : pathname

  useEffect(() => {
    if (!pathname) return
    const isBack = recordArrival(url)
    if (!isBack) return
    const y = savedScroll(url)
    if (y === null || y === 0) return
    // Content can still be laying out; retry briefly until the page is tall enough.
    let tries = 0
    const tick = () => {
      tries += 1
      const maxY = document.documentElement.scrollHeight - window.innerHeight
      if (maxY >= y || tries > 30) {
        window.scrollTo(0, Math.min(y, Math.max(0, maxY)))
        return
      }
      window.setTimeout(tick, 50)
    }
    window.requestAnimationFrame(tick)
  }, [pathname, url])

  useEffect(() => {
    if (!pathname) return
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        // Ignore the scroll-to-top that happens while leaving this screen.
        if (window.location.pathname === pathname) saveScroll(pathname, window.scrollY)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [pathname])

  return null
}
