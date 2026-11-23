import { LANDING } from '@/lib/copy'

export default function StudioLanding() {
  const c = LANDING
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8">
      <header className="flex items-center justify-between py-6">
        <a href="https://yakini.digital" className="inline-flex min-h-11 items-center font-serif text-xl tracking-wide text-paper">
          Yakini <span className="text-gold">Studio</span>
        </a>
        <a href="https://portal.yakini.digital/enter" className="inline-flex min-h-11 items-center rounded-full border border-paper/25 px-4 text-sm text-paper/90 hover:border-gold">
          Sign in
        </a>
      </header>

      <section className="grid gap-10 py-10 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">{c.eyebrow}</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-6xl">{c.headline}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper/85">{c.subhead}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={c.primaryCta.href} className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 font-semibold text-ink hover:brightness-110">
              {c.primaryCta.label}
            </a>
            <a href={c.secondaryCta.href} className="inline-flex min-h-12 items-center justify-center rounded-full border border-paper/30 px-7 font-semibold text-paper hover:border-gold">
              {c.secondaryCta.label}
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">{c.noContact}</p>
        </div>

        <div aria-hidden="true" className="rounded-3xl border border-paper/10 bg-gradient-to-br from-[#1a1712] to-[#0f0d0b] p-5 shadow-2xl">
          <div className="flex gap-1.5 pb-4">
            <span className="h-2.5 w-2.5 rounded-full bg-paper/25" /><span className="h-2.5 w-2.5 rounded-full bg-paper/25" /><span className="h-2.5 w-2.5 rounded-full bg-paper/25" />
          </div>
          <div className="rounded-2xl bg-[#9A3412] p-6 text-white">
            <p className="text-xs uppercase tracking-widest opacity-80">Your colors, your logo</p>
            <p className="mt-2 font-serif text-3xl">Mesa Street Tacos</p>
            <p className="mt-1 text-sm opacity-90">Street tacos, made fresh</p>
            <span className="mt-5 inline-block rounded-full bg-[#F59E0B] px-4 py-2 text-sm font-semibold text-[#15130F]">See the menu</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {['Menu', 'Today’s stop', 'Catering'].map((t) => (
              <div key={t} className="rounded-xl border border-paper/10 bg-paper/5 p-3 text-center text-xs text-paper/80">{t}</div>
            ))}
          </div>
        </div>
      </section>

      <p className="rounded-2xl border border-gold/30 bg-gold/10 px-5 py-4 text-sm text-paper/90" role="status">{c.opening}</p>

      <section id="how" className="py-14">
        <h2 className="font-serif text-3xl sm:text-4xl">How it works</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.steps.map((s) => (
            <li key={s.n} className="rounded-2xl border border-paper/10 bg-paper/[0.03] p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gold font-semibold text-ink">{s.n}</span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-paper/80">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 pb-14 md:grid-cols-3">
        {c.promises.map((p) => (
          <div key={p.title} className="rounded-2xl border border-paper/10 p-5">
            <h3 className="text-lg font-semibold text-gold">{p.title}</h3>
            <p className="mt-2 text-paper/80">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-14 rounded-3xl border border-paper/10 bg-paper/[0.04] p-6 text-center sm:p-10">
        <p className="font-serif text-2xl sm:text-3xl" data-testid="price-line">{c.price}</p>
        <a href={c.pricingHref} className="mt-4 inline-flex min-h-11 items-center text-gold underline underline-offset-4">See what&apos;s included</a>
      </section>

      <footer className="mt-auto flex flex-col gap-3 border-t border-paper/10 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Yakini Digital</p>
        <nav className="flex gap-5">
          <a className="inline-flex min-h-11 items-center hover:text-paper" href="https://yakini.digital">yakini.digital</a>
          <a className="inline-flex min-h-11 items-center hover:text-paper" href="https://portal.yakini.digital/enter">Client portal</a>
        </nav>
      </footer>
    </main>
  )
}
