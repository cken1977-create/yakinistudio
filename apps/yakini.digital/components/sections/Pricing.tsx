import Link from 'next/link'
import { cn } from '@/lib/utils'

const shapes = [
  {
    name: 'Launch Kit',
    tag: 'Fixed scope · 2–4 weeks',
    price: '$10,000',
    suffix: 'typical',
    retainer: 'Then $200–$400/mo',
    featured: false,
    features: [
      'Private client portal',
      'Intake, timeline, alerts',
      'Your brand, domain, and data',
      'Built on our product stack',
    ],
  },
  {
    name: 'Launch Operate',
    tag: 'Featured',
    price: '$22,000',
    suffix: 'typical',
    retainer: 'Then $750–$1,500/mo',
    featured: true,
    features: [
      'Everything in Launch Kit',
      'Weekly operating rhythm',
      'Client dashboard',
      'We run it with you',
    ],
  },
  {
    name: 'Launch Custom',
    tag: 'Discovery first',
    price: '$7,000',
    suffix: 'discovery',
    retainer: 'Care $2,500–$4,000/mo',
    featured: false,
    features: [
      'Paid discovery · keep the roadmap',
      'Phase 1: replace the core',
      'Phase 2: integrations & handoff',
      'Year-one ~$75k–$120k cash',
    ],
  },
]

export function Pricing() {
  return (
    <section className="bg-[#141414] py-32 px-6 border-t border-[#C9A84C]/15">
      <div className="max-w-7xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
                Pricing
              </span>
            </div>
            <h2 className="font-bold text-[#F5EFE3] leading-none tracking-tight"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
              Launch.<br />
              <em className="text-[#C9A84C] not-italic">Operate.</em>
            </h2>
          </div>
          <p className="text-[#F5EFE3]/50 text-base leading-relaxed">
            We build your system, then we run it with you.
            Ranges, not fake precision. Monthly required on hosted work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#C9A84C]/10 border border-[#C9A84C]/10">
          {shapes.map((shape) => (
            <div
              key={shape.name}
              className={cn(
                'flex flex-col p-10 transition-colors',
                shape.featured
                  ? 'bg-[#242424] border-t-2 border-t-[#C9A84C]'
                  : 'bg-[#1C1C1C] hover:bg-[#242424]'
              )}
            >
              <div className="text-[9px] tracking-[3px] uppercase text-[#C9A84C] mb-4">
                {shape.tag}
              </div>

              <div className="text-[#F5EFE3] font-bold text-2xl mb-2">
                {shape.name}
              </div>

              <div className="mb-1">
                <span className="text-[#C9A84C] font-bold text-4xl">
                  {shape.price}
                </span>
                <span className="text-[#F5EFE3]/40 text-lg ml-1">
                  {shape.suffix}
                </span>
              </div>
              <div className="text-[#F5EFE3]/30 text-sm mb-8 pb-8 border-b border-[#F5EFE3]/08">
                {shape.retainer}
              </div>

              <ul className="flex flex-col gap-3 flex-1">
                {shape.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[#F5EFE3]/60">
                    <span className="text-[#C9A84C] text-[8px] mt-1 flex-shrink-0">◆</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className={cn(
                  'mt-8 text-[10px] tracking-[2.5px] uppercase text-center py-4 transition-colors',
                  shape.featured
                    ? 'bg-[#C9A84C] text-[#141414] hover:bg-[#E2C97E]'
                    : 'border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10'
                )}
              >
                See full pricing
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[#F5EFE3]/25 text-sm mt-8 italic">
          Discovery is paid. Scope growth is a new quote. We don&apos;t launch and leave.
        </p>

      </div>
    </section>
  )
}
