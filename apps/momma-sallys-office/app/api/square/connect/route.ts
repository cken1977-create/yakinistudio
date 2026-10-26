// Owner starts the Square (sandbox) OAuth flow.
import { NextResponse } from 'next/server'
import { flags } from '@/lib/flags'
import { getSquareConfig } from '@/lib/square/config'
import { buildAuthorizeUrl } from '@/lib/square/oauth'
import { randomToken } from '@/lib/square/crypto'
import { notFoundResponse, ownerOrNull } from '@/lib/route-guards'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!flags.squareSync()) return notFoundResponse()
  if (!(await ownerOrNull())) return notFoundResponse()
  let cfg
  try { cfg = getSquareConfig() } catch {
    return NextResponse.redirect(new URL('/square?error=config', req.url))
  }
  const state = randomToken()
  const res = NextResponse.redirect(buildAuthorizeUrl(cfg, state))
  res.cookies.set('ms_sq_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/square/callback', maxAge: 600 })
  return res
}
