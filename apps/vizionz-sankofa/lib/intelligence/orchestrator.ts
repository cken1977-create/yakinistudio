// VIZIONZ SANKOFA · Yakini Intelligence · Orchestrator (Wave 3.4 + pilot protection)
//
// The tool-use loop. Receives a user question + conversation history,
// orchestrates Anthropic's tool-use API to retrieve grounded data via
// the tool registry, and returns the final answer with accumulated
// source citations.
//
// PILOT PROTECTION: nothing reaches Anthropic un-redacted. The question,
// the history and every tool result pass through a PiiVault, which swaps
// names, emails, phones, addresses and IDs for stand-in tokens. Tool
// inputs are swapped back before they hit the database (except tools that
// forward input to another provider). The final answer is swapped back
// before it is returned for display.
//
// LAYER 2 ARCHITECTURE: this file does not know about specific tools.
// All tool knowledge is in tools.ts.

import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from './prompt'
import {
  getToolDefinitions,
  executeTool as defaultExecuteTool,
  toolRestoresInputs,
  type Citation,
  type ToolContext,
  type ToolResult,
} from './tools'
import { PiiVault } from './pii'

// ─── Configuration ───────────────────────────────────────────────────────

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6' as const
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
  tool_names: string[]
  /** The question exactly as the AI provider saw it (tokens, no PII). */
  redacted_question: string
}

/** The subset of the Anthropic client we use; lets tests inject a fake. */
export type MessagesClient = {
  messages: { create: (params: Anthropic.MessageCreateParamsNonStreaming) => Promise<Anthropic.Message> }
}

export type AskOptions = {
  vault: PiiVault
  toolContext: ToolContext
  client?: MessagesClient
  executeTool?: (name: string, input: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>
  /** Called with every payload just before it is sent to the provider. */
  onOutbound?: (payload: Anthropic.MessageCreateParamsNonStreaming) => void
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

export async function ask(
  question: string,
  history: ConversationTurn[],
  opts: AskOptions
): Promise<OrchestratorResult> {
  const { vault, toolContext } = opts
  const client = opts.client ?? getClient()
  const runTool = opts.executeTool ?? defaultExecuteTool
  const systemPrompt = buildSystemPrompt()
  const toolDefinitions = getToolDefinitions(toolContext)

  const send = async (params: Anthropic.MessageCreateParamsNonStreaming) => {
    opts.onOutbound?.(params)
    return client.messages.create(params)
  }

  const redactedQuestion = vault.redact(question)
  const messages: Anthropic.MessageParam[] = [
    ...history.map((turn): Anthropic.MessageParam => ({
      role: turn.role,
      content: vault.redact(turn.content),
    })),
    { role: 'user', content: redactedQuestion },
  ]

  const allCitations: Citation[] = []
  const toolNames: string[] = []
  let toolCallsMade = 0

  const finish = (content: Anthropic.ContentBlock[], fallback: string): OrchestratorResult => ({
    answer: vault.restore(extractTextFromContent(content) || fallback),
    citations: dedupeCitations(allCitations),
    tool_calls_made: toolCallsMade,
    tool_names: toolNames,
    redacted_question: redactedQuestion,
  })

  for (let iteration = 0; iteration < MAX_TOOL_USE_TURNS; iteration++) {
    const response = await send({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS_PER_RESPONSE,
      system: systemPrompt,
      tools: toolDefinitions as Anthropic.Tool[],
      messages,
    })

    if (response.stop_reason === 'end_turn' || response.stop_reason === 'max_tokens') {
      return finish(response.content, '')
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      )
      if (toolUseBlocks.length === 0) {
        return finish(response.content, 'No response generated.')
      }

      toolCallsMade += toolUseBlocks.length

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          toolNames.push(block.name)
          const rawInput = block.input as Record<string, unknown>
          const input = toolRestoresInputs(block.name) ? vault.restoreDeep(rawInput) : rawInput
          const result = await runTool(block.name, input, toolContext)
          allCitations.push(...result.citations)
          return {
            type: 'tool_result' as const,
            tool_use_id: block.id,
            // Redact BEFORE the result goes back to the provider.
            content: vault.redact(result.content),
            is_error: !result.ok,
          }
        })
      )

      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })
      continue
    }

    return finish(response.content, 'Yakini Intelligence did not produce an answer.')
  }

  const finalResponse = await send({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS_PER_RESPONSE,
    system:
      systemPrompt +
      '\n\nIMPORTANT: You have reached the maximum number of tool calls. ' +
      'Answer the user with what you have learned so far. Do not call any more tools.',
    messages,
  })

  return finish(
    finalResponse.content,
    'I had to stop after several lookups. Please ask a more specific question.'
  )
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
    const key =
      c.source_type === 'document'
        ? `doc:${c.document_id}:${c.chunk_index ?? 'na'}`
        : c.source_type === 'participant'
          ? `participant:${c.participant_id}`
          : c.source_type === 'donor'
            ? `donor:${c.donor_id}`
            : `intake:${c.intake_id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}
