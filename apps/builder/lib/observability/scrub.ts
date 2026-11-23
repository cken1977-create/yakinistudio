/**
 * Sentry beforeSend scrubber (spec 14.2): drops headers, cookies, request bodies, query
 * strings and user info; masks emails and phone numbers in messages. Never logs env.
 */
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/g
const TOKENISH = /\b(sk|pk|rk|whsec|xai|re|ghp|gho|sbp)_[A-Za-z0-9_-]{8,}\b/g

export function maskText(s: string): string {
  return s.replace(EMAIL, '[email]').replace(TOKENISH, '[secret]').replace(PHONE, '[phone]')
}

type AnyEvent = {
  request?: { headers?: unknown; cookies?: unknown; data?: unknown; query_string?: unknown; url?: string }
  user?: unknown
  message?: string
  exception?: { values?: { value?: string }[] }
  breadcrumbs?: { message?: string; data?: unknown }[]
  extra?: unknown
}

export function scrubEvent<T extends AnyEvent>(event: T): T {
  if (event.request) {
    delete event.request.headers
    delete event.request.cookies
    delete event.request.data
    delete event.request.query_string
    if (event.request.url) event.request.url = event.request.url.split('?')[0]
  }
  delete event.user
  delete event.extra
  if (event.message) event.message = maskText(event.message)
  for (const v of event.exception?.values ?? []) if (v.value) v.value = maskText(v.value)
  for (const b of event.breadcrumbs ?? []) {
    if (b.message) b.message = maskText(b.message)
    delete b.data
  }
  return event
}
