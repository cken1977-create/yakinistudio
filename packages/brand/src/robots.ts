/**
 * robots.txt for YakiniSiteReader (spec 14.3). Groups for our user agent win over `*`; within a
 * group the longest matching rule wins, and Allow wins a tie (RFC 9309). Supports `*` and `$`.
 */
export const READER_TOKEN = 'yakinisitereader'

type Rule = { allow: boolean; pattern: string }

export type Robots = { rules: Rule[] }

export function parseRobots(text: string, token = READER_TOKEN): Robots {
  const groups: { agents: string[]; rules: Rule[] }[] = []
  let current: { agents: string[]; rules: Rule[] } | null = null
  let lastWasAgent = false
  for (const rawLine of text.split(/\r?\n/).slice(0, 2000)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line)
    if (!m) continue
    const key = m[1].toLowerCase()
    const value = m[2].trim()
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current) }
      current.agents.push(value.toLowerCase())
      lastWasAgent = true
      continue
    }
    lastWasAgent = false
    if (!current) continue
    if ((key === 'allow' || key === 'disallow') && value.length <= 500) {
      if (key === 'disallow' && value === '') continue // "Disallow:" with nothing means allow all
      current.rules.push({ allow: key === 'allow', pattern: value })
    }
  }
  const ours = groups.filter((g) => g.agents.some((a) => a.replace(/\/.*$/, '') === token))
  const chosen = ours.length ? ours : groups.filter((g) => g.agents.includes('*'))
  return { rules: chosen.flatMap((g) => g.rules) }
}

function toRegex(pattern: string): RegExp {
  const anchored = pattern.endsWith('$')
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*')
  return new RegExp(`^${body}${anchored ? '$' : ''}`)
}

/** May we fetch this path (including the query string)? */
export function robotsAllows(robots: Robots, pathAndQuery: string): boolean {
  let best: Rule | null = null
  for (const r of robots.rules) {
    if (!r.pattern.startsWith('/') && !r.pattern.startsWith('*')) continue
    if (!toRegex(r.pattern).test(pathAndQuery)) continue
    if (!best || r.pattern.length > best.pattern.length || (r.pattern.length === best.pattern.length && r.allow)) best = r
  }
  return best ? best.allow : true
}

export const ALLOW_ALL: Robots = { rules: [] }
export const DISALLOW_ALL: Robots = { rules: [{ allow: false, pattern: '/' }] }
