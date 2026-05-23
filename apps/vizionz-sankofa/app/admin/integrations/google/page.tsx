// VIZIONZ SANKOFA - /admin/integrations/google
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireOperatorOrEmployee, getOperatorDisplayName, touchLastActive } from '@/lib/supabase/auth'
import GoogleIntegrationClient from './GoogleIntegrationClient'

export default async function GoogleIntegrationPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; email?: string; error?: string }>
}) {
  const session = await requireOperatorOrEmployee()
  if (!session) redirect('/login')
  await touchLastActive(session.id)
  const displayName = getOperatorDisplayName(session)

  const supabase = await createClient()

  const { data: connection } = await supabase
    .from('google_oauth_connections')
    .select('id, google_email, scopes, created_at, last_used_at')
    .eq('is_active', true)
    .maybeSingle()

  const { data: mappings } = connection
    ? await supabase
        .from('google_sheet_mappings')
        .select('id, sheet_name, spreadsheet_id, last_synced_at, is_active')
        .eq('connection_id', connection.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const params = await searchParams
  const justConnected = params.connected === 'true'
  const connectedEmail = params.email ?? null
  const errorCode = params.error ?? null

  return (
    <GoogleIntegrationClient
      displayName={displayName}
      connection={connection ?? null}
      mappings={mappings ?? []}
      justConnected={justConnected}
      connectedEmail={connectedEmail}
      errorCode={errorCode}
    />
  )
}
