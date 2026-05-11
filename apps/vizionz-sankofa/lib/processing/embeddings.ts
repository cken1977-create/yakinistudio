// VIZIONZ SANKOFA · Embedding generation via OpenAI (Wave 3.3a)
//
// Wraps OpenAI's text-embedding-3-small model. Embedding vectors are 1536
// dimensions, matching the vs_document_chunks.embedding column (vector(1536))
// configured in the Wave 3.1 migration with an HNSW cosine-similarity index.
//
// Used only from server-side pipeline code. The OpenAI client reads
// OPENAI_API_KEY from process.env at construction time.

import OpenAI from 'openai'

const EMBEDDING_MODEL = 'text-embedding-3-small' as const
const EMBEDDING_DIMENSIONS = 1536
const MAX_INPUTS_PER_CALL = 2048
const RETRY_DELAY_MS = 2000

let cachedClient: OpenAI | null = null

function getClient(): OpenAI {
  if (cachedClient) return cachedClient
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'embedChunks: OPENAI_API_KEY is not set. ' +
      'Check Vercel environment variables.'
    )
  }
  cachedClient = new OpenAI({ apiKey })
  return cachedClient
}

/**
 * Embed an array of text chunks via OpenAI text-embedding-3-small.
 *
 * Returns a Promise<number[][]> where result[i] is the 1536-dim embedding
 * for chunks[i]. Alignment is guaranteed even if OpenAI returns embeddings
 * out of order (defensive sort by `.index`).
 *
 * Handles inputs longer than MAX_INPUTS_PER_CALL by batching internally.
 * Retries each batch once on transient failure before throwing.
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  if (chunks.length === 0) return []

  const client = getClient()
  const allEmbeddings: number[][] = []

  for (let start = 0; start < chunks.length; start += MAX_INPUTS_PER_CALL) {
    const batch = chunks.slice(start, start + MAX_INPUTS_PER_CALL)
    const batchEmbeddings = await embedBatchWithRetry(client, batch)
    allEmbeddings.push(...batchEmbeddings)
  }

  return allEmbeddings
}

async function embedBatchWithRetry(
  client: OpenAI,
  batch: string[]
): Promise<number[][]> {
  try {
    return await embedBatch(client, batch)
  } catch (err) {
    // Single retry after delay. Most OpenAI transient errors clear within
    // a couple of seconds; if the second attempt also fails, we let the
    // error propagate so pipeline.ts can mark the document as error.
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    return await embedBatch(client, batch)
  }
}

async function embedBatch(
  client: OpenAI,
  batch: string[]
): Promise<number[][]> {
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: batch,
  })

  // Sort defensively by index so result[i] aligns with batch[i] regardless
  // of API ordering. OpenAI's documented contract preserves order, but
  // explicit alignment costs nothing and guards against future surprises.
  const sorted = [...response.data].sort((a, b) => a.index - b.index)

  const embeddings = sorted.map((d) => d.embedding)

  // Sanity check: every embedding should be EMBEDDING_DIMENSIONS long.
  // A mismatch would mean OpenAI returned a different model than requested
  // (which would also cause INSERT into vector(1536) to fail downstream).
  for (let i = 0; i < embeddings.length; i++) {
    if (embeddings[i].length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `embedChunks: unexpected embedding dimension ` +
        `${embeddings[i].length} for chunk ${i}, expected ${EMBEDDING_DIMENSIONS}. ` +
        `Model used: ${response.model}`
      )
    }
  }

  return embeddings
}
