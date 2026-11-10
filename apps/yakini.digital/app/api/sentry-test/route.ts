import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

/**
 * Preview/dev only endpoint that sends a test exception to Sentry.
 * 404s in production.
 */
async function sendTestError() {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const error = new Error('Sentry preview test error (yakini.digital server)');
  Sentry.captureException(error);
  await Sentry.flush(2000);
  return NextResponse.json({ ok: true, sent: true });
}

export async function GET() {
  return sendTestError();
}

export async function POST() {
  return sendTestError();
}
