import Link from 'next/link'
import { cn } from '@/lib/utils'

const tiers = [
  {
    name: 'Starter Build',
    tag: 'Tier 1 — Authority',
    price: '$1,500',
    suffix: '– $2,500',
    retainer: '+ $150/mo retainer',
    featured: false,
    features: [
      'Custom single-page website',
      'Mobile-optimized design',
      'Menu or service display',
      'Contact & booking form',
      'Google Analytics setup',
      'Monthly updates & support',
    ],
  },
  {
    name: 'Pro Build',
    tag: 'Tier 2 — Most Popular',
    price: '$3,500',
    suffix: '– $6,000',
    retainer: '+ $250/mo retainer',
    featured: true,
    features: [
      'Full multi-section website',
      'Supabase backend',
      'Booking & lead capture system',
      'Brand assets & price sheets',
      'Client portal or dashboard',
      'Priority monthly support',
      'Seasonal content updates',
    ],
  },
  {
    name: 'Studio Plan',
    tag: 'Tier 3 — Subscription',
    price: '$500',
    suffix: '– $800/mo',
    retainer: 'No build fee required',
    featured: false,
    features: [
      'Professionally managed site',
      'Monthly content updates',
      'Menu & pricing changes',
      'Brand-consistent design',
      'Hosting included',
      'Cancel anytime',
    ],
  },
]

export function Pricing() {
  return (
    <section className="bg-[#141414] py-32 px-6 border-t border-[#C9A84C]/15">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
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
              Two ways to<br />
              <em className="text-[#C9A84C] not-italic">work with us.</em>
            </h2>
          </div>
          <p className="text-[#F5EFE3]/50 text-base leading-relaxed">
            Start with a full build and stay on retainer.
            Or come in on a monthly subscription with no build fee.
            Fixed pricing. No surprises. No scope creep. Ever.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#C9A84C]/10 border border-[#C9A84C]/10">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'flex flex-col p-10 transition-colors',
                tier.featured
                  ? 'bg-[#242424] border-t-2 border-t-[#C9A84C]'
                  : 'bg-[#1C1C1C] hover:bg-[#242424]'
              )}
            >
              {/* Tag */}
              <div className="text-[9px] tracking-[3px] uppercase text-[#C9A84C] mb-4">
                {tier.tag}
              </div>

              {/* Name */}
              <div className="text-[#F5EFE3] font-bold text-2xl mb-2">
                {tier.name}
              </div>

              {/* Price */}
              <div className="mb-1">
                <span className="text-[#C9A84C] font-bold text-4xl">
                  {tier.price}
                </span>
                <span className="text-[#F5EFE3]/40 text-lg ml-1">
                  {tier.suffix}
                </span>
              </div>
              <div className="text-[#F5EFE3]/30 text-sm mb-8 pb-8 border-b border-[#F5EFE3]/08">
                {tier.retainer}
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[#F5EFE3]/60">
                    <span className="text-[#C9A84C] text-[8px] mt-1 flex-shrink-0">◆</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/#contact"
                className={cn(
                  'mt-8 text-[10px] tracking-[2.5px] uppercase text-center py-4 transition-colors',
                  tier.featured
                    ? 'bg-[#C9A84C] text-[#141414] hover:bg-[#E2C97E]'
                    : 'border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10'
                )}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-[#F5EFE3]/25 text-sm mt-8 italic">
          All builds include a complimentary 30-minute discovery call
          and fixed quote within 24 hours.
        </p>

      </div>
    </section>
  )
}
