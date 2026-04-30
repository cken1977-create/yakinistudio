import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function ClientDashboard() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/client/login')

  return (
    <div className="min-h-screen bg-[#141414] pt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex items-start justify-between mb-16 pb-8 border-b border-[#C9A84C]/15">
          <div>
            <div className="text-[#C9A84C] text-[9px] tracking-[4px] uppercase mb-2">
              Client Portal
            </div>
            <h1 className="text-[#F5EFE3] font-bold text-3xl mb-1">
              Welcome back.
            </h1>
            <p className="text-[#F5EFE3]/30 text-sm">
              {user.email}
            </p>
          </div>
          <form action="/api/auth/signout" method="post">
            <button className="text-[10px] tracking-[2px] uppercase text-[#F5EFE3]/30 hover:text-[#C9A84C] transition-colors">
              Sign Out
            </button>
          </form>
        </div>

        {/* AI Tools */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase">
              Yakini Intelligence
            </span>
          </div>
          <ClientAiTools />
        </div>

        {/* Support */}
        <div className="bg-[#1C1C1C] border border-[#C9A84C]/10 p-8">
          <div className="text-[#C9A84C] text-[9px] tracking-[3px] uppercase mb-4">
            Need Help?
          </div>
          <p className="text-[#F5EFE3]/40 text-sm leading-relaxed mb-4">
            Questions about your project or need updates? We respond within 24 hours.
          </p>
          <a href="mailto:hello@yakini.digital"
            className="text-[#C9A84C] text-sm italic hover:opacity-70 transition-opacity">
            hello@yakini.digital
          </a>
        </div>

      </div>
    </div>
  )
}

function ClientAiTools() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { id: 'menu', label: 'Menu Builder', desc: 'Generate a complete menu from your concept.' },
        { id: 'recipe', label: 'Recipe Costing', desc: 'Calculate food cost and suggested pricing.' },
        { id: 'pricing', label: 'Pricing Strategy', desc: 'Build a three-tier pricing strategy.' },
        { id: 'operations', label: 'Business Operations', desc: 'Labor, overhead, and cost analysis.' },
        { id: 'industry', label: 'Industry Intelligence', desc: 'Tools built for your specific vertical.' },
      ].map((tool) => (
        <Link key={tool.id} href={'/client/tools/' + tool.id}
          className="bg-[#1C1C1C] border border-[#C9A84C]/10 p-6 hover:bg-[#242424] hover:border-[#C9A84C]/30 transition-all group">
          <div className="text-[#C9A84C] text-[9px] tracking-[3px] uppercase mb-3">
            Yakini Intelligence
          </div>
          <div className="text-[#F5EFE3] font-bold text-base mb-2">
            {tool.label}
          </div>
          <div className="text-[#F5EFE3]/40 text-xs leading-relaxed mb-4">
            {tool.desc}
          </div>
          <div className="text-[#C9A84C] text-[10px] tracking-[2px] uppercase group-hover:translate-x-1 transition-transform">
            Open Tool →
          </div>
        </Link>
      ))}
    </div>
  )
}
