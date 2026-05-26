import Link from 'next/link'

export default function WorkPage() {
  return (
    <div className="min-h-screen pt-24" style={{
      background: "linear-gradient(180deg, rgba(10, 9, 8, 0.85) 0%, rgba(10, 9, 8, 0.92) 100%), url('/yakini-work-bg.jpg') center top / cover no-repeat fixed",
    }}>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-24 border-b border-[#C9A84C]/15 bg-[#141414]/90 backdrop-blur-sm rounded-lg my-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-px bg-[#C9A84C]" />
          <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
            Our Work
          </span>
        </div>
        <h1 className="font-bold text-[#F5EFE3] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] leading-none tracking-tight mb-6"
          style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}>
          Built for founders<br />
          <em className="text-[#C9A84C] not-italic">who mean it.</em>
        </h1>
        <p className="text-[#F5EFE3] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/50 text-lg leading-relaxed max-w-2xl">
          Every client gets institutional-grade work. Here's the proof.
        </p>
      </div>

      {/* Case Study 001 */}
      <div className="max-w-7xl mx-auto px-6 py-24 bg-[#141414]/90 backdrop-blur-sm rounded-lg my-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Left */}
          <div>
            <div className="text-[#C9A84C] text-[9px] tracking-[4px] uppercase mb-4">
              Case Study — 001
            </div>
            <h2 className="font-bold text-[#F5EFE3] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] text-4xl mb-2 leading-tight">
              Pettít Luxe Group
            </h2>
            <p className="text-[#C9A84C] text-lg italic mb-6">
              by Chef Jada — Culinary Consulting & Kitchen Training
            </p>
            <p className="text-[#F5EFE3] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/50 text-base leading-relaxed mb-6">
              Chef Jada came to Yakini with a vision — a signature menu,
              a consulting practice for restaurant owners, and a kitchen
              training program with no digital infrastructure to support
              any of it. No website. No pricing documents. No professional
              materials. No brand system.
            </p>
            <p className="text-[#F5EFE3] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/50 text-base leading-relaxed mb-10">
              We built the entire foundation from scratch. One session.
              Everything she needed to walk into any room and close.
            </p>

            {/* Deliverables */}
            <div className="border border-[#C9A84C]/15 mb-10">
              {[
                'Full luxury website — Pettít Luxe Group',
                '9-service offering with booking system',
                'Cannabis Infused Dinner Experience — signature section',
                'Caviar & Oyster Bar and Ayurveda Nutritionist added',
                'Shop section — Marry Me Chicken Rub & Amazin Cajun',
                'Complete consulting rate card with 3 service tiers',
                'Pitch one-pager for restaurant owners',
                'Menu price sheet across 3 service models',
                '17-dish recipe card system with plating guides',
                'Sol & Stone restaurant menu — print-ready PDF',
              ].map((item, i) => (
                <div key={i}
                  className="flex items-center gap-3 px-5 py-3 border-b border-[#C9A84C]/10 last:border-0">
                  <span className="text-[#C9A84C] text-[8px] flex-shrink-0">◆</span>
                  <span className="text-[#F5EFE3] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/60 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <Link href="/#contact"
              className="text-[11px] tracking-[2.5px] uppercase bg-[#C9A84C] text-[#141414] px-8 py-4 font-medium hover:bg-[#E2C97E] transition-colors inline-block">
              Start Your Project
            </Link>
          </div>

          {/* Right — Stats */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-1 bg-[#C9A84C]/10 border border-[#C9A84C]/10">
              {[
                { num: '17', label: 'Dishes documented with full recipes & plating guides' },
                { num: '9', label: 'Services live on her website with booking system' },
                { num: '$7.5K', label: 'Top-end consulting package value unlocked' },
                { num: '1', label: 'Session to go from zero to institutional-grade' },
              ].map((stat) => (
                <div key={stat.num} className="bg-[#1C1C1C] p-8">
                  <div className="font-bold text-[#C9A84C] text-4xl mb-2 leading-none">
                    {stat.num}
                  </div>
                  <div className="text-[#F5EFE3] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/40 text-xs leading-relaxed">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Services delivered */}
            <div className="bg-[#1C1C1C] border border-[#C9A84C]/10 p-8">
              <div className="text-[#C9A84C] text-[9px] tracking-[3px] uppercase mb-4">
                Services Delivered
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Authority Site',
                  'Conversion System',
                  'Brand Identity',
                  'PDF Documents',
                  'Recipe System',
                  'Pricing Infrastructure',
                  'Email Setup',
                  'Consulting Deck',
                ].map((tag) => (
                  <span key={tag}
                    className="text-[10px] tracking-[1.5px] uppercase text-[#F5EFE3]/40 border border-[#F5EFE3]/10 px-3 py-1.5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Quote */}
            <div className="bg-[#1C1C1C] border border-[#C9A84C]/10 p-8 border-l-2 border-l-[#C9A84C]">
              <p className="text-[#F5EFE3] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/60 text-sm italic leading-relaxed mb-4">
                "Everything I needed to walk into any room and close.
                Yakini built my foundation."
              </p>
              <div className="text-[#C9A84C] text-[10px] tracking-[2px] uppercase">
                Chef Jada — Pettít Luxe Group
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Study 002 — Coming */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="border border-[#C9A84C]/10 bg-[#1C1C1C] p-12 text-center">
          <div className="text-[#C9A84C] text-[9px] tracking-[4px] uppercase mb-4">
            Case Study — 002
          </div>
          <h3 className="text-[#F5EFE3] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/30 text-2xl font-bold mb-2">
            PX3 Energy Services
          </h3>
          <p className="text-[#F5EFE3] [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/20 text-sm italic">
            Odessa, TX — Oilfield Services — Coming Soon
          </p>
        </div>
      </div>

    </div>
  )
}
