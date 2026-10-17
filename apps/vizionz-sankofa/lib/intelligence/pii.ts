// VIZIONZ SANKOFA · Intelligence · PII stand-in tokens (pilot protection)
//
// Everything sent to an outside AI provider (Anthropic answers, OpenAI
// embeddings) passes through a PiiVault first. Names, emails, phone
// numbers, street addresses, SSNs and long ID numbers are swapped for
// stand-in tokens like [[PERSON_1]] / [[PHONE_2]]. The mapping lives only
// in server memory for one request; tokens are swapped back before the
// answer is shown.
//
// Names are matched against a dictionary of known people (participants,
// intakes, staff, donors, family members) loaded server-side — regexes
// alone cannot recognise names. Contact details and IDs are matched by
// pattern. This is a pilot safeguard, not a guarantee: a name that is not
// in any VS table and appears only in free text can slip through. That is
// why participant tools also stay off until a BAA is signed.

export type PiiKind = 'PERSON' | 'EMAIL' | 'PHONE' | 'ADDRESS' | 'SSN' | 'ID'

const TOKEN_RE = /\[\[\s*(PERSON|EMAIL|PHONE|ADDRESS|SSN|ID)_(\d+)\s*\]\]/g
// Models sometimes drop the brackets; accept bare tokens on restore too.
const BARE_TOKEN_RE = /\b(PERSON|EMAIL|PHONE|ADDRESS|SSN|ID)_(\d+)\b/g

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g
const PHONE_RE = /(?<![\w-])(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?![\w-])/g
const STREET_TYPES =
  'St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pl|Place|' +
  'Pkwy|Parkway|Hwy|Highway|Cir|Circle|Trl|Trail|Loop|Ter|Terrace|Sq|Square'
const ADDRESS_RE = new RegExp(
  String.raw`\b\d{1,6}\s+(?:[NSEW]\.?\s+)?(?:[A-Za-z0-9'.-]+\s+){0,4}(?:${STREET_TYPES})\b\.?` +
    String.raw`(?:\s+(?:NE|NW|SE|SW|N|S|E|W)\b)?(?:,?\s*(?:Apt|Unit|Suite|Ste|#)\.?\s*[\w-]+)?`,
  'gi'
)
const PO_BOX_RE = /\bP\.?\s?O\.?\s+Box\s+\d+\b/gi
// Any token with 6+ digits (Medicaid IDs, HMIS IDs, case numbers), with
// optional letter/dash prefixes or suffixes: "NM123456789", "FAKE-MCD-99887766".
const LONG_ID_RE = /\b(?:[A-Za-z]{1,6}-?){0,3}\d{6,}(?:-?[A-Za-z0-9]{1,8}){0,3}\b/g

// Words that are also common names/surnames but must stay readable, plus
// organisation words that appear in many questions.
const NAME_STOPWORDS = new Set(
  [
    'the', 'and', 'for', 'with', 'from', 'test', 'client', 'family', 'staff', 'case',
    'manager', 'new', 'mexico', 'vizionz', 'sankofa', 'yakini', 'brsa', 'kamili',
    'county', 'city', 'state', 'united', 'way', 'foundation', 'program', 'housing',
    'will', 'may', 'june', 'april', 'august', 'march', 'january', 'grace', 'hope',
    'joy', 'faith', 'mark', 'bill', 'rich', 'white', 'black', 'green', 'brown',
    'young', 'king', 'long', 'love', 'day', 'summer', 'winter', 'rose', 'star',
  ].map((w) => w.toLowerCase())
)

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalize(kind: PiiKind, value: string): string {
  const v = value.trim().toLowerCase()
  if (kind === 'PHONE' || kind === 'SSN') return v.replace(/\D/g, '').slice(-10)
  return v.replace(/\s+/g, ' ')
}

export class PiiVault {
  private byKey = new Map<string, string>()
  private byToken = new Map<string, string>()
  private counters: Record<PiiKind, number> = {
    PERSON: 0, EMAIL: 0, PHONE: 0, ADDRESS: 0, SSN: 0, ID: 0,
  }
  private nameRe: RegExp | null = null
  private names: string[] = []

  constructor(knownNames: string[] = []) {
    this.addKnownNames(knownNames)
  }

  /** Register names of real people so free text mentioning them is tokenized. */
  addKnownNames(names: Array<string | null | undefined>): void {
    const set = new Set(this.names)
    for (const raw of names) {
      const n = (raw ?? '').replace(/\s+/g, ' ').trim()
      if (n.length < 3) continue
      set.add(n)
      // Also each part of a multi-word name ("Maria", "Lopez"), unless it is
      // a common word that would wreck ordinary sentences.
      for (const part of n.split(/[\s,]+/)) {
        if (part.length >= 3 && !NAME_STOPWORDS.has(part.toLowerCase()) && !/^\d+$/.test(part)) {
          set.add(part)
        }
      }
    }
    this.names = [...set].sort((a, b) => b.length - a.length) // longest first
    this.nameRe = this.names.length
      ? new RegExp(`(?<![\\w])(?:${this.names.map(escapeRe).join('|')})(?![\\w])`, 'gi')
      : null
  }

  /** Get (or create) the stand-in token for a value. */
  token(kind: PiiKind, value: string): string {
    const key = `${kind}:${normalize(kind, value)}`
    const existing = this.byKey.get(key)
    if (existing) return existing
    this.counters[kind] += 1
    const tok = `[[${kind}_${this.counters[kind]}]]`
    this.byKey.set(key, tok)
    this.byToken.set(tok, value.trim())
    return tok
  }

  /** Replace every PII match in free text with stand-in tokens. */
  redact(text: string): string {
    if (!text) return text
    let out = text
    out = out.replace(EMAIL_RE, (m) => this.token('EMAIL', m))
    out = out.replace(SSN_RE, (m) => this.token('SSN', m))
    out = out.replace(ADDRESS_RE, (m) => this.token('ADDRESS', m))
    out = out.replace(PO_BOX_RE, (m) => this.token('ADDRESS', m))
    out = out.replace(PHONE_RE, (m) => this.token('PHONE', m))
    out = out.replace(LONG_ID_RE, (m) => (m.includes('[[') ? m : this.token('ID', m)))
    if (this.nameRe) out = out.replace(this.nameRe, (m) => this.token('PERSON', m))
    return out
  }

  /** Swap stand-in tokens back to the real values (for display / DB lookups). */
  restore(text: string): string {
    if (!text) return text
    const swap = (m: string, kind: string, n: string) =>
      this.byToken.get(`[[${kind}_${n}]]`) ?? m
    return text.replace(TOKEN_RE, swap).replace(BARE_TOKEN_RE, swap)
  }

  /** Restore tokens inside every string of a JSON-like value (tool inputs). */
  restoreDeep<T>(value: T): T {
    if (typeof value === 'string') return this.restore(value) as unknown as T
    if (Array.isArray(value)) return value.map((v) => this.restoreDeep(v)) as unknown as T
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = this.restoreDeep(v)
      return out as T
    }
    return value
  }

  /** Counts per kind, safe to log (no values). */
  summary(): Record<PiiKind, number> {
    return { ...this.counters }
  }
}
