// VIZIONZ SANKOFA · Yakini Intelligence · Document retrieval (Wave 3.4)
//
// Given a natural-language query, returns the top-k most semantically
// similar chunks from vs_document_chunks via pgvector cosine similarity.
// Each result carries parent document metadata so Wave 3.4's orchestrator
// can construct source citations without additional round-trips.
//
// Used by the search_documents tool in lib/intelligence/tools.ts.

import { createAdminClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'

const EMBEDDING_MODEL = 'text-embedding-3-small' as const
const DEFAULT_K = 5

let cachedOpenAI: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (cachedOpenAI) return cachedOpenAI
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'retrieve.ts: OPENAI_API_KEY is not set. Check Vercel environment variables.'
    )
  }
  cachedOpenAI = new OpenAI({ apiKey })
  return cachedOpenAI
}

export type RetrievedChunk = {
  chunk_id: string
  document_id: string
  chunk_index: number
  content: string
  token_count: number
  source_ref: string | null
  similarity: number
  document_title: string
  document_file_name: string
}

/**
 * Embed a natural-language query and retrieve the top-k most similar chunks
 * from vs_document_chunks. Only chunks belonging to documents in 'ready'
 * processing status are considered (enforced by the SQL function).
 */
export async function retrieveChunks(
  query: string,
  k: number = DEFAULT_K
): Promise<RetrievedChunk[]> {
  if (!query.trim()) return []

  // 1. Embed the query via the same model used for chunk embedding.
  //    Symmetry is required for cosine similarity to be meaningful.
  const openai = getOpenAI()
  const embeddingResponse = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  })

  const queryEmbedding = embeddingResponse.data[0]?.embedding
  if (!queryEmbedding || queryEmbedding.length !== 1536) {
    throw new Error(
      `retrieveChunks: query embedding has unexpected dimension ${queryEmbedding?.length ?? 'undefined'}, expected 1536.`
    )
  }

  // 2. Call the match_document_chunks Postgres function via RPC.
  //    Uses the HNSW cosine index from Wave 3.1.
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_count: k,
  })

  if (error) {
    throw new Error(
      `retrieveChunks: RPC failed: ${error.message}. ` +
      `Confirm the match_document_chunks function exists in Supabase.`
    )
  }

  return (data ?? []) as RetrievedChunk[]
}
