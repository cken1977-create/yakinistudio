// VIZIONZ SANKOFA - /api/integrations/google/disconnect
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOperatorOrEmployee } from '@/lib/supabase/auth'

export async function POST() {
  const session = await requireOperatorOrEmployee()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  await supabase
    .from('google_oauth_connections')
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq('is_active', true)

  return NextResponse.json({ ok: true })
}
