import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/client/login', req.url))
  }

  try {
    const supabase = createClient()
    const { data: authToken } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (!authToken || new Date(authToken.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/client/login?error=expired', req.url))
    }

    await supabase
      .from('auth_tokens')
      .update({ used: true })
      .eq('id', authToken.id)

    const url = new URL('/client', req.url)
    const response = NextResponse.redirect(url, { status: 302 })

    response.cookies.set({
      name: 'yakini_client',
      value: authToken.email,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response

  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.redirect(new URL('/client/login?error=failed', req.url))
  }
}
