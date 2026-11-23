import { looksLikeInjection } from './knowledge'

export const MAX_MESSAGE = 500
export const MAX_HISTORY = 8

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

export function cutMessage(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_MESSAGE)
}

export function sanitizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return []
  const out: ChatTurn[] = []
  for (const item of raw.slice(-MAX_HISTORY)) {
    if (!item || (item.role !== 'user' && item.role !== 'assistant')) continue
    const content = cutMessage(item.content)
    if (content) out.push({ role: item.role, content })
  }
  return out
}

export function blocked(text: string): boolean {
  return looksLikeInjection(text)
}
