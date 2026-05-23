// VIZIONZ SANKOFA - /admin/integrations/google/[connection_id]/sheets
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireOperatorOrEmployee, getOperatorDisplayName, touchLastActive } from '@/lib/supabase/auth'
import SheetsPickerClient from './SheetsPickerClient'

export default async function SheetsPickerPage({
  params,
}: {
  params: Promise<{ connection_id: string }>
}) {
  const session = await requireOperatorOrEmployee()
  if (!session) redirect('/login')
  await touchLastActive(session.id)
  const displayName = getOperatorDisplayName(session)

  const { connection_id } = await params

  const supabase = await createClient()

  const { data: connection } = await supabase
    .from('google_oauth_connections')
    .select('id, google_email, access_token, refresh_token, token_expires_at')
    .eq('id', connection_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!connection) redirect('/admin/integrations/google')

  const { data: existingMappings } = await supabase
    .from('google_sheet_mappings')
    .select('id, sheet_name, spreadsheet_id, last_synced_at')
    .eq('connection_id', connection_id)
    .order('created_at', { ascending: false })

  return (
    <SheetsPickerClient
      displayName={displayName}
      connectionId={connection_id}
      googleEmail={connection.google_email}
      existingMappings={existingMappings ?? []}
    />
  )
}
