'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(24px)'
    setTimeout(() => {
      el.style.transition = 'opacity 0.9s ease, transform 0.9s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, 100)
  }, [])

  return (
    <section className="min-h-screen bg-[#141414] flex flex-col justify-center relative overflow-hidden px-6">

      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 bottom-0 left-6 w-px bg-[#F5EFE3]/05" />
        <div className="absolute top-0 bottom-0 right-6 w-px bg-[#F5EFE3]/05" />
        <div className="absolute top-0 bottom-0 left-1/3 w-px bg-[#F5EFE3]/05 hidden md:block" />
        <div className="absolute top-0 bottom-0 right-1/3 w-px bg-[#F5EFE3]/05 hidden md:block" />
      </div>

      <div className="max-w-7xl mx-auto w-full py-32 relative z-10">

        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-8 opacity-0 animate-fadeUp"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <div className="w-8 h-px bg-[#C9A84C]" />
          <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
            Yakini — Digital Infrastructure
          </span>
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="font-bold text-[#F5EFE3] leading-none tracking-tight mb-8"
          style={{ fontSize: 'clamp(52px, 9vw, 120px)' }}
        >
          We build what<br />
          you{' '}
          <em className="text-[#C9A84C] not-italic">build on.</em>
        </h1>

        {/* Sub */}
        <p className="text-[#F5EFE3]/50 text-lg leading-relaxed max-w-xl mb-12
          opacity-0 animate-fadeUp"
          style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          Digital infrastructure for personal chefs, restaurants,
          food trucks, and small business founders who are serious
          about growth.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-6 opacity-0 animate-fadeUp"
          style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
          <Link
            href="/#contact"
            className="text-[11px] tracking-[2.5px] uppercase bg-[#C9A84C] text-[#141414] px-8 py-4 font-medium hover:bg-[#E2C97E] transition-colors"
          >
            Start a Project
          </Link>
          <Link
            href="/work"
            className="text-[11px] tracking-[2.5px] uppercase text-[#F5EFE3]/50 border-b border-[#C9A84C]/30 pb-0.5 hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors"
          >
            See Our Work →
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-6 flex items-center gap-3
          opacity-0 animate-fadeUp"
          style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}>
          <div className="w-10 h-px bg-[#C9A84C]" />
          <span className="text-[#F5EFE3]/30 text-[9px] tracking-[3px] uppercase">
            Scroll to explore
          </span>
        </div>

      </div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#C9A84C]/15 bg-[#1C1C1C] py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[
            'Personal Chefs', 'Food Trucks', 'Restaurants',
            'Small Business', 'Hospitality', 'Founders',
            'Personal Chefs', 'Food Trucks', 'Restaurants',
            'Small Business', 'Hospitality', 'Founders',
          ].map((item, i) => (
            <span key={i} className="mx-8 text-[11px] tracking-[3px] uppercase text-[#F5EFE3]/30">
              {i % 1 === 0 ? item : '◆'}
            </span>
          ))}
        </div>
      </div>

    </section>
  )
        }
