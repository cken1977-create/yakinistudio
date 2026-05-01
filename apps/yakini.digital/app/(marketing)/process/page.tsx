import Link from 'next/link'

export default function ProcessPage() {
  return (
    <div className="min-h-screen bg-[#141414] pt-24">

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-24 border-b border-[#C9A84C]/15">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-px bg-[#C9A84C]" />
          <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
            How We Work
          </span>
        </div>
        <h1 className="font-bold text-[#F5EFE3] leading-none tracking-tight mb-6"
          style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}>
          Simple process.<br />
          <em className="text-[#C9A84C] not-italic">Serious results.</em>
        </h1>
        <p className="text-[#F5EFE3]/50 text-lg leading-relaxed max-w-2xl">
          No bloat. No surprises. No scope creep. Just fast, clean delivery
          and infrastructure that works as hard as you do.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col gap-0 border border-[#C9A84C]/10">
          {[
            {
              number: '01',
              title: 'Discovery Call',
              duration: '30 minutes — Free',
              description: 'We learn your business, your goals, and what you actually need. No pitch. No pressure. Just a real conversation about where you are and where you want to go. We ask the right questions so we can scope the right solution.',
              details: [
                'Tell us about your business and current situation',
                'Walk us through what you have and what you need',
                'We identify which tier fits your goals',
                'You leave with clarity — not a sales pitch',
              ],
            },
            {
              number: '02',
              title: 'Scope & Fixed Quote',
              duration: 'Within 24 hours',
              description: 'Within 24 hours of your discovery call we send a clear scope of work and a fixed price. Not an estimate. Not a range. A number. You know exactly what you\'re getting and exactly what it costs before a single line of code is written.',
              details: [
                'Detailed scope of every deliverable',
                'Fixed price — no hourly billing ever',
                'Timeline with milestones',
                'What\'s included and what\'s not — clearly stated',
              ],
            },
            {
              number: '03',
              title: 'Deposit & Kickoff',
              duration: '50% to start',
              description: 'A 50% deposit confirms your project and locks your timeline. We immediately begin architecture, design direction, and content gathering. You get a direct line to your builder — not a project manager who relays messages.',
              details: [
                '50% deposit secures your spot',
                'Direct communication — no middlemen',
                'Content and asset collection begins',
                'Build timeline confirmed',
              ],
            },
            {
              number: '04',
              title: 'Build',
              duration: '5–10 business days',
              description: 'We build fast and we build right. Most projects are delivered within 5–10 business days from deposit. You see the work before it goes live — nothing launches without your approval. Every file is clean, documented, and yours.',
              details: [
                'Daily or milestone-based progress updates',
                'Preview link before launch',
                'Your approval required before anything goes live',
                'Clean code, documented, fully yours',
              ],
            },
            {
              number: '05',
              title: 'Launch',
              duration: 'You approve — we deploy',
              description: 'When you say go, we go. Domain connection, SSL certificate, performance optimization, analytics setup — everything is handled. You launch with confidence knowing the infrastructure is solid from day one.',
              details: [
                'Domain connection and SSL',
                'Performance and SEO optimization',
                'Analytics configured',
                'Final balance due on launch',
              ],
            },
            {
              number: '06',
              title: 'Retainer Support',
              duration: 'Ongoing — monthly',
              description: 'We stay on. Monthly retainer means your site stays current, your systems keep working, and you have a builder in your corner when you need one. Seasonal updates, new pages, pricing changes, technical fixes — handled.',
              details: [
                'Monthly content and pricing updates',
                'Technical maintenance and monitoring',
                'New pages or features as needed',
                'Priority response within 24 hours',
              ],
            },
          ].map((step, i) => (
            <div key={step.number}
              className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-[#C9A84C]/10 last:border-0">

              {/* Number + Title */}
              <div className="p-10 border-b md:border-b-0 md:border-r border-[#C9A84C]/10 bg-[#1C1C1C]">
                <div className="font-bold text-[#C9A84C]/20 text-6xl leading-none mb-4">
                  {step.number}
                </div>
                <div className="text-[#F5EFE3] font-bold text-xl mb-2">
                  {step.title}
                </div>
                <div className="text-[#C9A84C] text-[10px] tracking-[2px] uppercase">
                  {step.duration}
                </div>
              </div>

              {/* Description */}
              <div className="p-10 border-b md:border-b-0 md:border-r border-[#C9A84C]/10">
                <p className="text-[#F5EFE3]/50 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Details */}
              <div className="p-10">
                <ul className="flex flex-col gap-3">
                  {step.details.map((detail) => (
                    <li key={detail}
                      className="flex items-start gap-3 text-sm text-[#F5EFE3]/40">
                      <span className="text-[#C9A84C] text-[8px] mt-1 flex-shrink-0">
                        ◆
                      </span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Principles */}
      <div className="bg-[#1C1C1C] border-t border-[#C9A84C]/15 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
              Our Principles
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-[#C9A84C]/10 border border-[#C9A84C]/10">
            {[
              {
                title: 'Fixed Pricing',
                body: 'Every project has a fixed price agreed before work begins. No hourly billing. No surprise invoices. No scope creep. Ever.',
              },
              {
                title: 'Fast Delivery',
                body: 'Most projects delivered in 5–10 business days. We move fast because your time has value and momentum matters.',
              },
              {
                title: 'Your Infrastructure',
                body: 'Everything we build is yours. Code, domain, database — you own it all. We\'re your builder, not your landlord.',
              },
            ].map((p) => (
              <div key={p.title} className="bg-[#1C1C1C] p-10">
                <div className="text-[#F5EFE3] font-bold text-lg mb-3">
                  {p.title}
                </div>
                <div className="text-[#F5EFE3]/40 text-sm leading-relaxed">
                  {p.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="font-bold text-[#F5EFE3] text-4xl mb-4 leading-tight">
          Ready to start?
        </h2>
        <p className="text-[#F5EFE3]/40 text-base mb-10 italic">
          Discovery call is free. Fixed quote within 24 hours.
        </p>
        <Link href="/#contact"
          className="text-[11px] tracking-[2.5px] uppercase bg-[#C9A84C] text-[#141414] px-10 py-4 font-medium hover:bg-[#E2C97E] transition-colors inline-block">
          Start a Project
        </Link>
      </div>

    </div>
  )
}
