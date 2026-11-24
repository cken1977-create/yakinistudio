import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_DEPS, type SafeFetchDeps } from '@yakini/brand/safe-fetch'
import type { GenerateChat } from '@/lib/pipeline/generate'
import { mockChat, mockFetchDeps } from '@/lib/pipeline/test-mode'
import { runAi } from './ai'
import { serverEnv } from './env'
import type { PublishStore } from './publish-store'
import { createMemoryStore, createSupabaseStore, type DraftStore, type EditorStore } from './store'

/**
 * Wires the draft flow to real services, or to in-memory fakes in test mode.
 *
 * Test mode (`BUILDER_TEST_MODE=1`) exists for unit tests and the CI end-to-end run. It is refused
 * on any Vercel deployment, whatever the env says, so it can never be switched on in production.
 */
export type Runtime = {
  testMode: boolean
  store: DraftStore & EditorStore & PublishStore
  fetchDeps: SafeFetchDeps
  chat: GenerateChat
  draftPepper: string
  ipPepper: string
  demoOrigin: string
}

export class ConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing configuration: ${missing.join(', ')}`)
    this.name = 'ConfigError'
  }
}

export function isTestMode(): boolean {
  return process.env.BUILDER_TEST_MODE === '1' && !process.env.VERCEL && !process.env.VERCEL_ENV
}

// Test-mode peppers are fixed so tests are repeatable; they guard nothing real.
const TEST_PEPPER = 'test-mode-pepper-not-a-secret-0001'

// Route handlers and pages are separate bundles; keep one test-mode store per server process.
const shared = globalThis as typeof globalThis & { __yakiniMemoryStore?: DraftStore & EditorStore & PublishStore }
let real: Runtime | null = null

export function getRuntime(): Runtime {
  if (isTestMode()) {
    const memory = (shared.__yakiniMemoryStore ??= createMemoryStore())
    return {
      testMode: true, store: memory, fetchDeps: mockFetchDeps(), chat: mockChat,
      draftPepper: TEST_PEPPER, ipPepper: TEST_PEPPER, demoOrigin: process.env.DEMO_ORIGIN || 'https://yakini.digital',
    }
  }
  if (real) return real
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = serverEnv('SUPABASE_SERVICE_ROLE_KEY')
  const draftPepper = serverEnv('DRAFT_TOKEN_PEPPER')
  const ipPepper = serverEnv('IP_HASH_PEPPER')
  const missing = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL', !key && 'SUPABASE_SERVICE_ROLE_KEY',
    !draftPepper && 'DRAFT_TOKEN_PEPPER', !ipPepper && 'IP_HASH_PEPPER',
  ].filter(Boolean) as string[]
  if (missing.length) throw new ConfigError(missing)
  const db = createClient(url!, key!, { db: { schema: 'builder' }, auth: { persistSession: false, autoRefreshToken: false } })
  const store = createSupabaseStore(db)
  real = {
    testMode: false, store, fetchDeps: DEFAULT_DEPS, chat: realChat(store),
    draftPepper: draftPepper!, ipPepper: ipPepper!, demoOrigin: serverEnv('DEMO_ORIGIN') || 'https://yakini.digital',
  }
  return real
}

/** Worst case for one generate attempt, checked against the global daily cap before calling. */
const GENERATE_WORST_CASE = { inputTokens: 24_000, outputTokens: 12_000 }

function realChat(store: DraftStore): GenerateChat {
  return async (opts) => {
    let today: { inputTokens: number; outputTokens: number }
    try { today = await store.aiUsageToday() } catch { return { skipped: 'bad_usage' } } // fail closed
    const r = await runAi(opts, today, GENERATE_WORST_CASE) // the only place the AI key is read
    return r.ok ? r.result : { skipped: r.reason }
  }
}
