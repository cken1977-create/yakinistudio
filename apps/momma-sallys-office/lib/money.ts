// Money is integer cents everywhere. Display only, never math on floats.
export function formatCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return '—'
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(Math.round(cents))
  return `${sign}$${Math.floor(abs / 100).toLocaleString('en-US')}.${String(abs % 100).padStart(2, '0')}`
}

/** "12.34" | "$1,234.5" | "12" → cents. Returns null for anything unparseable. */
export function parseDollarsToCents(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null
  if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input * 100) : null
  const s = input.replace(/[$,\s]/g, '')
  if (s === '') return null
  if (!/^-?\d+(\.\d{0,2})?$/.test(s)) return null
  const neg = s.startsWith('-')
  const [whole, frac = ''] = s.replace('-', '').split('.')
  const cents = Number(whole) * 100 + Number((frac + '00').slice(0, 2))
  return neg ? -cents : cents
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}
