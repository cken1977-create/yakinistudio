// VIZIONZ SANKOFA · /auth/confirm
// Magic-link callback handler. Supabase redirects the operator here
// after they click the link in their email. We verify the token,
// create the session, and redirect to the admin surface.

import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/admin'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Session created. Redirect to admin (or wherever 'next' points).
      redirect(next)
    }
  }

  // Token missing, expired, or verification failed.
  // Send to a friendly error page instead of leaking Supabase internals.
  redirect('/auth/error')
}
