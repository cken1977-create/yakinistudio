// Owner presses "Sync now".
import { NextResponse } from 'next/server'
import { flags } from '@/lib/flags'
import { runSync } from '@/lib/square/sync'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFoundResponse, ownerOrNull, sameOrigin } from '@/lib/route-guards'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: Request) {
  if (!flags.squareSync()) return notFoundResponse()
  if (!sameOrigin(req) || !(await ownerOrNull())) return notFoundResponse()
  const form = await req.formData().catch(() => null)
  const kind = form?.get('kind') === 'full' ? 'full' : 'incremental'
  const r = await runSync(createAdminClient(), kind, 'owner')
  return NextResponse.redirect(new URL(`/square?${r.ok ? 'synced=1' : 'error=sync'}`, req.url), { status: 303 })
}
