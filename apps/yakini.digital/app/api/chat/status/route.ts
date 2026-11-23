import { NextRequest, NextResponse } from 'next/server'
import { ASSISTANT } from '@/lib/chat/assistant'
import { corsHeaders, preflight } from '@/lib/chat/cors'
import { hasElevenLabsKey } from '@/lib/chat/elevenlabs'
import { hasXaiKey } from '@/lib/chat/xai'

export const runtime = 'nodejs'

export function OPTIONS(req: NextRequest) {
  return preflight(req)
}

export function GET(req: NextRequest) {
  return NextResponse.json(
    {
      assistant: ASSISTANT.name,
      role: ASSISTANT.role,
      llm: hasXaiKey(),
      tts: hasElevenLabsKey(),
    },
    { headers: corsHeaders(req, { 'Cache-Control': 'no-store' }) },
  )
}
