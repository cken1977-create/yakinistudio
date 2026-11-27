/**
 * Ordered schema migrations (spec 7.4). v1 → v2 adds the design `style` (classic for every v1
 * doc). Each schema bump adds a `vN_to_vN+1.ts` here as a PURE function
 * (no I/O, no clock, no randomness, no AI, input never mutated) plus fixtures in
 * fixtures/v2/ and tests.
 */
export type Migration = {
  from: number
  to: number
  /** Must not mutate `doc`. Returns a new object at version `to`. */
  up: (doc: Readonly<Record<string, unknown>>) => Record<string, unknown>
}

import { v1ToV2 } from './v1_to_v2'

export const MIGRATIONS: readonly Migration[] = [v1ToV2]
