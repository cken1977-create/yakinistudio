// Square OAuth code flow (server-side; tokens never reach the browser).
// Docs: access tokens last 30 days; code-flow refresh tokens don't expire
// unless access is revoked. We refresh well before expiry.
import { SQUARE_BASE_URL, SQUARE_SCOPES, type SquareConfig } from './config'
import { squareFetch } from './http'

export function buildAuthorizeUrl(cfg: SquareConfig, state: string): string {
  const u = new URL(`${SQUARE_BASE_URL}/oauth2/authorize`)
  u.searchParams.set('client_id', cfg.applicationId)
  u.searchParams.set('scope', SQUARE_SCOPES.join(' '))
  u.searchParams.set('state', state)
  u.searchParams.set('redirect_uri', cfg.redirectUrl)
  return u.toString()
}

export type TokenResponse = {
  access_token: string
  refresh_token: string
  expires_at: string
  merchant_id: string
  token_type?: string
}

export async function exchangeCode(cfg: SquareConfig, code: string, fetchImpl?: typeof fetch): Promise<TokenResponse> {
  return squareFetch<TokenResponse>('/oauth2/token', {
    method: 'POST',
    fetchImpl,
    maxRetries: 1,
    body: {
      client_id: cfg.applicationId,
      client_secret: cfg.applicationSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: cfg.redirectUrl,
    },
  })
}

export async function refreshAccessToken(cfg: SquareConfig, refreshToken: string, fetchImpl?: typeof fetch): Promise<TokenResponse> {
  return squareFetch<TokenResponse>('/oauth2/token', {
    method: 'POST',
    fetchImpl,
    body: {
      client_id: cfg.applicationId,
      client_secret: cfg.applicationSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    },
  })
}

export async function revokeAccess(cfg: SquareConfig, merchantId: string, fetchImpl?: typeof fetch): Promise<void> {
  await squareFetch('/oauth2/revoke', {
    method: 'POST',
    fetchImpl,
    authHeader: `Client ${cfg.applicationSecret}`,
    body: { client_id: cfg.applicationId, merchant_id: merchantId },
  })
}

/** Refresh when the access token is within `days` of expiring (default 7). */
export function needsRefresh(expiresAt: string | null | undefined, now = new Date(), days = 7): boolean {
  if (!expiresAt) return true
  const t = Date.parse(expiresAt)
  if (Number.isNaN(t)) return true
  return t - now.getTime() < days * 24 * 3600 * 1000
}
