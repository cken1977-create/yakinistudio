/**
 * Site form input (spec 7.2, 11.3): only the declared fields, each checked and trimmed. The field
 * allow-list never includes passwords, card numbers, bank details, ID numbers or codes (14.8 #1).
 */
export const FIELD_RULES: Record<string, { max: number; re?: RegExp }> = {
  name: { max: 200 },
  email: { max: 254, re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ },
  phone: { max: 40, re: /^[0-9+().\s-]{7,40}$/ },
  message: { max: 2000 },
  event_date: { max: 10, re: /^\d{4}-\d{2}-\d{2}$/ },
  guest_count: { max: 6, re: /^[1-9]\d{0,4}$/ },
  service: { max: 200 },
}

export type FormInput = { ok: true; values: Record<string, string> } | { ok: false; problem: 'missing' | 'invalid' }

export function readFormFields(declared: readonly string[], get: (name: string) => unknown): FormInput {
  const values: Record<string, string> = {}
  for (const f of declared) {
    const rule = FIELD_RULES[f]
    if (!rule) continue // a field we don't know is never accepted
    const raw = get(f)
    if (raw === undefined || raw === null || raw === '') continue
    if (typeof raw !== 'string') return { ok: false, problem: 'invalid' }
    // Control characters out (keep newlines in the message), then trim.
    const v = raw.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim()
    if (!v) continue
    if (v.length > rule.max || (rule.re && !rule.re.test(v))) return { ok: false, problem: 'invalid' }
    values[f] = f === 'message' ? v : v.replace(/\s+/g, ' ')
  }
  // A name, and a way to reach them (spec 5.8 step 1).
  if (declared.includes('name') && !values.name) return { ok: false, problem: 'missing' }
  const reach = ['email', 'phone'].filter((f) => declared.includes(f))
  if (reach.length && !reach.some((f) => values[f])) return { ok: false, problem: 'missing' }
  return { ok: true, values }
}

/** Plain-text summary for the owner's alert email. */
export function summary(values: Record<string, string>): string {
  const labels: Record<string, string> = { name: 'Name', email: 'Email', phone: 'Phone', message: 'Message', event_date: 'Date', guest_count: 'Guests', service: 'Interested in' }
  return Object.entries(values).map(([k, v]) => `${labels[k] ?? k}: ${v}`).join('\n')
}
