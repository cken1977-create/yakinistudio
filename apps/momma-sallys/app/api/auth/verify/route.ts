import { NextRequest, NextResponse } from 'next/server'
import { handleMagicLinkVerify } from '@yakini/database'
import { config } from '@/config/brand'

export async function POST(req: NextRequest) {
  // Portal is off: its sign-in endpoints don't exist either.
  if (!config.portal.enabled) return new NextResponse('Not found', { status: 404 })
  try {
    const body = await req.json()
    const result = await handleMagicLinkVerify(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, email: result.email })
  } catch (error: any) {
    console.error('Magic link verify error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify magic link' },
      { status: 500 }
    )
  }
}
