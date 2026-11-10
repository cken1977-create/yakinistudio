import { resolveSentryDsn } from '@/lib/observability/sentry-dsn';
/**
 * Sentry browser init — no-ops without NEXT_PUBLIC_SENTRY_DSN.
 * Session Replay is off to stay on the free tier.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = resolveSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 0.1 : 1.0,
    enabled: true,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
