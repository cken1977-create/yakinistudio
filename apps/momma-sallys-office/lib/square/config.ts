// Square connection settings. SLICE 1 IS SANDBOX-ONLY BY DESIGN.
// The base URL is hard-coded to Square's sandbox, and credentials that
// aren't sandbox credentials are refused. Moving to production needs a code
// change, a migration (ms_square_connection.environment), and Clarence's OK.

export const SQUARE_BASE_URL = 'https://connect.squareupsandbox.com'
export const SQUARE_VERSION = '2026-09-16'
export const SQUARE_ENVIRONMENT = 'sandbox' as const

/** Read-only scopes for slice 1. No write, refund, bank or payout scopes. */
export const SQUARE_SCOPES = [
  'MERCHANT_PROFILE_READ',
  'ORDERS_READ',
  'PAYMENTS_READ',
  'ITEMS_READ',
  'CUSTOMERS_READ',
  'EMPLOYEES_READ',
] as const

export type SquareConfig = {
  applicationId: string
  applicationSecret: string
  redirectUrl: string
  webhookSignatureKey: string
  webhookNotificationUrl: string
  tokenEncryptionKey: string
}

export class SquareConfigError extends Error {}

/** Reads and validates Square settings. Never logs or returns secret values in errors. */
export function getSquareConfig(env: Record<string, string | undefined> = process.env): SquareConfig {
  const missing: string[] = []
  const need = (name: string) => {
    const v = env[name]?.trim()
    if (!v) missing.push(name)
    return v ?? ''
  }
  const cfg: SquareConfig = {
    applicationId: need('SQUARE_APPLICATION_ID'),
    applicationSecret: need('SQUARE_APPLICATION_SECRET'),
    redirectUrl: need('SQUARE_REDIRECT_URL'),
    webhookSignatureKey: need('SQUARE_WEBHOOK_SIGNATURE_KEY'),
    webhookNotificationUrl: need('SQUARE_WEBHOOK_NOTIFICATION_URL'),
    tokenEncryptionKey: need('SQUARE_TOKEN_ENCRYPTION_KEY'),
  }
  if (missing.length) throw new SquareConfigError(`Square isn't configured (missing: ${missing.join(', ')})`)
  if ((env.SQUARE_ENVIRONMENT ?? 'sandbox') !== 'sandbox') {
    throw new SquareConfigError('Only the Square sandbox is allowed in this build')
  }
  if (!cfg.applicationId.startsWith('sandbox-')) {
    throw new SquareConfigError('SQUARE_APPLICATION_ID must be a sandbox application ID (starts with "sandbox-")')
  }
  for (const [name, url] of [['SQUARE_REDIRECT_URL', cfg.redirectUrl], ['SQUARE_WEBHOOK_NOTIFICATION_URL', cfg.webhookNotificationUrl]]) {
    let u: URL
    try { u = new URL(url) } catch { throw new SquareConfigError(`${name} isn't a valid URL`) }
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
    if (u.protocol !== 'https:' && !(local && name === 'SQUARE_REDIRECT_URL')) {
      throw new SquareConfigError(`${name} must use https`)
    }
  }
  return cfg
}

export function squareConfigured(env: Record<string, string | undefined> = process.env): boolean {
  try { getSquareConfig(env); return true } catch { return false }
}
