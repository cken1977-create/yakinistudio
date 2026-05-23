// VIZIONZ SANKOFA · /api/integrations/google/start
//
// OAuth flow entry point. Redirects user to Google consent screen with
// full Sheets + Drive scopes. State parameter carries CSRF protection +
// optional return URL for post-callback redirect.

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import crypto from 'crypto'
import { requireOperatorOrEmployee } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
]

export async function GET(request: NextRequest) {
  // Only authenticated VS operators can initiate Google connection
  await requireOperatorOrEmployee()

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      {
        error:
          'Google OAuth not configured. Check GOOGLE_OAUTH_CLIENT_ID, ' +
          'GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI in env.',
      },
      { status: 500 },
    )
  }

  // Generate CSRF state token
  const stateToken = crypto.randomBytes(24).toString('hex')

  // Optional return URL — where to send the user after successful callback
  const returnTo =
    request.nextUrl.searchParams.get('return_to') ?? '/admin/integrations/google'

  // Encode state as JSON for callback validation
  const state = Buffer.from(
    JSON.stringify({ csrf: stateToken, return_to: returnTo }),
  ).toString('base64url')

  // Build the OAuth client
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  )

  // Generate consent URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get refresh_token
    prompt: 'consent', // Force consent screen even if previously approved
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  })

  // Set state cookie for CSRF validation in callback
  const response = NextResponse.redirect(authUrl)
  response.cookies.set('google_oauth_state', stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  return response
}
