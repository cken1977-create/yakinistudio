// VIZIONZ SANKOFA · /api/admin/intelligence/ask (Wave 3.4)
//
// POST handler for the Yakini Intelligence chat surface. Receives a
// question + optional conversation history, runs the tool-use orchestrator,
// returns the grounded answer + source citations.
//
// Auth: requireOperator(). Non-operators get 403.
// Runtime: nodejs (Anthropic SDK, Supabase service-role).

import { NextResponse } from 'next/server'
import { requireOperator } from '@/lib/supabase/auth'
import { ask, type ConversationTurn } from '@/lib/intelligence/orchestrator'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_HISTORY_TURNS = 20
const MAX_QUESTION_LENGTH = 2000

export async function POST(request: Request) {
  // 1. Auth gate.
  try {
    await requireOperator()
  } catch {
    return NextResponse.json(
      { error: 'Operator role required.' },
      { status: 403 }
    )
  }

  // 2. Parse and validate body.
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 }
    )
  }

  const parsed = parseRequestBody(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  // 3. Run the orchestrator.
  try {
    const result = await ask(parsed.question, parsed.history)
    return NextResponse.json({
      answer: result.answer,
      citations: result.citations,
      tool_calls_made: result.tool_calls_made,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[intelligence/ask] orchestrator failed:', err)
    return NextResponse.json(
      {
        error:
          'Yakini Intelligence could not complete your request. ' +
          'Please try again. If this keeps happening, the underlying ' +
          'systems may need attention.',
        detail: message,
      },
      { status: 500 }
    )
  }
}

// ─── Validation ──────────────────────────────────────────────────────────

type ParseResult =
  | { ok: true; question: string; history: ConversationTurn[] }
  | { ok: false; error: string }

function parseRequestBody(body: unknown): ParseResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Body must be an object.' }
  }

  const obj = body as Record<string, unknown>

  // Question: required, non-empty string, max length capped.
  const question = obj.question
  if (typeof question !== 'string') {
    return { ok: false, error: 'question must be a string.' }
  }
  const trimmed = question.trim()
  if (!trimmed) {
    return { ok: false, error: 'question cannot be empty.' }
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return {
      ok: false,
      error: `question is too long (max ${MAX_QUESTION_LENGTH} characters).`,
    }
  }

  // History: optional, array of {role, content}.
  let history: ConversationTurn[] = []
  if (obj.history !== undefined && obj.history !== null) {
    if (!Array.isArray(obj.history)) {
      return { ok: false, error: 'history must be an array.' }
    }
    if (obj.history.length > MAX_HISTORY_TURNS) {
      // Trim to the most recent MAX_HISTORY_TURNS rather than rejecting.
      history = obj.history.slice(-MAX_HISTORY_TURNS) as ConversationTurn[]
    } else {
      history = obj.history as ConversationTurn[]
    }
    for (const turn of history) {
      if (
        !turn ||
        typeof turn !== 'object' ||
        (turn.role !== 'user' && turn.role !== 'assistant') ||
        typeof turn.content !== 'string'
      ) {
        return {
          ok: false,
          error: 'history entries must be {role: "user"|"assistant", content: string}.',
        }
      }
    }
  }

  return { ok: true, question: trimmed, history }
}
