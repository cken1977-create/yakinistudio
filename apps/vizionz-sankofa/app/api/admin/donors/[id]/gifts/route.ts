// VIZIONZ SANKOFA · /api/admin/donors/[id]/gifts (Wave 3.5)
//
// GET handler that returns the gift history for a single donor.
// Used by DonorRow's lazy-loaded gift history accordion.

import { NextResponse } from 'next/server'
import { requireOperatorOrEmployee } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireOperatorOrEmployee()
  } catch {
    return NextResponse.json({ error: 'Operator access required.' }, { status: 403 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'donor id required.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('donor_gifts')
    .select('id, donor_id, amount_cents, gift_date, method, designation, notes, recorded_by, created_at')
    .eq('donor_id', id)
    .order('gift_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ gifts: data ?? [] })
}
