import { Hero } from '@/components/sections/Hero'
import { Services } from '@/components/sections/Services'
import { Pricing } from '@/components/sections/Pricing'
import { IntakeForm } from '@/components/sections/IntakeForm'
import { AiTools } from '@/components/sections/AiTools'
import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="bg-[#141414] py-32 px-6 border-t border-[#C9A84C]/15">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-px bg-[#C9A84C]" />
                <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">About Yakini</span>
              </div>
              <h2 className="font-bold text-[#F5EFE3] leading-none tracking-tight mb-8" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
                We are not a<br />
                <em className="text-[#C9A84C] not-italic">design shop.</em>
              </h2>
              <p className="text-[#F5EFE3]/50 text-base leading-relaxed mb-6">
                Yakini means "one who is certain" — and that is exactly what we are. Certain about the work. Certain about the standards. Certain about what small businesses actually need to grow.
              </p>
              <p className="text-[#F5EFE3]/50 text-base leading-relaxed mb-10">
                We build digital infrastructure for operators — personal chefs, food trucks, restaurants, energy companies, and any founder serious about building something that lasts.
              </p>
              <Link href="/work" className="text-[11px] tracking-[2.5px] uppercase text-[#C9A84C] border-b border-[#C9A84C]/30 pb-0.5 hover:border-[#C9A84C] transition-colors">
                See Our Work →
              </Link>
            </div>
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-2 gap-1">
                {[
                  { num: '3', label: 'Industries served' },
                  { num: '5', label: 'Service tiers' },
                  { num: '24hr', label: 'Quote turnaround' },
                  { num: '100%', label: 'Fixed pricing always' },
                ].map((stat) => (
                  <div key={stat.num} className="bg-[#1C1C1C] border border-[#C9A84C]/10 p-8">
                    <div className="font-bold text-[#C9A84C] text-4xl mb-2 leading-none">{stat.num}</div>
                    <div className="text-[#F5EFE3]/30 text-xs leading-relaxed">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Services />
      <AiTools />
      <Pricing />
      <IntakeForm />
    </>
  )
}
