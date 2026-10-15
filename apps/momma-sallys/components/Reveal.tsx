'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Scroll-triggered reveal wrapper. Zero dependencies — IntersectionObserver
 * + CSS. Respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`ms-reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** Include once per page that uses <Reveal/>. */
export function RevealStyles() {
  return (
    <style>{`
      .ms-reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s ease, transform .7s cubic-bezier(.22,1,.36,1); }
      .ms-reveal.is-visible { opacity: 1; transform: none; }
      @media (prefers-reduced-motion: reduce) { .ms-reveal { opacity: 1; transform: none; transition: none; } }
    `}</style>
  )
}
