// VIZIONZ SANKOFA · Yakini Intelligence · Orchestrator (Wave 3.4)
//
// The tool-use loop. Receives a user question + conversation history,
// orchestrates Anthropic's tool-use API to retrieve grounded data via
// the tool registry, and returns the final answer with accumulated
// source citations.
//
// LAYER 2 ARCHITECTURE: this file does not know about specific tools.
// All tool knowledge is in tools.ts. To add a new data source, edit
// tools.ts only — this orchestrator picks up new tools automatically
// via getToolDefinitions() and routes to them via executeTool(name, input).

import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from './prompt'
import {
  getToolDefinitions,
  executeTool,
  type Citation,
} from './tools'

// ─── Configuration ───────────────────────────────────────────────────────

const ANTHROPIC_MODEL = 'claude-sonnet-4-6' as const
const MAX_TOOL_USE_TURNS = 5
const MAX_TOKENS_PER_RESPONSE = 2048

// ─── Types ───────────────────────────────────────────────────────────────

export type ConversationTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type OrchestratorResult = {
  answer: string
  citations: Citation[]
  tool_calls_made: number
}

// ─── Anthropic client (singleton) ────────────────────────────────────────

let cachedClient: Anthropic | null = null

function getClient(): Anthropic {
  if (cachedClient) return cachedClient
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'orchestrator.ts: ANTHROPIC_API_KEY is not set. Check Vercel environment variables.'
    )
  }
  cachedClient = new Anthropic({ apiKey })
  return cachedClient
}

// ─── Public entry point ──────────────────────────────────────────────────

/**
 * Run the tool-use loop for a single user question. Returns the final
 * grounded answer plus all source citations accumulated across tool calls.
 *
 * @param question - the operator's current question (latest user turn)
 * @param history  - prior conversation turns (user/assistant pairs), oldest first
 */
export async function ask(
  question: string,
  history: ConversationTurn[] = []
): Promise<OrchestratorResult> {
  const client = getClient()
  const systemPrompt = buildSystemPrompt()
  const toolDefinitions = getToolDefinitions()

  // Build the message array. History first, then the new user question.
  // We don't include any internal "intermediate" turns from prior conversations —
  // each new top-level user turn starts a fresh tool-use loop.
  const messages: Anthropic.MessageParam[] = [
    ...history.map((turn): Anthropic.MessageParam => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: 'user',
      content: question,
    },
  ]

  // Accumulators across the tool-use loop.
  const allCitations: Citation[] = []
  let toolCallsMade = 0

  for (let iteration = 0; iteration < MAX_TOOL_USE_TURNS; iteration++) {
    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS_PER_RESPONSE,
      system: systemPrompt,
      tools: toolDefinitions as Anthropic.Tool[],
      messages,
    })

    // If the model is done, extract text and return.
    if (response.stop_reason === 'end_turn' || response.stop_reason === 'max_tokens') {
      const answer = extractTextFromContent(response.content)
      return {
        answer,
        citations: dedupeCitations(allCitations),
        tool_calls_made: toolCallsMade,
      }
    }

    // If the model wants to use tools, run them in parallel and feed
    // results back as the next user turn.
    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlocks.length === 0) {
        // Defensive: stop_reason=tool_use but no tool_use blocks. Treat as end.
        const answer = extractTextFromContent(response.content)
        return {
          answer: answer || 'No response generated.',
          citations: dedupeCitations(allCitations),
          tool_calls_made: toolCallsMade,
        }
      }

      toolCallsMade += toolUseBlocks.length

      // Execute all tool calls concurrently.
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>
          )
          allCitations.push(...result.citations)
          return {
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: result.content,
            is_error: !result.ok,
          }
        })
      )

      // Push the assistant's tool_use response and our tool_result reply
      // into the conversation. The loop continues with the new context.
      messages.push({
        role: 'assistant',
        content: response.content,
      })
      messages.push({
        role: 'user',
        content: toolResults,
      })

      continue
    }

    // Unknown stop_reason (stop_sequence, refusal, etc). Bail with what we have.
    const answer = extractTextFromContent(response.content)
    return {
      answer: answer || 'Yakini Intelligence did not produce an answer.',
      citations: dedupeCitations(allCitations),
      tool_calls_made: toolCallsMade,
    }
  }

  // Hit MAX_TOOL_USE_TURNS without an end_turn. Make one final request
  // forcing a text answer (no tools) so the user gets something coherent.
  const finalResponse = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS_PER_RESPONSE,
    system: systemPrompt +
      '\n\nIMPORTANT: You have reached the maximum number of tool calls. ' +
      'Answer the user with what you have learned so far. Do not call any more tools.',
    messages,
  })

  return {
    answer: extractTextFromContent(finalResponse.content) ||
      'I had to stop after several lookups. Please ask a more specific question.',
    citations: dedupeCitations(allCitations),
    tool_calls_made: toolCallsMade,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function extractTextFromContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n\n')
    .trim()
}

function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>()
  const out: Citation[] = []
  for (const c of citations) {
    // Dedupe key by source identity. For documents: document_id + chunk_index.
    // For intakes: intake_id.
    const key =
      c.source_type === 'document'
        ? `doc:${c.document_id}:${c.chunk_index ?? 'na'}`
        : `intake:${c.intake_id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}
