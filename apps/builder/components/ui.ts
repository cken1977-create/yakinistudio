/** Shared studio form styles (same look as /new): large touch targets, gold focus. */
export const ui = {
  label: 'block text-sm font-semibold text-paper',
  input: 'mt-2 block w-full rounded-xl border border-paper/25 bg-[#15130F] px-4 py-3 text-base text-paper placeholder:text-paper/40 focus:border-gold focus:outline-none',
  hint: 'mt-1 text-sm text-muted',
  primary: 'inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 font-semibold text-ink hover:brightness-110',
  secondary: 'inline-flex min-h-12 items-center justify-center rounded-full border border-paper/25 px-6 font-semibold text-paper hover:border-gold',
  error: 'rounded-xl border border-[#E3A08F]/60 bg-[#3a1d17] px-4 py-3 text-base text-paper',
  note: 'rounded-xl border border-paper/15 px-4 py-3 text-base text-paper/90',
} as const
