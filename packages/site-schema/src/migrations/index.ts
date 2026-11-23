/**
 * Ordered schema migrations (spec 7.4). Empty in Phase 0: version 1 is the first
 * shipped shape. A schema bump adds `v1_to_v2.ts` here as a PURE function
 * (no I/O, no clock, no randomness, no AI, input never mutated) plus fixtures in
 * fixtures/v2/ and tests.
 */
export type Migration = {
  from: number
  to: number
  /** Must not mutate `doc`. Returns a new object at version `to`. */
  up: (doc: Readonly<Record<string, unknown>>) => Record<string, unknown>
}

export const MIGRATIONS: readonly Migration[] = []
