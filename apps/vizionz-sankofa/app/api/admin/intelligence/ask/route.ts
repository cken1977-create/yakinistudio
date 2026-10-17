// VIZIONZ SANKOFA · /api/admin/intelligence/ask (Wave 3.4)
//
// POST handler for the Yakini Intelligence chat surface. Receives a
// question + optional conversation history, runs the tool-use orchestrator,
// returns the grounded answer + source citations.
//
// Auth: any staff member with a pilot access_role (executive, operator,
// case_manager, leadership_readonly). Data visibility is enforced by RLS.
// Privacy: simple counts are answered from SQL with no AI call; everything
// else is tokenized (no names / contact info / IDs) before it reaches the
// AI provider. Every question is written to vs_audit_log first; if the
// log write fails, nothing is sent.
// Runtime: nodejs (Anthropic SDK, Supabase service-role).

import { NextResponse } from 'next/server'
import { getCurrentOperator, getAccessRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { ask, ANTHROPIC_MODEL, type ConversationTurn } from '@/lib/intelligence/orchestrator'
import { PiiVault } from '@/lib/intelligence/pii'
import { loadKnownNames } from '@/lib/intelligence/known-names'
import { parseCountQuestion, answerCountQuestion } from '@/lib/intelligence/counts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_HISTORY_TURNS = 20
const MAX_QUESTION_LENGTH = 2000

// Pilot rule: participant/intake data is only offered to the AI provider
// after a BAA with zero data retention is signed. Flip in Vercel env.
const BAA_SIGNED = process.env.VS_AI_BAA_SIGNED === 'true'

export async function POST(request: Request) {
  // 1. Auth gate: any signed-in staff member with a pilot access role.
  //    What they can see is enforced by RLS on the scoped client below.
  const user = await getCurrentOperator()
  const role = user ? getAccessRole(user) : null
  if (!user || !role) {
    return NextResponse.json(
      { error: 'Your account does not have Intelligence access yet. Ask Carly to set your role.' },
      { status: 403 }
    )
  }

  // 2. Parse and validate body.
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = parseRequestBody(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const supabase = await createClient()
  const via = typeof (body as Record<string, unknown>).via === 'string' &&
    (body as Record<string, unknown>).via === 'voice' ? 'voice' : 'text'

  // Every question is logged to the append-only audit trail, with the
  // question as the AI saw it (stand-in tokens, no names or contact info).
  const audit = async (details: Record<string, unknown>) => {
    const { error } = await supabase.rpc('vs_log_event', {
      p_action: 'intelligence_query',
      p_table_name: 'intelligence',
      p_record_id: null,
      p_details: { via, role, ...details },
    })
    if (error) throw new Error(`audit log write failed: ${error.message}`)
  }

  let vault: PiiVault
  try {
    vault = new PiiVault(await loadKnownNames())
  } catch (err) {
    console.error('[intelligence/ask] could not load PII dictionary:', err)
    return NextResponse.json(
      { error: 'Intelligence is paused: the privacy filter could not load. Nothing was sent.' },
      { status: 503 }
    )
  }

  // 3. Simple "how many …?" questions: answered from SQL, no AI call.
  const countQ = parseCountQuestion(parsed.question)
  if (countQ) {
    try {
      const { answer, count } = await answerCountQuestion(supabase, countQ, {
        caseloadOnly: role === 'case_manager',
      })
      await audit({ mode: 'sql_count', question_redacted: vault.redact(parsed.question), count_query: countQ, result: count })
      return NextResponse.json({ answer, citations: [], tool_calls_made: 0, answered_by: 'sql' })
    } catch (err) {
      console.error('[intelligence/ask] count path failed, falling back to AI:', err)
    }
  }

  // 4. Run the orchestrator (all outbound text is tokenized). Log first:
  //    if the audit write fails, nothing goes to the AI provider.
  try {
    await audit({
      mode: 'ai',
      provider: 'anthropic',
      model: ANTHROPIC_MODEL,
      participant_tools_enabled: BAA_SIGNED,
      question_redacted: vault.redact(parsed.question),
    })
    const result = await ask(parsed.question, parsed.history, {
      vault,
      toolContext: { supabase, role, baaSigned: BAA_SIGNED },
    })
    return NextResponse.json({
      answer: result.answer,
      citations: result.citations,
      tool_calls_made: result.tool_calls_made,
      answered_by: 'ai',
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
