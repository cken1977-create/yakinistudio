import { NextRequest, NextResponse } from 'next/server'
import { handleMagicLinkVerify } from '@yakini/database'

export async function POST(req: NextRequest) {
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
