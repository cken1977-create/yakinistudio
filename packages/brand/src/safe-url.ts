// SSRF-safe URL checks for the kit demo brand fetch.
// Only public http(s) sites on ports 80/443 are allowed. Private, loopback,
// link-local, metadata, and internal hostnames are rejected before any request.

export const FETCH_TIMEOUT_MS = 6_000
export const FETCH_MAX_BYTES = 800_000
export const FETCH_MAX_REDIRECTS = 3

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.goog',
  'kubernetes',
  'kubernetes.default',
  'kubernetes.default.svc',
  'kubernetes.default.svc.cluster.local',
])

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.intranet', '.corp', '.home', '.lan']

export type SafeUrlResult =
  | { ok: true; url: URL }
  | { ok: false; error: string }

function normalizeInput(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p))
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b, c] = parts
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true // IETF protocol assignments, TEST-NET-1
  if (a === 192 && b === 88 && c === 99) return true // 6to4 relay anycast
  if (a === 198 && b === 51 && c === 100) return true // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true // TEST-NET-3
  if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
  if (a === 198 && (b === 18 || b === 19)) return true
  if (a >= 224) return true // multicast / reserved
  return false
}

/**
 * Parse an IPv6 literal into 8 hextets, or null. Handles "::" compression and a trailing dotted
 * IPv4 part (e.g. ::ffff:127.0.0.1). Zone ids ("%eth0") are refused.
 */
export function parseIpv6(raw: string): number[] | null {
  const ip = raw.toLowerCase()
  if (!ip.includes(':') || ip.includes('%') || !/^[0-9a-f:.]+$/.test(ip)) return null
  let tail: number[] = []
  let body = ip
  const dotted = ip.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (dotted) {
    const v4 = dotted[2].split('.').map(Number)
    if (v4.some((n) => n > 255)) return null
    tail = [(v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]]
    body = dotted[1].endsWith('::') ? dotted[1] : dotted[1].slice(0, -1)
  }
  const halves = body.split('::')
  if (halves.length > 2) return null
  const toNums = (s: string) => (s === '' ? [] : s.split(':').map((h) => (/^[0-9a-f]{1,4}$/.test(h) ? parseInt(h, 16) : NaN)))
  const head = toNums(halves[0])
  const rest = halves.length === 2 ? toNums(halves[1]) : []
  if ([...head, ...rest].some((n) => Number.isNaN(n))) return null
  const known = head.length + rest.length + tail.length
  if (halves.length === 1 && known !== 8) return null
  if (halves.length === 2 && known > 7) return null
  return [...head, ...Array(8 - known).fill(0), ...rest, ...tail]
}

function v4From(h: number[], i: number): string {
  return [h[i] >> 8, h[i] & 255, h[i + 1] >> 8, h[i + 1] & 255].join('.')
}

/** Is this IPv6 address (as hextets) private, internal, or a wrapper around such an IPv4? */
function isBlockedIpv6(h: number[]): boolean {
  const zeros = (from: number, to: number) => h.slice(from, to).every((x) => x === 0)
  if (zeros(0, 8)) return true // ::
  if (zeros(0, 7) && h[7] === 1) return true // ::1
  if (zeros(0, 5) && h[5] === 0xffff) return isBlockedIpv4(v4From(h, 6)) // IPv4-mapped (any spelling)
  if (zeros(0, 6)) return true // IPv4-compatible (deprecated), never a real public target
  if (h[0] === 0x64 && h[1] === 0xff9b && zeros(2, 6)) return isBlockedIpv4(v4From(h, 6)) // NAT64
  if (h[0] === 0x2002) return isBlockedIpv4(v4From(h, 1)) // 6to4 carries an IPv4 inside
  if (h[0] === 0x2001 && h[1] === 0) return true // Teredo
  if (h[0] === 0x2001 && h[1] === 0xdb8) return true // documentation
  if (h[0] === 0x100 && zeros(1, 4)) return true // discard-only
  if ((h[0] & 0xfe00) === 0xfc00) return true // unique local fc00::/7
  if ((h[0] & 0xffc0) === 0xfe80) return true // link-local fe80::/10
  if ((h[0] & 0xffc0) === 0xfec0) return true // site-local fec0::/10 (deprecated)
  if ((h[0] & 0xff00) === 0xff00) return true // multicast
  return false
}

export function isBlockedIp(ip: string): boolean {
  const value = ip.trim().toLowerCase().replace(/^\[|\]$/g, '')
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return isBlockedIpv4(value)
  if (value.includes(':')) {
    const h = parseIpv6(value)
    return h ? isBlockedIpv6(h) : true // anything we cannot parse is refused
  }
  return false
}

function isBlockedHostname(host: string): boolean {
  const hostname = host.replace(/\.$/, '').toLowerCase()
  if (!hostname) return true
  if (BLOCKED_HOSTS.has(hostname)) return true
  if (BLOCKED_HOST_SUFFIXES.some((s) => hostname.endsWith(s))) return true
  if (hostname.endsWith('.localhost')) return true

  // Literal IPs in the hostname.
  if (isBlockedIp(hostname)) return true

  // Decimal / hex / octal IPv4 tricks (e.g. 2130706433, 0x7f000001).
  if (/^0x[0-9a-f]+$/i.test(hostname) || /^\d+$/.test(hostname)) return true

  return false
}

export function sanitizePublicHttpUrl(raw: string): SafeUrlResult {
  const input = normalizeInput(raw)
  if (!input) return { ok: false, error: 'Please add a website address.' }

  let url: URL
  try {
    url = new URL(input)
  } catch {
    return { ok: false, error: 'That does not look like a website address.' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Please use an http or https website address.' }
  }
  if (url.username || url.password) {
    return { ok: false, error: 'Website addresses cannot include a username or password.' }
  }
  const port = url.port
  if (port && port !== '80' && port !== '443') {
    return { ok: false, error: 'That website address is not allowed.' }
  }
  if (isBlockedHostname(url.hostname)) {
    return { ok: false, error: 'That website address is not allowed.' }
  }
  // Hostnames must have a dot (public DNS) or be an allowed public IP — but
  // public IP literals are already checked, and single-label hosts are blocked.
  const host = url.hostname.replace(/\.$/, '')
  const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(':')
  if (!isIp && !host.includes('.')) {
    return { ok: false, error: 'That website address is not allowed.' }
  }

  return { ok: true, url }
}

export function isSafePublicLogoUrl(raw: string, pageUrl: URL): boolean {
  let url: URL
  try {
    url = new URL(raw, pageUrl)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  if (url.username || url.password) return false
  const port = url.port
  if (port && port !== '80' && port !== '443') return false
  if (isBlockedHostname(url.hostname)) return false
  return true
}
