// VIZIONZ SANKOFA · Yakini Intelligence · Tool registry (Wave 3.4)
//
// LAYER 2 ARCHITECTURE: every new data source the operator wants Yakini
// Intelligence to read is added as one entry in TOOL_REGISTRY below. No
// other code changes. The orchestrator iterates over the registry and
// hands tool definitions to Anthropic; when Anthropic returns a tool_use
// block, executeTool() dispatches by name.
//
// Currently ships with two tools:
//   - search_documents: RAG over vs_document_chunks (Wave 3.3a substrate)
//   - query_intakes: structured query over intake_requests (Wave 2 substrate)
//
// Future tools to add as needed:
//   - query_donors (Wave 3.5)
//   - query_programs (Wave 3.6)
//   - query_media (Wave 1.5 photos/videos with captions)
//   - query_calendar (when calendar substrate exists)
// Each future tool is ~30-60 minutes of work and a single registry entry.

import { createAdminClient } from '@/lib/supabase/admin'
import { retrieveChunks, type RetrievedChunk } from './retrieve'

// ─── Citation type — surfaces to UI ──────────────────────────────────────

export type Citation = {
  source_type: 'document' | 'intake'
  // For document citations
  document_id?: string
  document_title?: string
  document_file_name?: string
  source_ref?: string | null
  chunk_index?: number
  similarity?: number
  // For intake citations
  intake_id?: string
  intake_label?: string  // e.g. "Smith family — housing request"
}

// ─── Tool result shape ───────────────────────────────────────────────────

export type ToolResult = {
  content: string         // what Anthropic sees
  citations: Citation[]   // what surfaces to UI
  ok: boolean
  error?: string
}

// ─── Anthropic tool definition shape ─────────────────────────────────────

export type AnthropicToolDefinition = {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

// ─── Tool registry ───────────────────────────────────────────────────────

type ToolHandler = (input: Record<string, unknown>) => Promise<ToolResult>

type ToolEntry = {
  definition: AnthropicToolDefinition
  handler: ToolHandler
}

const TOOL_REGISTRY: Record<string, ToolEntry> = {
  search_documents: {
    definition: {
      name: 'search_documents',
      description:
        'Search the organization\'s document library for information. Use this when ' +
        'the question is about the organization\'s history, mission, programs, policies, ' +
        'board minutes, grant applications, financials, narratives, or any other content ' +
        'that lives in uploaded documents. Returns the most relevant excerpts with source ' +
        'attribution. Always prefer this tool when the question could be answered from ' +
        'organizational documents.',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'A natural-language search query. Rephrase the user\'s question into ' +
              'specific keywords or concepts that would appear in relevant documents.',
          },
          k: {
            type: 'number',
            description: 'Number of top results to return. Defaults to 5.',
          },
        },
        required: ['query'],
      },
    },
    handler: searchDocuments,
  },

  query_intakes: {
    definition: {
      name: 'query_intakes',
      description:
        'Query the intake requests from families seeking help. Use this when the ' +
        'question is about who has requested services, intake volume, recent intakes, ' +
        'or patterns in family needs. Returns up to 20 matching intake records with ' +
        'summary information. Use this for questions like "how many families requested ' +
        'help this month?", "what kinds of needs are coming in?", or "any new intakes?".',
      input_schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description:
              'Optional filter by intake status. Common values: "new", "in_progress", ' +
              '"contacted", "completed", "archived". Omit to include all statuses.',
          },
          search: {
            type: 'string',
            description:
              'Optional keyword to search within intake content (name, request summary, ' +
              'needs). Case-insensitive partial match. Omit for no keyword filtering.',
          },
          since_days: {
            type: 'number',
            description:
              'Optional: only return intakes created in the last N days. Omit for all time.',
          },
        },
      },
    },
    handler: queryIntakes,
  },
}

// ─── Public interface ────────────────────────────────────────────────────

export function getToolDefinitions(): AnthropicToolDefinition[] {
  return Object.values(TOOL_REGISTRY).map((entry) => entry.definition)
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  const entry = TOOL_REGISTRY[name]
  if (!entry) {
    return {
      content: `Unknown tool: ${name}. Available tools: ${Object.keys(TOOL_REGISTRY).join(', ')}.`,
      citations: [],
      ok: false,
      error: 'unknown_tool',
    }
  }
  try {
    return await entry.handler(input)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      content: `Tool ${name} failed: ${message}`,
      citations: [],
      ok: false,
      error: message,
    }
  }
}

