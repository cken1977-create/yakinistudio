// Sentry (errors only) — no-ops unless SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN is set. PII scrubbed (14.2).
import * as Sentry from '@sentry/nextjs'
import { scrubEvent } from './lib/observability/scrub'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
    beforeSend: (event) => scrubEvent(event),
  })
}
