/**
 * Design D4: makes the kit library photos. RUN BY HAND ONLY: never in CI, on deploy or from the app.
 *
 * It spends real money, so it refuses unless images are switched on (AI_IMAGE_GENERATION_ENABLED=1
 * and AI_IMAGE_DAILY_USD_CAP above 0, inside AI_GLOBAL_DAILY_USD_CAP), the xAI key is set, and you
 * pass --yes. It also refuses when CI or Vercel build variables are present. Spend counts toward
 * the same daily image cap the app uses and stops (falls back) when it is reached.
 *
 * From apps/builder, with the database and key in your shell:
 *   npx tsx --conditions=react-server --tsconfig tsconfig.json scripts/generate-kit-library.ts --kit=restaurant --yes
 *   npx tsx --conditions=react-server --tsconfig tsconfig.json scripts/generate-kit-library.ts --all --yes
 *
 * Photos go to the site-assets bucket under kit-library/<kit>/ and rows into builder.kit_library_images.
 * New drafts copy the ones they use into their own tenant. Retire a photo by setting retired_at.
 */
import { createClient } from '@supabase/supabase-js'
import { BUILDER_KIT_IDS } from '@yakini/kits'
import { libraryGuard, makeKitLibrary } from '../lib/pipeline/kit-library'
import { realImageProviders } from '../lib/server/ai'
import { createSupabaseStore } from '../lib/server/store'

async function main(): Promise<number> {
  const guard = libraryGuard(process.env, process.argv.slice(2), BUILDER_KIT_IDS)
  if (!guard.ok) { console.error(guard.reason); return 2 }
  const providers = realImageProviders()
  if (!providers) { console.error('Refusing to run: the image provider is not configured (XAI_API_KEY).'); return 2 }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) { console.error('Refusing to run: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed.'); return 2 }
  const store = createSupabaseStore(createClient(url, key, { db: { schema: 'builder' }, auth: { persistSession: false, autoRefreshToken: false } }))
  for (const kit of guard.kits) {
    const r = await makeKitLibrary(kit, { store, ...providers, env: process.env })
    console.log(`${kit}: ${r.made} photo(s) added${r.stopped ? ' (stopped at the daily image budget)' : ''}`)
    if (r.stopped) break
  }
  return 0
}

main().then((code) => { process.exitCode = code }, (e: unknown) => { console.error(e instanceof Error ? e.message : 'Failed'); process.exitCode = 1 })
