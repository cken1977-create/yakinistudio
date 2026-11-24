// Sentry browser init — no-ops without NEXT_PUBLIC_SENTRY_DSN. No session replay. PII scrubbed.
import * as Sentry from '@sentry/nextjs'
import { scrubEvent } from './lib/observability/scrub'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
// Studio only: client sites never talk to an outside service (R2, spec 16.7).
const studioHost = (() => { try { return new URL(process.env.NEXT_PUBLIC_STUDIO_ORIGIN || 'https://studio.yakini.digital').hostname } catch { return 'studio.yakini.digital' } })()
const here = typeof window === 'undefined' ? '' : window.location.hostname
const onStudio = here === studioHost || here.endsWith('.vercel.app') || here === 'localhost'
if (dsn && onStudio) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend: (event) => scrubEvent(event),
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
