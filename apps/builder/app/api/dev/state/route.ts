import { z } from 'zod'
import { testUserId } from '@/lib/server/auth'
import { testOutbox } from '@/lib/server/mail'
import type { MemPublishState } from '@/lib/server/publish-store'
import { getRuntime, isTestMode } from '@/lib/server/runtime'

/**
 * Test mode only (BUILDER_TEST_MODE=1, refused on Vercel): set up what browser tests need that
 * later phases own (a paid plan is Phase 4 billing), and read the internal alerts that were
 * "sent". Anywhere else: 404.
 */
export const dynamic = 'force-dynamic'

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('plan'), siteId: z.uuid(), plan: z.boolean() }),
  z.object({ action: z.literal('operator'), email: z.email(), canOverridePublish: z.boolean(), canTakedown: z.boolean() }),
  z.object({ action: z.literal('indexable'), siteId: z.uuid(), indexable: z.boolean() }),
])

type Mem = { _state: { operators: Set<string>; sites: Map<string, { tenantId: string }> }; _p3: MemPublishState }

export async function POST(request: Request): Promise<Response> {
  if (!isTestMode()) return new Response('Not found', { status: 404 })
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new Response('Bad request', { status: 400 })
  const mem = getRuntime().store as unknown as Mem
  const b = parsed.data
  if (b.action === 'plan') {
    const site = mem._state.sites.get(b.siteId)
    if (!site) return new Response('Unknown site', { status: 404 })
    mem._p3.tenantPlan.set(site.tenantId, b.plan)
  } else if (b.action === 'operator') {
    const id = testUserId(b.email)
    mem._state.operators.add(id)
    mem._p3.operators.set(id, { canOverridePublish: b.canOverridePublish, canTakedown: b.canTakedown })
  } else {
    const m = mem._p3.site.get(b.siteId)
    if (!m) return new Response('Unknown site', { status: 404 })
    m.indexable = b.indexable
  }
  return Response.json({ ok: true })
}

export async function GET(): Promise<Response> {
  if (!isTestMode()) return new Response('Not found', { status: 404 })
  return Response.json({ outbox: testOutbox() })
}