// ─── Tool handlers ───────────────────────────────────────────────────────

async function searchDocuments(input: Record<string, unknown>): Promise<ToolResult> {
  const query = typeof input.query === 'string' ? input.query : ''
  const k = typeof input.k === 'number' && input.k > 0 && input.k <= 20
    ? Math.floor(input.k)
    : 5

  if (!query.trim()) {
    return {
      content: 'search_documents was called with an empty query. Provide a search query.',
      citations: [],
      ok: false,
      error: 'empty_query',
    }
  }

  const chunks: RetrievedChunk[] = await retrieveChunks(query, k)

  if (chunks.length === 0) {
    return {
      content:
        'No relevant document excerpts found. The organization\'s document library may not ' +
        'yet contain information on this topic, or the documents may still be processing.',
      citations: [],
      ok: true,
    }
  }

  // Format chunks for Anthropic. Numbered list with source context inline
  // so the model can cite "[1]", "[2]" naturally in its answer.
  const formattedChunks = chunks
    .map((c, i) => {
      const sourceLine = c.source_ref
        ? `[${i + 1}] ${c.document_title} (${c.source_ref})`
        : `[${i + 1}] ${c.document_title}`
      return `${sourceLine}\n${c.content}`
    })
    .join('\n\n---\n\n')

  const citations: Citation[] = chunks.map((c) => ({
    source_type: 'document',
    document_id: c.document_id,
    document_title: c.document_title,
    document_file_name: c.document_file_name,
    source_ref: c.source_ref,
    chunk_index: c.chunk_index,
    similarity: c.similarity,
  }))

  return {
    content: formattedChunks,
    citations,
    ok: true,
  }
}

async function queryIntakes(input: Record<string, unknown>): Promise<ToolResult> {
  const status = typeof input.status === 'string' ? input.status : null
  const search = typeof input.search === 'string' ? input.search : null
  const sinceDays =
    typeof input.since_days === 'number' && input.since_days > 0
      ? Math.floor(input.since_days)
      : null

  const supabase = createAdminClient()
  let q = supabase
    .from('intake_requests')
    .select(
      'id, status, first_name, last_name, email, phone, request_summary, ' +
      'family_size, housing_status, requested_program, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(20)

  if (status) q = q.eq('status', status)
  if (sinceDays) {
    const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()
    q = q.gte('created_at', cutoff)
  }
  if (search) {
    // Case-insensitive search across name, summary, program.
    q = q.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,` +
      `request_summary.ilike.%${search}%,requested_program.ilike.%${search}%`
    )
  }

  const { data, error } = await q

  if (error) {
    return {
      content: `Intake query failed: ${error.message}`,
      citations: [],
      ok: false,
      error: error.message,
    }
  }

  if (!data || data.length === 0) {
    return {
      content:
        'No intake requests matched the filters. Try broadening the search ' +
        'or removing status/date filters.',
      citations: [],
      ok: true,
    }
  }

  // Format intakes for Anthropic. Each intake on a numbered row with
  // bounded fields. The model can reference rows by number in its answer.
  type IntakeRow = {
    id: string
    status: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    request_summary: string | null
    family_size: number | null
    housing_status: string | null
    requested_program: string | null
    created_at: string
  }
  const rows = data as unknown as IntakeRow[]
    const formatted = rows
    .map((r, i) => {
      const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unknown'
      const created = new Date(r.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      const lines = [
        `[${i + 1}] ${name} — Status: ${r.status} — Submitted: ${created}`,
      ]
      if (r.email) lines.push(`    Contact: ${r.email}${r.phone ? ', ' + r.phone : ''}`)
      if (r.family_size) lines.push(`    Family size: ${r.family_size}`)
      if (r.housing_status) lines.push(`    Housing status: ${r.housing_status}`)
      if (r.requested_program) lines.push(`    Requested program: ${r.requested_program}`)
      if (r.request_summary) lines.push(`    Summary: ${r.request_summary}`)
      return lines.join('\n')
    })
    .join('\n\n')

  const citations: Citation[] = rows.map((r) => {
    const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unknown'
    const summary = r.requested_program || r.housing_status || 'intake'
    return {
      source_type: 'intake',
      intake_id: r.id,
      intake_label: `${name} — ${summary}`,
    }
  })

  return {
    content:
      `Found ${rows.length} intake record${rows.length === 1 ? '' : 's'}:\n\n${formatted}`,
    citations,
    ok: true,
  }
}
