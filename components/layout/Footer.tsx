import Link from 'next/link'

const services = [
  { label: 'Authority Sites', href: '/services' },
  { label: 'Conversion Systems', href: '/services' },
  { label: 'Operations', href: '/services' },
  { label: 'Mobile Apps', href: '/services' },
]

const company = [
  { label: 'Work', href: '/work' },
  { label: 'Process', href: '/process' },
  { label: 'Pricing', href: '/pricing' },
]

export function Footer() {
  return (
    <footer className="bg-[#141414] border-t border-[#C9A84C]/20">
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-[#F5EFE3]/10">

          {/* Brand */}
          <div>
            <div className="font-bold text-[#F5EFE3] text-xl mb-1">
              Yakini
            </div>
            <div className="text-[#C9A84C] text-[10px] tracking-[3px] uppercase mb-4">
              Digital Infrastructure
            </div>
            <p className="text-[#F5EFE3]/40 text-sm leading-relaxed max-w-xs">
              We build what you build on. Digital infrastructure for founders who are serious about growth.
            </p>
          </div>

          {/* Services */}
          <div>
            <div className="text-[#C9A84C] text-[9px] tracking-[3px] uppercase mb-4">
              Services
            </div>
            <ul className="flex flex-col gap-3">
              {services.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[#F5EFE3]/50 text-sm italic hover:text-[#C9A84C] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-[#C9A84C] text-[9px] tracking-[3px] uppercase mb-4">
              Company
            </div>
            <ul className="flex flex-col gap-3">
              {company.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[#F5EFE3]/50 text-sm italic hover:text-[#C9A84C] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <div className="text-[#C9A84C] text-[9px] tracking-[3px] uppercase mb-3">
                Contact
              </div>
              <a
                href="mailto:hello@yakini.digital"
                className="text-[#F5EFE3]/50 text-sm italic hover:text-[#C9A84C] transition-colors"
              >
                hello@yakini.digital
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[#F5EFE3]/25 text-xs tracking-wide">
            © 2026 YAKINI LLC — ALL RIGHTS RESERVED
          </div>
          <div className="text-[#C9A84C] text-xs italic">
            We build what you build on.
          </div>
        </div>

      </div>
    </footer>
  )
}
