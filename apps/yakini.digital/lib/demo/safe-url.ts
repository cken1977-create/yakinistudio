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
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
  if (a === 198 && (b === 18 || b === 19)) return true
  if (a >= 224) return true // multicast / reserved
  return false
}

function ipv4FromMapped(ip: string): string | null {
  const v4 = ip.match(/(?:^::ffff:|^:ffff:|:ffff:0*:)?((?:\d{1,3}\.){3}\d{1,3})$/i)
  return v4 ? v4[1] : null
}

export function isBlockedIp(ip: string): boolean {
  const value = ip.trim().toLowerCase().replace(/^\[|\]$/g, '')
  const mapped = ipv4FromMapped(value)
  if (mapped) return isBlockedIpv4(mapped)
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return isBlockedIpv4(value)

  // IPv6: loopback, unicast/link-local, unique-local, IPv4-mapped already handled,
  // multicast, and documentation ranges.
  if (value === '::' || value === '::1') return true
  if (value.startsWith('fe80:') || value.startsWith('ff')) return true
  if (value.startsWith('fc') || value.startsWith('fd')) return true
  if (value.startsWith('2001:db8:')) return true
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
