import Link from 'next/link'

export default function ServicesPage() {
  return (
    <div className="min-h-screen pt-24" style={{
      background: "linear-gradient(180deg, rgba(10, 9, 8, 0.30) 0%, rgba(10, 9, 8, 0.45) 100%), url('/yakini-services-bg.jpg') center top / cover no-repeat fixed",
    }}>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-24 border-b border-[#C9A84C]/15 bg-[#141414]/90 backdrop-blur-sm rounded-lg my-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-px bg-[#C9A84C]" />
          <span style={{color: "#FFD700"}} className=" text-[10px] tracking-[4px] uppercase">
            Services
          </span>
        </div>
        <h1 style={{color: "#FFFFFF"}} className="font-bold [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] leading-none tracking-tight mb-6"
          style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}>
          Infrastructure for<br />
          <em style={{color: "#FFD700"}} className=" not-italic">serious builders.</em>
        </h1>
        <p style={{color: "#FFFFFF"}} className=" [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/50 text-lg leading-relaxed max-w-2xl">
          Four tiers. One ladder. Start where you are and scale
          as your business grows. Every tier builds on the last.
        </p>
      </div>

      {/* Product Ladder */}
      <div className="max-w-7xl mx-auto px-6 py-24 bg-[#141414]/90 backdrop-blur-sm rounded-lg my-8">
        <div className="flex flex-col gap-1">
          {[
            {
              tier: 'Tier 1',
              tag: 'Authority',
              title: 'Website Design & Development',
              price: '$1,500 – $3,500',
              retainer: '+ $150/mo',
              description: 'Your digital foundation. A custom-built site that loads fast, looks premium, and positions you as the serious operator you are. No templates. No shortcuts. Your site becomes your hardest working employee.',
              includes: [
                'Custom Next.js development',
                'Mobile-optimized design',
                'Service or menu display',
                'Contact & booking form',
                'SEO foundation built in',
                'Google Analytics setup',
                'SSL and performance optimization',
                'Monthly retainer support',
              ],
              best: 'Personal chefs, food trucks, restaurants, consultants, service businesses',
              cta: 'Start with Authority',
            },
            {
              tier: 'Tier 2',
              tag: 'Conversion',
              title: 'Booking & Lead Capture Systems',
              price: '$3,500 – $6,000',
              retainer: '+ $250/mo',
              description: 'Not just a contact form. A full lead capture system — bookings, inquiries, and quotes stored permanently in your database. Every client who fills out your form is captured, timestamped, and ready for follow-up.',
              includes: [
                'Everything in Tier 1',
                'Supabase database backend',
                'Lead capture and storage',
                'Booking request system',
                'Email notifications on every submission',
                'Client confirmation emails',
                'Lead dashboard access',
                'Priority retainer support',
              ],
              best: 'Businesses with high inquiry volume, personal chefs, caterers, consultants',
              cta: 'Start with Conversion',
            },
            {
              tier: 'Tier 3',
              tag: 'Operations',
              title: 'Client Portals & Dashboards',
              price: '$6,000 – $12,000',
              retainer: '+ $400/mo',
              description: 'Internal tools that run your business — quote builders, booking pipelines, client history, menu update panels, and light CRM systems. This is where Yakini becomes indispensable. Clients don\'t cancel systems that run their business.',
              includes: [
                'Everything in Tier 2',
                'Client-facing portal',
                'Internal operations dashboard',
                'Quote and proposal builder',
                'Client history and notes',
                'Workflow automation',
                'Menu or service update panel',
                'Dedicated support',
              ],
              best: 'Growing businesses, multi-service operators, restaurant groups, agencies',
              cta: 'Start with Operations',
            },
            {
              tier: 'Tier 4',
              tag: 'Retention',
              title: 'Mobile Apps',
              price: '$10,000 – $20,000+',
              retainer: '+ $500/mo',
              description: 'Client-facing mobile apps for ordering, loyalty, memberships, and retention. Built in React Native — shares code with your web stack for maximum efficiency. Only recommended when repeat customers and frequency justify it.',
              includes: [
                'Everything in Tier 3',
                'iOS & Android app',
                'Push notifications',
                'In-app ordering or booking',
                'Loyalty and membership system',
                'User accounts and profiles',
                'App Store and Play Store submission',
                'Ongoing mobile support',
              ],
              best: 'Food ordering, loyalty programs, membership communities, subscription services',
              cta: 'Start with Retention',
            },
            {
              tier: 'Tier 5',
              tag: 'Intelligence',
              title: 'AI Business Tools',
              price: 'Custom',
              retainer: 'Custom',
              description: 'AI-powered business intelligence built directly into your infrastructure. Menu builders, recipe costing engines, pricing analysis, cost of goods tracking, and readiness scoring — all powered by Claude AI. This is where Yakini becomes untouchable.',
              includes: [
                'Everything in Tier 4',
                'AI menu builder',
                'Recipe costing engine',
                'Pricing strategy analysis',
                'Cost of goods tracker',
                'Business readiness scoring',
                'Competitive pricing intelligence',
                'Custom AI workflows',
              ],
              best: 'Serious operators ready to run their business like an institution',
              cta: 'Inquire About AI',
            },
          ].map((service, i) => (
            <div key={service.tier}
              className="grid grid-cols-1 md:grid-cols-5 gap-0 border border-[#C9A84C]/10 bg-[#1C1C1C]">

              {/* Tier label */}
              <div className="md:col-span-1 p-8 border-b md:border-b-0 md:border-r border-[#C9A84C]/10 flex flex-col justify-between">
                <div>
                  <div style={{color: "#FFD700"}} className=" text-[9px] tracking-[3px] uppercase mb-2">
                    {service.tier}
                  </div>
                  <div style={{color: "#FFFFFF"}} className=" [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/20 text-[9px] tracking-[2px] uppercase border border-[#F5EFE3]/10 px-2 py-1 inline-block mb-4">
                    {service.tag}
                  </div>
                  <div style={{color: "#FFD700"}} className=" font-bold text-2xl leading-none">
                    {service.price}
                  </div>
                  <div style={{color: "#FFFFFF"}} className=" [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/30 text-xs mt-1">
                    {service.retainer}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="md:col-span-2 p-8 border-b md:border-b-0 md:border-r border-[#C9A84C]/10">
                <h2 style={{color: "#FFFFFF"}} className=" [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] font-bold text-xl mb-3 leading-tight">
                  {service.title}
                </h2>
                <p style={{color: "#FFFFFF"}} className=" [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/40 text-sm leading-relaxed mb-6">
                  {service.description}
                </p>
                <div style={{color: "#FFD700"}} className=" text-[9px] tracking-[2px] uppercase mb-2">
                  Best For
                </div>
                <p style={{color: "#FFFFFF"}} className=" [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/30 text-xs leading-relaxed italic">
                  {service.best}
                </p>
              </div>

              {/* Includes */}
              <div className="md:col-span-2 p-8 flex flex-col justify-between">
                <ul className="flex flex-col gap-2 mb-6">
                  {service.includes.map((item) => (
                    <li key={item}
                      className="flex items-start gap-3 text-sm text-white/40">
                      <span style={{color: "#FFD700"}} className=" text-[8px] mt-1 flex-shrink-0">
                        ◆
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/#contact"
                  className="text-[10px] tracking-[2px] uppercase border border-[#C9A84C]/30 text-[#FFD700] px-6 py-3 hover:bg-[#C9A84C]/10 transition-colors text-center inline-block">
                  {service.cta} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Studio Plan */}
      <div className="bg-[#1C1C1C] border-t border-[#C9A84C]/15 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-px bg-[#C9A84C]" />
                <span style={{color: "#FFD700"}} className=" text-[10px] tracking-[4px] uppercase">
                  Alternative
                </span>
              </div>
              <h2 style={{color: "#FFFFFF"}} className="font-bold [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] text-4xl mb-4 leading-tight">
                Studio Plan
              </h2>
              <p style={{color: "#FFFFFF"}} className=" [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/50 text-base leading-relaxed mb-6">
                No build fee. Just a monthly subscription and we handle
                everything — site, updates, hosting, and maintenance.
                Lower barrier to entry. Same quality output.
              </p>
              <div style={{color: "#FFD700"}} className=" font-bold text-3xl mb-1">
                $500 – $800
              </div>
              <div style={{color: "#FFFFFF"}} className=" [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/30 text-sm mb-8">
                per month — no build fee required
              </div>
              <Link href="/#contact"
                className="text-[11px] tracking-[2.5px] uppercase bg-[#C9A84C] text-[#141414] px-8 py-4 font-medium hover:bg-[#E2C97E] transition-colors inline-block">
                Start Studio Plan
              </Link>
            </div>
            <div className="border border-[#C9A84C]/15 bg-[#141414]">
              {[
                'Professionally managed website',
                'Monthly content updates',
                'Menu & pricing changes',
                'Brand-consistent design',
                'Hosting included',
                'Technical maintenance',
                'Priority support',
                'Cancel anytime',
              ].map((item) => (
                <div key={item}
                  className="flex items-center gap-3 px-6 py-4 border-b border-[#C9A84C]/10 last:border-0">
                  <span style={{color: "#FFD700"}} className=" text-[8px]">◆</span>
                  <span style={{color: "#FFFFFF"}} className=" [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/50 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-6 py-24 text-center bg-[#141414]/90 backdrop-blur-sm rounded-lg my-8">
        <h2 style={{color: "#FFFFFF"}} className="font-bold [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] text-4xl mb-4 leading-tight">
          Not sure which tier?
        </h2>
        <p style={{color: "#FFFFFF"}} className=" [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]/40 text-base mb-10 italic">
          Start with a free discovery call. We'll tell you exactly what you need.
        </p>
        <Link href="/#contact"
          className="text-[11px] tracking-[2.5px] uppercase bg-[#C9A84C] text-[#141414] px-10 py-4 font-medium hover:bg-[#E2C97E] transition-colors inline-block">
          Book Discovery Call
        </Link>
      </div>

    </div>
  )
      }
