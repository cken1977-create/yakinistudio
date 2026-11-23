import { NextRequest, NextResponse } from 'next/server'
import { clientIp } from '@/lib/esign/server'
import { rateLimited, tooMany } from '@/lib/server/guard'
import { corsHeaders, preflight } from '@/lib/chat/cors'
import { cutMessage } from '@/lib/chat/guard'
import { hasElevenLabsKey, speakReply } from '@/lib/chat/elevenlabs'

export const runtime = 'nodejs'
export const maxDuration = 15

export function OPTIONS(req: NextRequest) {
  return preflight(req)
}

export async function POST(req: NextRequest) {
  if (rateLimited(`chat-speak:${clientIp(req.headers) ?? 'unknown'}`, 20, 15 * 60_000)) {
    const res = tooMany()
    corsHeaders(req).forEach((v, k) => res.headers.set(k, v))
    return res
  }
  if (!hasElevenLabsKey()) {
    return NextResponse.json({ error: 'Voice is not on yet.', tts: false }, { status: 503, headers: corsHeaders(req) })
  }
  const raw = await req.json().catch(() => ({}))
  const text = cutMessage(raw.text)
  if (!text) return NextResponse.json({ error: 'Nothing to say.' }, { status: 400, headers: corsHeaders(req) })
  const audio = await speakReply(text)
  if (!audio) return NextResponse.json({ error: 'Voice did not come through. Please try again.' }, { status: 502, headers: corsHeaders(req) })
  return new Response(new Uint8Array(audio), {
    headers: corsHeaders(req, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' }),
  })
}
