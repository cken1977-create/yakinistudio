/** True only for a real Sentry DSN — rejects .env.example placeholders. */
export function resolveSentryDsn(
  ...candidates: Array<string | undefined>
): string | undefined {
  for (const raw of candidates) {
    const dsn = raw?.trim();
    if (!dsn) continue;
    if (dsn.includes('...')) continue;
    if (!/^https:\/\/.+@.+sentry\.io\//.test(dsn)) continue;
    return dsn;
  }
  return undefined;
}
