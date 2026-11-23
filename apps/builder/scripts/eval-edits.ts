/**
 * Manual eval of the real model on the 20 chat-edit requests (spec 16.5). Target: 18 of 20.
 * Not run in CI and never on Vercel. Needs XAI_API_KEY in your shell; nothing is stored.
 *
 *   XAI_API_KEY=... npm run eval -w builder
 */
import { EDIT_CASES, strayChanges } from '@yakini/ai/evals/edit-cases'
import type { Usage } from '@yakini/ai'
import { brandFor, buildKitDraft, kitDefinition } from '@yakini/kits'
import { loadSiteDoc } from '@yakini/site-schema'
import { runChatEdit } from '@/lib/chat/edit'
import type { GenerateChat } from '@/lib/pipeline/generate'
import { runAi } from '@/lib/server/ai'

async function main() {
  if (!process.env.XAI_API_KEY) { console.error('Set XAI_API_KEY in your shell to run the eval.'); process.exit(2) }
  if (process.env.VERCEL || process.env.VERCEL_ENV) { console.error('The eval does not run on Vercel.'); process.exit(2) }
  const used: Usage = { inputTokens: 0, outputTokens: 0 }
  const chat: GenerateChat = async (opts) => {
    const r = await runAi(opts, used, { inputTokens: 12_000, outputTokens: 2_500 })
    if (!r.ok) return { skipped: r.reason }
    used.inputTokens += r.result.usage.inputTokens
    used.outputTokens += r.result.usage.outputTokens
    return r.result
  }
  const kit = kitDefinition('food-truck')!
  const ctx = { allowedAssetIds: new Set(kit.sampleImages.map((s) => s.assetId)) }
  let passed = 0
  for (const c of EDIT_CASES) {
    const doc = loadSiteDoc(buildKitDraft(kit, { name: 'Mesa Street Tacos', city: 'Austin' }, brandFor(kit, { colors: { primary: '#9A3412', secondary: '#15130F', accent: '#F59E0B' } }))).doc
    const r = await runChatEdit({ doc, request: c.request, selected: c.selected ?? null, pageId: c.selected?.pageId ?? null, history: [], ctx, chat })
    const want = c.kind === 'change' ? 'proposal' : c.kind
    let problem = r.kind === want || (c.kind === 'question' && r.kind === 'reply') ? null : `expected ${want}, got ${r.kind}`
    if (!problem && r.kind === 'proposal') {
      problem = c.check!(doc, r.doc)
      const stray = strayChanges(doc, r.doc, c.allowed!(doc))
      if (!problem && stray.length) problem = `also changed ${stray.slice(0, 3).join(', ')}`
    }
    if (!problem) passed++
    console.log(`${problem ? 'FAIL' : 'ok  '} ${c.id.padEnd(22)} ${problem ?? ''}`)
  }
  console.log(`\n${passed}/${EDIT_CASES.length} correct (target 18). Tokens: ${used.inputTokens} in, ${used.outputTokens} out.`)
  process.exit(passed >= 18 ? 0 : 1)
}

void main()
