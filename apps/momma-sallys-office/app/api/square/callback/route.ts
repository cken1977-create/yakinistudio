// Square redirects here after the owner approves (or declines) access.
import { NextResponse, after, type NextRequest } from 'next/server'
import { flags } from '@/lib/flags'
import { getSquareConfig } from '@/lib/square/config'
import { exchangeCode } from '@/lib/square/oauth'
import { safeEqual } from '@/lib/square/crypto'
import { SQUARE_SCOPES } from '@/lib/square/config'
import { saveTokens } from '@/lib/square/store'
import { runSync } from '@/lib/square/sync'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFoundResponse, ownerOrNull } from '@/lib/route-guards'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  if (!flags.squareSync()) return notFoundResponse()
  if (!(await ownerOrNull())) return notFoundResponse()
  const back = (q: string) => {
    const r = NextResponse.redirect(new URL(`/square?${q}`, req.url))
    r.cookies.delete({ name: 'ms_sq_state', path: '/api/square/callback' })
    return r
  }
  const params = req.nextUrl.searchParams
  const state = params.get('state') ?? ''
  const cookieState = req.cookies.get('ms_sq_state')?.value ?? ''
  if (!state || !cookieState || !safeEqual(state, cookieState)) return back('error=state')
  if (params.get('error')) return back('error=declined')
  const code = params.get('code')
  if (!code) return back('error=nocode')

  try {
    const cfg = getSquareConfig()
    const tokens = await exchangeCode(cfg, code)
    const db = createAdminClient()
    await saveTokens(db, cfg.tokenEncryptionKey, tokens, { scopes: [...SQUARE_SCOPES] })
    after(() => runSync(db, 'full', 'connect').then(() => undefined))
    return back('connected=1')
  } catch {
    // Don't echo Square's response; it can contain token material.
    return back('error=exchange')
  }
}
