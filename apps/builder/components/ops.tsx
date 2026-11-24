import { OPS_RESULTS, type OpsResult } from '@/lib/server/ops'

/** Shared bits of the operator desk (spec 5.10). Server components; forms work with JavaScript off. */
export function OpsShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10">
      <nav aria-label="Operator desk" className="flex flex-wrap gap-4 text-sm">
        <a href="/ops" className="inline-flex min-h-11 items-center text-paper/85 hover:text-gold">Desk</a>
        <a href="/ops/reports" className="inline-flex min-h-11 items-center text-paper/85 hover:text-gold">Reports</a>
        <a href="/ops/reviews" className="inline-flex min-h-11 items-center text-paper/85 hover:text-gold">Reviews</a>
      </nav>
      <h1 className="mt-4 font-serif text-4xl">{title}</h1>
      {children}
    </main>
  )
}

export function Result({ code }: { code: string | undefined }) {
  if (!code || !(code in OPS_RESULTS)) return null
  return <p role="status" className="mt-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">{OPS_RESULTS[code as OpsResult]}</p>
}

export const smallBtn = 'inline-flex min-h-11 items-center justify-center rounded-full border border-paper/25 px-4 text-sm font-semibold text-paper hover:border-gold'
export const dangerBtn = 'inline-flex min-h-11 items-center justify-center rounded-full bg-[#B4442C] px-4 text-sm font-semibold text-white hover:brightness-110'
export const goBtn = 'inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-4 text-sm font-semibold text-ink hover:brightness-110'
export const field = 'mt-1 block w-full rounded-xl border border-paper/25 bg-[#15130F] px-3 py-2 text-sm text-paper'
