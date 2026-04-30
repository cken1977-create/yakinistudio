import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Lead } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body: Lead = await req.json()

    // Validate required fields
    if (!body.name || !body.email || !body.service || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save to Supabase
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name: body.name,
          email: body.email,
          company: body.company ?? null,
          service: body.service,
          budget: body.budget ?? null,
          message: body.message,
        },
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    )

  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
