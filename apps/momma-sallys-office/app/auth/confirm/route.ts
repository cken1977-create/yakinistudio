// Magic-link callback (ported from Vizionz Sankofa /auth/confirm).
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const supabase = await createClient()

  let ok = false
  if (token_hash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash })).error
  else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error

  if (ok) {
    await supabase.rpc('ms_accept_invite')
    return NextResponse.redirect(`${origin}/`)
  }
  return NextResponse.redirect(`${origin}/login?error=link`)
}
