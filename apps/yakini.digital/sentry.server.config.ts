import { resolveSentryDsn } from '@/lib/observability/sentry-dsn';
/**
 * Sentry server init — no-ops when NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN unset.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = resolveSentryDsn(process.env.SENTRY_DSN, process.env.NEXT_PUBLIC_SENTRY_DSN);

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
    enabled: true,
  });
}
