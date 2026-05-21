// Shared parser utilities — name normalization, dedup keys, date parsing.

export function normalizeName(name: string | null | undefined): string {
  if (!name) return ''
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Build a dedup key for a participant.
 * Primary: normalized name + DOB (ISO date string)
 * Fallback: normalized name only (flagged as fuzzy)
 */
export function participantDedupKey(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  dob: string | null | undefined
): { key: string; fuzzy: boolean } {
  const fullName = normalizeName(`${firstName ?? ''} ${lastName ?? ''}`)
  if (!fullName) return { key: '', fuzzy: false }
  if (dob) return { key: `${fullName}|${dob}`, fuzzy: false }
  return { key: fullName, fuzzy: true }
}

/**
 * Parse a date cell that might be:
 *  - "9/29/2025"
 *  - "9-12-2025"
 *  - "01/05/26"
 *  - "1 Jan 1993"
 *  - "1.30.23"
 *  - a Date object (from xlsx)
 *  - a number (Excel serial date)
 * Returns ISO date string (YYYY-MM-DD) or null.
 */
export function parseFlexibleDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null

  // xlsx may return Date directly
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  // Excel serial date number
  if (typeof value === 'number') {
    // Excel epoch is 1899-12-30
    const ms = (value - 25569) * 86400 * 1000
    const d = new Date(ms)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
    return null
  }

  if (typeof value !== 'string') return null
  const s = value.trim()
  if (!s) return null

  // Try native Date parser first
  const d1 = new Date(s)
  if (!isNaN(d1.getTime()) && s.length > 4) return d1.toISOString().slice(0, 10)

  // Try MM/DD/YY or MM/DD/YYYY
  const slashMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
  if (slashMatch) {
    const [, m, dd, yRaw] = slashMatch
    let y = parseInt(yRaw, 10)
    if (y < 100) y += 2000
    const iso = `${y}-${m.padStart(2, '0')}-${dd.padStart(2, '0')}`
    const d2 = new Date(iso)
    if (!isNaN(d2.getTime())) return iso
  }

  return null
}

export function parseCurrency(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[$,\s]/g, '')
  const n = parseFloat(cleaned)
  if (isNaN(n)) return null
  return n
}

export function safeString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  return s ? s : null
}

export function safeInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Math.trunc(value)
  if (typeof value !== 'string') return null
  const n = parseInt(value.trim(), 10)
  return isNaN(n) ? null : n
}

export function splitFullName(fullName: string | null | undefined): {
  firstName: string | null
  lastName: string | null
} {
  if (!fullName) return { firstName: null, lastName: null }
  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: null }
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] }
  // 3+ parts: last word = last name, rest = first
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  }
}
