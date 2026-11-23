/**
 * Output copy lint (spec 8.8). Runs on every AI result and at publish, and in CI on
 * rendered studio pages. Case-insensitive, word-boundary.
 */
export const BANNED_TERMS = [
  'AI-built', 'AI generated', 'AI-generated', 'built with AI', 'made with AI', 'made by AI',
  'powered by', 'artificial intelligence', 'chatgpt', 'grok', 'xai', 'vercel', 'supabase',
  'stripe', 'twilio', 'resend', 'elevenlabs', 'sentry', 'posthog', 'next.js', 'nextjs', 'react',
  'openai', 'anthropic', 'claude', 'gohighlevel', 'highlevel',
] as const

export type LintHit = { term: string; index: number }

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const PATTERNS = BANNED_TERMS.map((term) => ({
  term,
  // Word boundaries that also work around '.' and '-' inside terms.
  re: new RegExp(`(^|[^a-z0-9])${escapeRe(term).replace(/[- ]/g, '[-\\s]?')}(?=$|[^a-z0-9])`, 'gi'),
}))

export function lintCopy(text: string): LintHit[] {
  const hits: LintHit[] = []
  for (const { term, re } of PATTERNS) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      hits.push({ term, index: m.index + m[1].length })
      if (m[0].length === 0) re.lastIndex++
    }
  }
  return hits.sort((a, b) => a.index - b.index)
}

/** Any "$" amount other than the one public pricing line (R9). */
export function strayPrices(text: string, publicLine = 'Setup from $299. Monthly plans from $149.'): string[] {
  const without = text.split(publicLine).join(' ')
  return without.match(/\$\s?\d[\d,]*(\.\d+)?/g) ?? []
}
