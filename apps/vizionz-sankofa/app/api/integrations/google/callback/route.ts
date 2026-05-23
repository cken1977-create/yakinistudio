// VIZIONZ SANKOFA · /api/integrations/google/callback
//
// OAuth callback. Google redirects here with ?code=... after Khadijah
// approves consent. We exchange the code for access+refresh tokens,
// fetch the Google account identity, store the connection in Supabase,
// then redirect back to the admin integrations page with status.

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { requireOperatorOrEmployee } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SCOPES_REQUESTED = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
]

export async function GET(request: NextRequest) {
  const user = await requireOperatorOrEmployee()

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return redirectWithError(request, 'oauth_not_configured')
  }

  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const errorParam = searchParams.get('error')

  // Google sometimes returns ?error=access_denied if user clicked "Cancel"
  if (errorParam) {
    return redirectWithError(request, errorParam)
  }

  if (!code || !stateParam) {
    return redirectWithError(request, 'missing_code_or_state')
  }

  // Validate CSRF state token from cookie
  const stateCookie = request.cookies.get('google_oauth_state')
  if (!stateCookie) {
    return redirectWithError(request, 'missing_state_cookie')
  }

  let returnTo = '/admin/integrations/google'
  try {
    const stateDecoded = JSON.parse(
      Buffer.from(stateParam, 'base64url').toString('utf-8'),
    ) as { csrf: string; return_to?: string }
    if (stateDecoded.csrf !== stateCookie.value) {
      return redirectWithError(request, 'state_mismatch')
    }
    if (stateDecoded.return_to) returnTo = stateDecoded.return_to
  } catch {
    return redirectWithError(request, 'invalid_state_format')
  }

  // Exchange code for tokens
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  )

  let tokens
  try {
    const tokenResponse = await oauth2Client.getToken(code)
    tokens = tokenResponse.tokens
  } catch (err) {
    console.error('Google token exchange failed:', err)
    return redirectWithError(request, 'token_exchange_failed')
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    return redirectWithError(request, 'incomplete_tokens')
  }

  oauth2Client.setCredentials(tokens)

  // Fetch the connected Google account identity
  let googleEmail: string
  let googleUserId: string
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    googleEmail = userInfo.data.email ?? ''
    googleUserId = userInfo.data.id ?? ''
    if (!googleEmail || !googleUserId) {
      return redirectWithError(request, 'missing_user_info')
    }
  } catch (err) {
    console.error('Google userinfo fetch failed:', err)
    return redirectWithError(request, 'userinfo_fetch_failed')
  }

  // Resolve current operator → staff for connected_by attribution
  const supabase = await createClient()
  const { data: staffRow } = await supabase
    .from('staff')
    .select('id')
    .eq('is_active', true)
    .order('full_name', { ascending: true })
    .limit(1)
    .maybeSingle()
  const connectedById = (staffRow as { id: string } | null)?.id ?? null

  // Compute token expiration
  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000)

  // Mark any existing active connection for this email as inactive
  // (Khadijah re-connecting replaces prior connection cleanly)
  await supabase
    .from('google_oauth_connections')
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq('google_email', googleEmail)
    .eq('is_active', true)

  // Insert the new connection
  const { error: insertError } = await supabase
    .from('google_oauth_connections')
    .insert({
      google_email: googleEmail,
      google_user_id: googleUserId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt.toISOString(),
      scopes: SCOPES_REQUESTED.join(' '),
      connected_by_id: connectedById,
      connected_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      is_active: true,
    })

  if (insertError) {
    console.error('Connection insert failed:', insertError)
    return redirectWithError(request, 'database_insert_failed')
  }

  // Success — clear the state cookie and redirect to the return URL
  void user
  const successUrl = new URL(returnTo, request.nextUrl.origin)
  successUrl.searchParams.set('connected', 'true')
  successUrl.searchParams.set('email', googleEmail)

  const response = NextResponse.redirect(successUrl)
  response.cookies.delete('google_oauth_state')
  return response
}

function redirectWithError(request: NextRequest, errorCode: string) {
  const errorUrl = new URL('/admin/integrations/google', request.nextUrl.origin)
  errorUrl.searchParams.set('error', errorCode)
  const response = NextResponse.redirect(errorUrl)
  response.cookies.delete('google_oauth_state')
  return response
}
