import { createHash } from 'node:crypto'
import { imageSpendConfigFromEnv, type ImageProvider, type VisionChecker } from '@yakini/ai'
import { isBuilderKit, lookFor } from '@yakini/kits'
import type { DraftStore } from '@/lib/server/store'
import { generateShots } from './imagery'
import { buildShotList } from './shot-list'

/**
 * Design D4: making the kit library. Only ever run by hand (scripts/generate-kit-library.ts):
 * never in CI, never on deploy, never from the app. It spends real money, so it refuses unless
 * images are switched on (flag and cap) and the person running it says --yes.
 */
export type LibraryGuard = { ok: true; kits: string[] } | { ok: false; reason: string }

const AUTOMATION_VARS = ['CI', 'GITHUB_ACTIONS', 'VERCEL', 'VERCEL_ENV', 'NOW_BUILDER', 'BUILD_ID'] as const

export function libraryGuard(env: Record<string, string | undefined>, argv: readonly string[], allKits: readonly string[]): LibraryGuard {
  const auto = AUTOMATION_VARS.find((k) => env[k])
  if (auto) return { ok: false, reason: `Refusing to run: ${auto} is set. The kit library is only made by hand, never in CI or on deploy.` }
  const spend = imageSpendConfigFromEnv(env)
  if (!spend.enabled) return { ok: false, reason: 'Refusing to run: images are switched off (AI_IMAGE_GENERATION_ENABLED is not 1).' }
  if (!(spend.imageDailyUsdCap > 0)) return { ok: false, reason: 'Refusing to run: no image budget (AI_IMAGE_DAILY_USD_CAP is not set above 0).' }
  if (!argv.includes('--yes')) return { ok: false, reason: 'Refusing to run without --yes (this spends real money).' }
  const named = argv.filter((a) => a.startsWith('--kit=')).map((a) => a.slice(6))
  const kits = argv.includes('--all') ? [...allKits] : named
  if (!kits.length) return { ok: false, reason: 'Name the kits: --kit=<id> (repeatable) or --all.' }
  const bad = kits.find((k) => !isBuilderKit(k))
  if (bad) return { ok: false, reason: `Unknown kit: ${bad}` }
  return { ok: true, kits }
}

export type LibraryRun = { kit: string; made: number; stopped: boolean }

/** Make one kit's library photos with the real providers; every image and check is priced and logged. */
export async function makeKitLibrary(kitId: string, deps: {
  store: Pick<DraftStore, 'kitLibrary' | 'saveKitLibraryImage' | 'imageUsdToday' | 'logAiRun'>
  provider: ImageProvider
  checker: VisionChecker
  env: Record<string, string | undefined>
}): Promise<LibraryRun> {
  const existing = await deps.store.kitLibrary(kitId)
  const shots = buildShotList({ kitId, preset: lookFor(kitId).preset })
  const outcomes = await generateShots(shots, {
    provider: deps.provider, checker: deps.checker,
    seen: existing.map((x) => x.dhash).filter((d): d is string => !!d),
    spend: {
      config: imageSpendConfigFromEnv(deps.env),
      todayUsd: () => deps.store.imageUsdToday(),
      record: (usd, kind) => deps.store.logAiRun({
        tenantId: null, siteId: null, kind, model: kind === 'image' ? deps.provider.model : deps.checker.model, promptVersion: 'd4-kit-library-1',
        inputTokens: 0, outputTokens: 0, latencyMs: 0, outcome: 'ok', toolCalls: 0, usd,
      }),
    },
  })
  let made = 0
  for (const o of outcomes) {
    const a = o.asset
    if (!a) continue
    await deps.store.saveKitLibraryImage({
      id: a.id, kitId, slot: a.slot, width: a.width, height: a.height, alt: a.alt, sha256: createHash('sha256').update(a.bytes).digest('hex'),
      lqip: a.variants.lqip, focus: a.variants.focus, dhash: a.dhash, qualityScore: a.quality.score, license: a.license,
      master: a.bytes, variants: a.variants.variants,
    })
    made++
  }
  return { kit: kitId, made, stopped: outcomes.some((o) => o.stopped === 'spend') }
}
