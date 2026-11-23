import { NextRequest, NextResponse } from 'next/server'
import { clientIp } from '@/lib/esign/server'
import { rateLimited, tooMany } from '@/lib/server/guard'
import { ASSISTANT } from '@/lib/chat/assistant'
import { corsHeaders, preflight } from '@/lib/chat/cors'
import { blocked, cutMessage, sanitizeHistory, type ChatTurn } from '@/lib/chat/guard'
import { fallbackAnswer, publicOnlyLinks, scrubVisitorText, shouldUseGroundedReply } from '@/lib/chat/knowledge'
import { completeChat, hasXaiKey, streamChat } from '@/lib/chat/xai'

export const runtime = 'nodejs'
export const maxDuration = 15

export function OPTIONS(req: NextRequest) {
  return preflight(req)
}

function json(req: Request, body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders(req) })
}

export async function POST(req: NextRequest) {
  if (rateLimited(`chat:${clientIp(req.headers) ?? 'unknown'}`, 30, 15 * 60_000)) {
    const res = tooMany()
    corsHeaders(req).forEach((v, k) => res.headers.set(k, v))
    return res
  }

  const raw = await req.json().catch(() => ({}))
  const message = cutMessage(raw.message ?? raw.text)
  if (!message) return json(req, { error: 'Please type a short question.' }, 400)
  if (blocked(message)) {
    const reply = fallbackAnswer(message)
    return json(req, { text: reply.text, links: publicOnlyLinks(reply.links), source: 'guard', assistant: ASSISTANT.name })
  }

  // Kits and "see a demo" must stay on the public no-login map, not a model guess.
  if (shouldUseGroundedReply(message)) {
    const reply = fallbackAnswer(message)
    return json(req, { text: reply.text, links: publicOnlyLinks(reply.links), source: 'fallback', assistant: ASSISTANT.name })
  }

  const history = sanitizeHistory(raw.history)
  const turns: ChatTurn[] = [...history, { role: 'user', content: message }]
  const stream = raw.stream !== false

  if (stream && hasXaiKey()) {
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
        try {
          send({ type: 'start', assistant: ASSISTANT.name })
          let full = ''
          for await (const chunk of streamChat(turns)) {
            if (chunk.type === 'token') {
              full += chunk.text
              send({ type: 'token', text: chunk.text })
            } else if (chunk.type === 'done') {
              full = chunk.text
            }
          }
          if (full.trim()) {
            send({ type: 'done', text: scrubVisitorText(full.trim()), links: publicOnlyLinks(fallbackAnswer(message).links), source: 'xai' })
          } else {
            const fb = fallbackAnswer(message)
            send({ type: 'done', text: fb.text, links: publicOnlyLinks(fb.links), source: 'fallback' })
          }
        } catch {
          const fb = fallbackAnswer(message)
          send({ type: 'done', text: fb.text, links: publicOnlyLinks(fb.links), source: 'fallback' })
        } finally {
          controller.close()
        }
      },
    })
    return new Response(readable, {
      headers: corsHeaders(req, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' }),
    })
  }

  // Non-streaming clients (and a stream failure) still use the model when a key is present.
  if (hasXaiKey()) {
    try {
      const text = await completeChat(turns)
      if (text?.trim()) {
        return json(req, {
          text: scrubVisitorText(text.trim()),
          links: publicOnlyLinks(fallbackAnswer(message).links),
          source: 'xai',
          assistant: ASSISTANT.name,
        })
      }
    } catch {
      /* use the grounded fallback below */
    }
  }

  const fb = fallbackAnswer(message)
  return json(req, { text: fb.text, links: publicOnlyLinks(fb.links), source: 'fallback', assistant: ASSISTANT.name })
}
