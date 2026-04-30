import Link from 'next/link'

export function ProductMockup() {
  return (
    <section className="bg-[#141414] py-32 px-6 border-t border-[#C9A84C]/15">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
              Yakini Intelligence — In Action
            </span>
          </div>
          <h2 className="font-bold text-[#F5EFE3] leading-none tracking-tight mb-4"
            style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
            Your AI business partner.<br />
            <em className="text-[#C9A84C] not-italic">Built into your infrastructure.</em>
          </h2>
          <p className="text-[#F5EFE3]/50 text-base leading-relaxed max-w-xl">
            Every Yakini client gets access to AI tools built for their industry.
            Here's what it looks like in practice.
          </p>
        </div>

        {/* Mockup container */}
        <div className="border border-[#C9A84C]/15 bg-[#1C1C1C]">

          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#C9A84C]/10 bg-[#141414]">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            <div className="flex-1 mx-4 bg-[#1C1C1C] border border-[#F5EFE3]/10 rounded px-3 py-1 text-[#F5EFE3]/30 text-xs font-mono">
              yakini.digital/client/tools/menu
            </div>
            <div className="text-[#C9A84C] text-[9px] tracking-[2px] uppercase">
              🔒 Client Portal
            </div>
          </div>

          {/* Interface */}
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Left — Input panel */}
            <div className="p-6 border-b md:border-b-0 md:border-r border-[#C9A84C]/10">
              <div className="text-[9px] tracking-[3px] uppercase text-[#C9A84C] mb-3">
                Yakini Intelligence — 01 / Menu Builder
              </div>
              <div className="text-[#F5EFE3]/30 text-[9px] tracking-[2px] uppercase mb-3">
                Describe Your Concept
              </div>
              <div className="bg-[#141414] border border-[#F5EFE3]/10 p-3 text-[#F5EFE3]/50 text-xs font-mono leading-relaxed mb-4 min-h-[120px]">
                Mediterranean-American, upscale casual,
                seafood and wagyu focus, 8 dishes,
                Houston TX market, price range $25–$85...
              </div>
              <div className="bg-[#C9A84C] text-[#141414] text-[10px] tracking-[2px] uppercase py-3 text-center font-medium">
                Build Menu ◆
              </div>
            </div>

            {/* Right — Output panel */}
            <div className="p-6 relative">
              <div className="text-[#F5EFE3]/30 text-[9px] tracking-[2px] uppercase mb-3">
                Generated Menu
              </div>
              <div className="text-[#F5EFE3]/60 text-xs font-mono leading-relaxed">
                <div className="text-[#C9A84C] font-bold mb-2 text-sm">
                  AZURA KITCHEN & BAR
                </div>
                <div className="text-[#F5EFE3]/40 mb-3 text-[10px]">
                  Mediterranean-American | Houston, TX
                </div>
                <div className="text-[#F5EFE3]/50 text-[10px] mb-1 uppercase tracking-wider">
                  — Appetizers —
                </div>
                <div className="mb-2">
                  <span className="text-[#F5EFE3]/80">Charred Octopus à la Plancha</span>
                  <span className="text-[#C9A84C]"> — $22</span>
                </div>
                <div className="mb-2">
                  <span className="text-[#F5EFE3]/80">Wagyu Beef Tartare</span>
                  <span className="text-[#C9A84C]"> — $26</span>
                </div>
                <div className="mb-3">
                  <span className="text-[#F5EFE3]/80">Gulf Shrimp Saganaki</span>
                  <span className="text-[#C9A84C]"> — $19</span>
                </div>
                <div className="text-[#F5EFE3]/50 text-[10px] mb-1 uppercase tracking-wider">
                  — Mains —
                </div>
                <div className="mb-2">
                  <span className="text-[#F5EFE3]/80">Pan-Roasted Gulf Red Snapper</span>
                  <span className="text-[#C9A84C]"> — $44</span>
                </div>
                <div className="mb-2">
                  <span className="text-[#F5EFE3]/80">Wagyu Ribeye 14oz</span>
                  <span className="text-[#C9A84C]"> — $78</span>
                </div>
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/70 to-transparent flex flex-col items-center justify-end pb-8">
                <div className="bg-[#141414] border border-[#C9A84C]/20 px-6 py-4 text-center">
                  <div className="text-[#C9A84C] text-lg mb-2">🔒</div>
                  <div className="text-[#F5EFE3]/50 text-xs tracking-[2px] uppercase mb-3">
                    Client Access Only
                  </div>
                  <Link href="/#contact"
                    className="text-[10px] tracking-[2px] uppercase bg-[#C9A84C] text-[#141414] px-6 py-2 inline-block hover:bg-[#E2C97E] transition-colors">
                    Get Access →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom stats bar */}
          <div className="grid grid-cols-3 border-t border-[#C9A84C]/10">
            {[
              { num: '5', label: 'AI Tools Included' },
              { num: '30s', label: 'Average Generation Time' },
              { num: '∞', label: 'Queries Per Month' },
            ].map((stat) => (
              <div key={stat.num}
                className="py-4 px-6 text-center border-r last:border-0 border-[#C9A84C]/10">
                <div className="text-[#C9A84C] font-bold text-xl mb-1">{stat.num}</div>
                <div className="text-[#F5EFE3]/30 text-[9px] tracking-[1.5px] uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-[#F5EFE3]/30 text-sm italic mb-4">
            Menu Builder, Recipe Costing, Pricing Strategy, Business Operations,
            and Industry Intelligence — included in every Pro Build and above.
          </p>
          <Link href="/#contact"
            className="text-[11px] tracking-[2.5px] uppercase bg-[#C9A84C] text-[#141414] px-10 py-4 font-medium hover:bg-[#E2C97E] transition-colors inline-block">
            Start a Project to Get Access
          </Link>
        </div>

      </div>
    </section>
  )
}
