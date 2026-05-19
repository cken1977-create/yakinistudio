import { NextRequest, NextResponse } from 'next/server'
import { handleLeadSubmission } from '@yakini/database'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await handleLeadSubmission(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Lead submission error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process lead' },
      { status: 500 }
    )
  }
}
