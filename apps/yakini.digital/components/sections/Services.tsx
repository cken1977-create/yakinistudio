import { cn } from '@/lib/utils'

const services = [
  {
    number: '01',
    tier: 'Authority',
    title: 'Website Design & Development',
    description:
      'Custom-built sites that load fast, look premium, and convert. No templates. No shortcuts. Your site becomes your hardest working employee.',
    price: 'From $1,500',
    items: [
      'Custom Next.js development',
      'Mobile-optimized design',
      'SEO foundation built in',
      'Analytics setup',
      'Monthly retainer support',
    ],
  },
  {
    number: '02',
    tier: 'Conversion',
    title: 'Booking & Lead Systems',
    description:
      'Not just a contact form. A full lead capture system — bookings, inquiries, quotes, and client data stored and organized automatically.',
    price: 'From $3,500',
    items: [
      'Everything in Authority',
      'Supabase database backend',
      'Booking & inquiry system',
      'Lead dashboard',
      'Email notifications',
    ],
  },
  {
    number: '03',
    tier: 'Operations',
    title: 'Client Portals & Dashboards',
    description:
      'Internal tools that run your business — quote builders, booking pipelines, client history, menu update panels, and light CRM systems.',
    price: 'From $6,000',
    items: [
      'Everything in Conversion',
      'Client-facing portal',
      'Internal dashboard',
      'Workflow automation',
      'Priority support',
    ],
  },
  {
    number: '04',
    tier: 'Retention',
    title: 'Mobile Apps',
    description:
      'Client-facing mobile apps for ordering, loyalty, memberships, and retention. Built in React Native — shares code with your web stack.',
    price: 'From $10,000',
    items: [
      'Everything in Operations',
      'iOS & Android app',
      'Push notifications',
      'In-app ordering or booking',
      'Loyalty & membership system',
    ],
  },
]

export function Services() {
  return (
    <section className="bg-[#1C1C1C] py-32 px-6 border-t border-[#C9A84C]/15">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
              What We Build
            </span>
          </div>
          <h2 className="font-bold text-[#F5EFE3] leading-none tracking-tight"
            style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            Infrastructure for<br />
            <em className="text-[#C9A84C] not-italic">serious</em> builders.
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#C9A84C]/10 border border-[#C9A84C]/10">
          {services.map((service) => (
            <div
              key={service.number}
              className="bg-[#1C1C1C] p-10 flex flex-col gap-6 group hover:bg-[#242424] transition-colors"
            >
              {/* Top */}
              <div className="flex items-start justify-between">
                <span className="font-bold text-[#C9A84C]/20 text-5xl leading-none">
                  {service.number}
                </span>
                <span className="text-[9px] tracking-[3px] uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-3 py-1">
                  {service.tier}
                </span>
              </div>

              {/* Content */}
              <div>
                <h3 className="text-[#F5EFE3] font-semibold text-xl mb-3 leading-tight">
                  {service.title}
                </h3>
                <p className="text-[#F5EFE3]/50 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Items */}
              <ul className="flex flex-col gap-2 border-t border-[#F5EFE3]/08 pt-4">
                {service.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#F5EFE3]/50">
                    <span className="text-[#C9A84C] text-[8px]">◆</span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Price */}
              <div className="mt-auto pt-4 border-t border-[#F5EFE3]/08 flex items-center justify-between">
                <span className="text-[#C9A84C] font-bold text-lg">
                  {service.price}
                </span>
                <span className="text-[10px] tracking-[2px] uppercase text-[#F5EFE3]/30 group-hover:text-[#C9A84C] transition-colors">
                  Learn More →
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
              }
