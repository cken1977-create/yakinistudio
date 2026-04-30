import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: authToken } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (!authToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (new Date(authToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    }

    // Mark token as used
    await supabase
      .from('auth_tokens')
      .update({ used: true })
      .eq('id', authToken.id)

    // Set session cookie
    const response = NextResponse.json({ success: true }, { status: 200 })
    response.cookies.set('yakini_client', authToken.email, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response

  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
