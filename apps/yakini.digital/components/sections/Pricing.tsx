import Link from 'next/link'
import {
  CUSTOM_OFFER,
  FLAT_PRICING_NOTE,
  KIT_TIERS,
  PASS_THROUGH_NOTE,
  SELF_SERVE_PLANS,
  selfServeStartUrl,
  SELF_SERVE_SETUP_NOTE,
  kitPriceLabel,
  selfServePriceLabel,
} from '@/lib/pricing'

const shapes = [
  ...SELF_SERVE_PLANS.map((plan) => ({
    name: plan.name,
    tag: 'Self-serve plan',
    price: selfServePriceLabel(plan),
    detail: SELF_SERVE_SETUP_NOTE,
    href: selfServeStartUrl(plan.id),
    external: true,
    features: plan.includes.slice(0, 4),
  })),
  {
    name: 'Fully built kits',
    tag: 'Pilot through House',
    price: kitPriceLabel(KIT_TIERS[0]).replace(/ · 6-month minimum$/, ''),
    detail: 'Crew and above have a six-month minimum.',
    href: '/pricing',
    external: false,
    features: KIT_TIERS.map((tier) => `${tier.name} · ${kitPriceLabel(tier)}`),
  },
  {
    name: CUSTOM_OFFER.name,
    tag: 'Quoted separately',
    price: 'Quoted',
    detail: CUSTOM_OFFER.summary,
    href: '/apply?tier=custom',
    external: false,
    features: [FLAT_PRICING_NOTE, PASS_THROUGH_NOTE],
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
              One price list.<br />
              <em className="text-[#C9A84C] not-italic">Flat.</em>
            </h2>
          </div>
          <p className="text-[#F5EFE3]/50 text-base leading-relaxed">
            {FLAT_PRICING_NOTE} Self-serve plans, fully built kits, or a custom quote.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-[#C9A84C]/10 border border-[#C9A84C]/10">
          {shapes.map((shape) => (
            <div
              key={shape.name}
              className="flex flex-col p-10 bg-[#1C1C1C]"
            >
              <div className="text-[9px] tracking-[3px] uppercase text-[#C9A84C] mb-4">
                {shape.tag}
              </div>

              <div className="text-[#F5EFE3] font-bold text-2xl mb-2">
                {shape.name}
              </div>

              <div className="mb-1">
                <span className="text-[#C9A84C] font-bold text-3xl">
                  {shape.price}
                </span>
              </div>
              <div className="text-[#F5EFE3]/30 text-sm mb-8 pb-8 border-b border-[#F5EFE3]/08">
                {shape.detail}
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
                href={shape.href}
                {...(shape.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="mt-8 text-[10px] tracking-[2.5px] uppercase text-center py-4 transition-colors border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10"
              >
                {shape.external ? 'Sign up' : 'See pricing'}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[#F5EFE3]/25 text-sm mt-8 italic">
          {PASS_THROUGH_NOTE}
        </p>

      </div>
    </section>
  )
}
