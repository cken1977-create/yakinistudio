// Owner disconnects Square: revoke at Square, delete tokens, keep history.
import { NextResponse } from 'next/server'
import { flags } from '@/lib/flags'
import { getSquareConfig } from '@/lib/square/config'
import { revokeAccess } from '@/lib/square/oauth'
import { getConnection, markDisconnected } from '@/lib/square/store'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFoundResponse, ownerOrNull, sameOrigin } from '@/lib/route-guards'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!flags.squareSync()) return notFoundResponse()
  if (!sameOrigin(req) || !(await ownerOrNull())) return notFoundResponse()
  const db = createAdminClient()
  const conn = await getConnection(db)
  try {
    if (conn?.merchant_id) await revokeAccess(getSquareConfig(), conn.merchant_id)
  } catch { /* still forget the tokens locally */ }
  await markDisconnected(db, 'disconnected', 'Disconnected by the owner')
  return NextResponse.redirect(new URL('/square?disconnected=1', req.url), { status: 303 })
}
