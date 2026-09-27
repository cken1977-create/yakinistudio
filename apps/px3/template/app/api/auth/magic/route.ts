import { NextRequest, NextResponse } from 'next/server'
import { handleMagicLinkRequest } from '@yakini/database'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await handleMagicLinkRequest(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Magic link request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
