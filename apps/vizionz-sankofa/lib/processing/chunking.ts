// VIZIONZ SANKOFA · Text chunking for embedding (Wave 3.3a)
//
// Splits extracted document text into chunks suitable for embedding via
// OpenAI text-embedding-3-small. Targets ~500 tokens per chunk with a
// ~50-token overlap between consecutive chunks for context continuity at
// retrieval time.
//
// All functions are pure — no I/O, no external services. Tested by direct
// invocation; safe to reason about in isolation.

import { get_encoding, type Tiktoken } from 'tiktoken'

// text-embedding-3-small uses cl100k_base encoding (same as GPT-4, GPT-3.5).
// We use this to measure token counts so chunks fit within the embedding
// model's per-input limit (8191 tokens) with room to spare.
const ENCODING_NAME = 'cl100k_base' as const

const DEFAULT_TARGET_TOKENS = 500
const DEFAULT_OVERLAP_TOKENS = 50

// ─── Token counting ───────────────────────────────────────────────────────

export function countTokens(text: string): number {
  if (!text) return 0
  const enc: Tiktoken = get_encoding(ENCODING_NAME)
  try {
    return enc.encode(text).length
  } finally {
    enc.free()
  }
}

// ─── Sentence splitting ───────────────────────────────────────────────────
//
// Regex-based splitter with abbreviation guards. Good enough for prose
// documents (grant applications, board minutes, narratives). Will not
// handle pathological cases (decorative ellipses inside sentences, etc.)
// but those are rare in operator-uploaded org documents.

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr',
  'inc', 'ltd', 'llc', 'co', 'corp',
  'etc', 'vs', 'eg', 'ie', 'cf',
  'us', 'usa', 'uk', 'eu',
  'st', 'ave', 'blvd', 'rd',
  'no', 'vol', 'pp', 'fig',
])

export function splitIntoSentences(text: string): string[] {
  if (!text) return []

  // Normalize whitespace: collapse runs, preserve single newlines as
  // paragraph hints (treated as sentence terminators).
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n\n')
    .trim()

  if (!normalized) return []

  // Split on sentence-ending punctuation followed by whitespace, but only
  // commit the split if the word before the punctuation is not a known
  // abbreviation and not a decimal number.
  const sentences: string[] = []
  let current = ''
  const chars = Array.from(normalized)

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    current += ch

    if (ch === '.' || ch === '!' || ch === '?') {
      const next = chars[i + 1] ?? ''
      const next2 = chars[i + 2] ?? ''

      // End of input
      if (!next) {
        sentences.push(current.trim())
        current = ''
        continue
      }

      // Punctuation followed by whitespace + capital letter / digit / newline
      // → likely sentence boundary, unless preceded by abbreviation/decimal.
      const isFollowedByBoundary =
        /\s/.test(next) && (/[A-Z0-9"'(]/.test(next2) || next === '\n')

      if (!isFollowedByBoundary) continue

      // Check the word right before this punctuation.
      const trimmedSoFar = current.slice(0, -1).trimEnd()
      const lastWordMatch = /[A-Za-z0-9]+$/.exec(trimmedSoFar)
      const lastWord = (lastWordMatch?.[0] ?? '').toLowerCase()

      // Decimal number: previous char is a digit, next non-space is a digit
      // (e.g., "3.14"). Don't split.
      const prevChar = trimmedSoFar.slice(-1)
      const nextNonSpace = chars.slice(i + 1).find((c) => !/\s/.test(c)) ?? ''
      if (/[0-9]/.test(prevChar) && /[0-9]/.test(nextNonSpace)) {
        continue
      }

      // Abbreviation: don't split.
      if (ABBREVIATIONS.has(lastWord)) continue

      // Genuine sentence boundary.
      sentences.push(current.trim())
      current = ''
    }
  }

  // Tail: any remaining text without a terminator becomes its own sentence.
  if (current.trim()) {
    sentences.push(current.trim())
  }

  return sentences.filter((s) => s.length > 0)
}

// ─── Chunking by sentence boundary ────────────────────────────────────────

export type ChunkingResult = {
  chunks: string[]
  totalTokens: number
}

export function chunkBySentences(
  text: string,
  options: {
    targetTokens?: number
    overlapTokens?: number
  } = {}
): ChunkingResult {
  const targetTokens = options.targetTokens ?? DEFAULT_TARGET_TOKENS
  const overlapTokens = options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS

  if (!text || !text.trim()) {
    return { chunks: [], totalTokens: 0 }
  }

  const sentences = splitIntoSentences(text)
  if (sentences.length === 0) {
    return { chunks: [], totalTokens: 0 }
  }

  // Encode once for the whole document to get totalTokens efficiently.
  // Per-buffer token counts use a single shared encoder we'll free at the end.
  const enc: Tiktoken = get_encoding(ENCODING_NAME)
  try {
    const totalTokens = enc.encode(text).length

    const chunks: string[] = []
    let bufferSentences: string[] = []
    let bufferTokens = 0

    const countBufferTokens = (parts: string[]): number =>
      enc.encode(parts.join(' ')).length

    for (const sentence of sentences) {
      const sentenceTokens = enc.encode(sentence).length

      // Edge case: a single sentence exceeds targetTokens. Emit any pending
      // buffer as its own chunk, then emit the oversized sentence as its own
      // chunk (we don't sub-split — that's a future-wave concern; OpenAI's
      // 8191 token limit is still well above our 500 target, so this won't
      // exceed model limits unless the sentence is genuinely huge).
      if (sentenceTokens > targetTokens) {
        if (bufferSentences.length > 0) {
          chunks.push(bufferSentences.join(' '))
          bufferSentences = []
          bufferTokens = 0
        }
        chunks.push(sentence)
        continue
      }

      // If adding this sentence would exceed the target, close the current
      // chunk and seed the next one with overlap.
      if (bufferTokens + sentenceTokens > targetTokens && bufferSentences.length > 0) {
        chunks.push(bufferSentences.join(' '))

        // Build overlap seed: rewind from the end of the just-closed chunk,
        // accumulating sentences until we have ~overlapTokens worth.
        const overlap: string[] = []
        let overlapAccumulated = 0
        for (let i = bufferSentences.length - 1; i >= 0; i--) {
          const s = bufferSentences[i]
          const t = enc.encode(s).length
          if (overlapAccumulated + t > overlapTokens && overlap.length > 0) break
          overlap.unshift(s)
          overlapAccumulated += t
        }

        bufferSentences = [...overlap]
        bufferTokens = overlapAccumulated
      }

      bufferSentences.push(sentence)
      bufferTokens += sentenceTokens
    }

    // Flush remaining buffer.
    if (bufferSentences.length > 0) {
      chunks.push(bufferSentences.join(' '))
    }

    return {
      chunks,
      totalTokens,
    }
  } finally {
    enc.free()
  }
}
