// VIZIONZ SANKOFA - /api/integrations/google/import
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOperatorOrEmployee } from '@/lib/supabase/auth'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  const session = await requireOperatorOrEmployee()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { connection_id, spreadsheet_id } = body

  if (!connection_id || !spreadsheet_id) {
    return NextResponse.json({ error: 'Missing connection_id or spreadsheet_id' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: conn } = await supabase
    .from('google_oauth_connections')
    .select('id, access_token, refresh_token, token_expires_at')
    .eq('id', connection_id)
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
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

    // Get spreadsheet metadata for sheet name
    const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheet_id })
    const sheetTitle = meta.data.properties?.title ?? 'Untitled'
    const firstSheet = meta.data.sheets?.[0]?.properties?.title ?? 'Sheet1'

    // Read first sheet rows
    const range = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheet_id,
      range: firstSheet,
    })

    const rows = range.data.values ?? []
    if (rows.length < 2) {
      return NextResponse.json({ inserted: 0, skipped: 0, message: 'No data rows found' })
    }

    const headers = (rows[0] as string[]).map((h: string) => h.trim().toLowerCase())
    const dataRows = rows.slice(1) as string[][]

    // Map common header variants to VS participant fields
    const fieldMap: Record<string, string> = {
      'first name': 'first_name', firstname: 'first_name', first: 'first_name',
      'last name': 'last_name', lastname: 'last_name', last: 'last_name',
      email: 'email', 'email address': 'email',
      phone: 'phone', 'phone number': 'phone', mobile: 'phone',
      dob: 'date_of_birth', 'date of birth': 'date_of_birth', birthday: 'date_of_birth',
      notes: 'notes', note: 'notes',
    }

    let inserted = 0
    let skipped = 0

    for (const row of dataRows) {
      const record: Record<string, string> = {}
      headers.forEach((h, i) => {
        const mapped = fieldMap[h]
        if (mapped && row[i]) record[mapped] = row[i].trim()
      })

      if (!record.first_name && !record.last_name && !record.email) {
        skipped++
        continue
      }

      // Dedupe by email if present
      if (record.email) {
        const { data: existing } = await supabase
          .from('participants')
          .select('id')
          .eq('email', record.email)
          .maybeSingle()
        if (existing) { skipped++; continue }
      }

      const { error } = await supabase.from('participants').insert({
        ...record,
        status: 'active',
        created_at: new Date().toISOString(),
      })

      if (error) { skipped++ } else { inserted++ }
    }

    // Upsert sheet mapping record
    await supabase.from('google_sheet_mappings').upsert({
      connection_id,
      spreadsheet_id,
      sheet_name: sheetTitle,
      last_synced_at: new Date().toISOString(),
      is_active: true,
    }, { onConflict: 'connection_id,spreadsheet_id' })

    // Update last_used_at on connection
    await supabase
      .from('google_oauth_connections')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', connection_id)

    return NextResponse.json({ inserted, skipped })
  } catch (err) {
    console.error('Import failed:', err)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
