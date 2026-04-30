'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Work', href: '/work' },
  { label: 'Process', href: '/process' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#141414]/95 backdrop-blur-md border-b border-[#C9A84C]/20">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex flex-col">
          <span className="font-bold text-[#F5EFE3] text-lg tracking-wide">
            Yakini
          </span>
          <span className="text-[#C9A84C] text-[10px] tracking-[3px] uppercase">
            Digital Infrastructure
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-[11px] tracking-[2.5px] uppercase text-[#F5EFE3]/60 hover:text-[#C9A84C] transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/#contact"
          className="hidden md:block text-[10px] tracking-[2px] uppercase bg-[#C9A84C] text-[#141414] px-6 py-3 font-medium hover:bg-[#E2C97E] transition-colors"
        >
          Start a Project
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-[#F5EFE3] flex flex-col gap-1.5 p-2"
        >
          <span className={cn('w-6 h-px bg-current transition-all', isOpen && 'rotate-45 translate-y-2')} />
          <span className={cn('w-6 h-px bg-current transition-all', isOpen && 'opacity-0')} />
          <span className={cn('w-6 h-px bg-current transition-all', isOpen && '-rotate-45 -translate-y-2')} />
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-[#141414] border-t border-[#C9A84C]/20 px-6 py-6 flex flex-col gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="text-[12px] tracking-[2px] uppercase text-[#F5EFE3]/60 hover:text-[#C9A84C] transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            onClick={() => setIsOpen(false)}
            className="text-[10px] tracking-[2px] uppercase bg-[#C9A84C] text-[#141414] px-6 py-3 font-medium text-center mt-2"
          >
            Start a Project
          </Link>
        </div>
      )}
    </nav>
  )
}
