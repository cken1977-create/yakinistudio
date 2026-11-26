/**
 * Phase 5a: turn what an owner typed into the names to connect (docs/spec/phase-5.md).
 * Pure: no network. A whole domain gets its www name too; a subdomain is connected on its own.
 */
const TWO_PART_SUFFIXES = new Set(['co.uk', 'org.uk', 'me.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'com.mx', 'co.za', 'com.br'])
const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/

export type ParsedDomain = { main: string; names: string[]; apex: string; whole: boolean }
export type DomainInputError = 'empty' | 'invalid' | 'ours' | 'not_allowed'

export function apexOf(host: string): string {
  const parts = host.split('.')
  const two = parts.slice(-2).join('.')
  return parts.slice(TWO_PART_SUFFIXES.has(two) ? -3 : -2).join('.')
}

/** The DNS "Host" field for a name, relative to its domain ("@" for the domain itself). */
export function hostLabel(name: string, apex = apexOf(name)): string {
  return name === apex ? '@' : name.slice(0, -(apex.length + 1))
}

export function parseDomainInput(raw: string, rootDomain: string): ParsedDomain | { error: DomainInputError } {
  let s = raw.trim().toLowerCase()
  if (!s) return { error: 'empty' }
  s = s.replace(/^[a-z]+:\/\//, '').replace(/[/?#].*$/, '').replace(/:\d+$/, '').replace(/\.$/, '')
  if (s.length > 253 || /^[\d.]+$/.test(s) || s.includes(':')) return { error: 'invalid' }
  const parts = s.split('.')
  if (parts.length < 2 || !parts.every((p) => LABEL.test(p)) || !/^[a-z]{2,63}$/.test(parts.at(-1)!)) return { error: 'invalid' }
  const root = rootDomain.toLowerCase()
  if (s === root || s.endsWith(`.${root}`) || s === 'yakini.digital' || s.endsWith('.yakini.digital')) return { error: 'ours' }
  if (['vercel.app', 'vercel.com', 'localhost', 'now.sh'].some((d) => s === d || s.endsWith(`.${d}`))) return { error: 'not_allowed' }
  const apex = apexOf(s)
  if (TWO_PART_SUFFIXES.has(s)) return { error: 'invalid' }
  if (s === apex || s === `www.${apex}`) return { main: apex, names: [apex, `www.${apex}`], apex, whole: true }
  return { main: s, names: [s], apex, whole: false }
}

export const DOMAIN_INPUT_MESSAGE: Record<DomainInputError, string> = {
  empty: 'Type your domain, like yourbusiness.com.',
  invalid: 'That doesn’t look like a domain. Type it like yourbusiness.com.',
  ours: 'That’s already your free address. Type a domain you own.',
  not_allowed: 'That domain can’t be used. Type a domain you own.',
}
