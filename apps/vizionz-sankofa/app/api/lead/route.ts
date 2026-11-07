import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveWebsiteMessage } from '@/lib/contact/public-message'

// Website contact and newsletter posts land here.
// They are stored on intake_requests for staff. This route does not send email.

function databaseReady(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function POST(req: NextRequest) {
  if (!databaseReady()) {
    return NextResponse.json({
      ok: false,
      saved: false,
      emailSent: false,
      error: 'This form is not connected to the request list yet. Nothing was saved and no email was sent.',
    }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({
      ok: false,
      saved: false,
      emailSent: false,
      error: 'The message was not readable. Nothing was saved.',
    }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const result = await saveWebsiteMessage(body, async (row) => {
      const { error } = await supabase.from('intake_requests').insert(row)
      return { error: error ? { message: error.message } : null }
    })
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({
      ok: false,
      saved: false,
      emailSent: false,
      error: 'We could not save this. Nothing was sent. Please try again.',
    }, { status: 500 })
  }
}
