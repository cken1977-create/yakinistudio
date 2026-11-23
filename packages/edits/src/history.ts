import type { EditOp } from './ops'

/**
 * In-session undo/redo (spec 10.5): a stack of up to 50 changes. Each entry keeps the ops as
 * applied and the ops that reverse them, so undo and redo are exact and can be saved like any
 * other change.
 */
export type HistoryEntry = { applied: EditOp[]; inverse: EditOp[]; label: string }
export type History = { past: HistoryEntry[]; future: HistoryEntry[] }

export const HISTORY_DEPTH = 50
export const emptyHistory = (): History => ({ past: [], future: [] })

export function record(h: History, e: HistoryEntry): History {
  return { past: [...h.past, e].slice(-HISTORY_DEPTH), future: [] }
}

/** The entry to undo (apply its `inverse`), and the history after undoing it. */
export function undo(h: History): { entry: HistoryEntry; next: History } | null {
  const entry = h.past[h.past.length - 1]
  return entry ? { entry, next: { past: h.past.slice(0, -1), future: [entry, ...h.future] } } : null
}

/** The entry to redo (apply its `applied` again), and the history after redoing it. */
export function redo(h: History): { entry: HistoryEntry; next: History } | null {
  const entry = h.future[0]
  return entry ? { entry, next: { past: [...h.past, entry].slice(-HISTORY_DEPTH), future: h.future.slice(1) } } : null
}
