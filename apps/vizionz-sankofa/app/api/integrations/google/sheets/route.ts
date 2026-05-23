// VIZIONZ SANKOFA - /api/integrations/google/sheets
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOperatorOrEmployee } from '@/lib/supabase/auth'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const session = await requireOperatorOrEmployee()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const connectionId = request.nextUrl.searchParams.get('connection_id')
  if (!connectionId) return NextResponse.json({ error: 'Missing connection_id' }, { status: 400 })

  const supabase = await createClient()
  const { data: conn } = await supabase
    .from('google_oauth_connections')
    .select('access_token, refresh_token, token_expires_at')
    .eq('id', connectionId)
    .eq('is_active', true)
    .maybeSingle()

  if (!conn) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: conn.access_token,
    refresh_token: conn.refresh_token,
    expiry_date: conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : undefined,
  })

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id,name)',
      pageSize: 50,
    })
    const sheets = (res.data.files ?? []).map(f => ({
      spreadsheetId: f.id,
      title: f.name,
    }))
    return NextResponse.json({ sheets })
  } catch (err) {
    console.error('Drive list failed:', err)
    return NextResponse.json({ error: 'Failed to list sheets' }, { status: 500 })
  }
}
