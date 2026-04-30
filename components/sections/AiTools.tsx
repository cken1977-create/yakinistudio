import Link from 'next/link'

const showcases = [
  {
    number: '01',
    title: 'Menu Builder',
    description: 'Describe your cuisine and concept — AI generates a complete menu with dishes, descriptions, and market-appropriate pricing.',
    result: 'AZURA KITCHEN & BAR — Mediterranean-American | Houston, TX\n\nCharred Octopus à la Plancha — $22\nWagyu Beef Tartare — $26\nGulf Shrimp Saganaki — $19\n\nPan-Roasted Gulf Red Snapper — $44\nWagyu Ribeye 14oz — $78\nBranzino al Cartoccio — $42\nWagyu Short Rib Tagine — $52',
    tag: 'Generated in 30 seconds',
  },
  {
    number: '02',
    title: 'Recipe Costing',
    description: 'Enter your ingredients and quantities — AI calculates true cost per serving, suggested menu price, and profit margin.',
    result: 'CAJUN LOBSTER PASTA — Cost Analysis\n\nTotal Recipe Cost: $21.25\nCost Per Serving: $10.63\nRecommended Menu Price: $35.95\nGross Profit Per Plate: $25.32\nFood Cost %: 29.6%\n✅ WITHIN TARGET RANGE',
    tag: 'Full breakdown in seconds',
  },
  {
    number: '03',
    title: 'Pricing Strategy',
    description: 'Describe your service and market — AI builds a full three-tier pricing strategy with competitive analysis and revenue projections.',
    result: 'PRIVATE CHEF — Houston TX\n\nTier 1 — The Gathering: $125–$150pp\nRevenue potential: $250–$600/event\n\nTier 2 — The Experience: $200–$250pp\nRevenue potential: $800–$2,000/event\n\nTier 3 — The Affair: $350–$500pp\nRevenue potential: $2,100–$6,000/event',
    tag: 'Market-calibrated positioning',
  },
  {
    number: '04',
    title: 'Business Operations',
    description: 'Labor costs, overhead analysis, tax planning, insurance guidance — the operational knowledge most small business owners never had.',
    result: 'TRUE COST ANALYSIS\n\nEmployee at $15/hr actual cost: $19.84/hr\nPayroll taxes: +18%\nWorkers comp: +4%\nBenefits estimate: +12%\n\nBreak-even jobs per month: 14\nOverhead per job: $47.20\nMinimum bid to profit: $285',
    tag: 'Know your numbers',
  },
  {
    number: '05',
    title: 'Industry Intelligence',
    description: 'Trucking, construction, nonprofits, Airbnb, retail — every industry gets tools built for their specific operational challenges.',
    result: 'TRUCKING — Load Profitability\n\nLoad rate: $2,800\nFuel cost (480mi @ $4.20): $604\nDriver pay: $420\nTruck overhead per mile: $0.38\nTotal cost: $1,206\n\nNet profit: $1,594\nProfit margin: 56.9%\n✅ TAKE THIS LOAD',
    tag: 'Built for your industry',
  },
]

export function AiTools() {
  return (
    <section className="bg-[#1C1C1C] py-32 px-6 border-t border-[#C9A84C]/15">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
              Yakini Intelligence
            </span>
          </div>
          <h2 className="font-bold text-[#F5EFE3] leading-none tracking-tight mb-4"
            style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            AI tools built for<br />
            <em className="text-[#C9A84C] not-italic">serious operators.</em>
          </h2>
          <p className="text-[#F5EFE3]/50 text-base leading-relaxed max-w-xl">
            Menu building, recipe costing, pricing strategy, business operations,
            and industry-specific intelligence — powered by AI. Available exclusively
            to Yakini clients.
          </p>
        </div>

        {/* Showcase grid */}
        <div className="flex flex-col gap-1">
          {showcases.map((item) => (
            <div key={item.number}
              className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#C9A84C]/10 bg-[#141414]">

              {/* Left — description */}
              <div className="p-8 border-b md:border-b-0 md:border-r border-[#C9A84C]/10">
                <div className="text-[#C9A84C] text-[9px] tracking-[3px] uppercase mb-3">
                  {item.number}
                </div>
                <div className="text-[#F5EFE3] font-bold text-lg mb-3">
                  {item.title}
                </div>
                <div className="text-[#F5EFE3]/40 text-sm leading-relaxed">
                  {item.description}
                </div>
              </div>

              {/* Middle — sample output */}
              <div className="md:col-span-2 p-8 bg-[#1C1C1C] relative">
                <div className="text-[9px] tracking-[3px] uppercase text-[#C9A84C]/60 mb-4 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#C9A84C]/40 inline-block" />
                  Sample Output — {item.tag}
                </div>
                <pre className="text-[#F5EFE3]/60 text-xs leading-relaxed font-mono whitespace-pre-wrap">
                  {item.result}
                </pre>

                {/* Lock overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/60 to-transparent flex flex-col items-center justify-end pb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#C9A84C] text-lg">🔒</span>
                    <span className="text-[#F5EFE3]/40 text-xs tracking-[2px] uppercase">
                      Client Access Only
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-1 bg-[#141414] border border-[#C9A84C]/20 border-t-2 border-t-[#C9A84C] p-10 text-center">
          <div className="text-[#C9A84C] text-[9px] tracking-[4px] uppercase mb-4">
            Yakini Intelligence
          </div>
          <h3 className="text-[#F5EFE3] font-bold text-2xl mb-3">
            Included in every Pro Build and above.
          </h3>
          <p className="text-[#F5EFE3]/40 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Become a Yakini client and get full access to every AI tool —
            menu building, recipe costing, pricing strategy, business operations,
            and industry-specific intelligence built for your vertical.
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
