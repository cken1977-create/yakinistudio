import { z } from 'zod'
import { getRuntime, isTestMode } from '@/lib/server/runtime'
import { fakeDomains } from '@/lib/server/vercel-domains'

/** Test mode only: play the part of DNS for the stand-in Vercel (a name gets "pointed" or "verified"). Anywhere else: 404. */
export const dynamic = 'force-dynamic'

const Body = z.object({ name: z.string().min(3).max(253), pointed: z.boolean().optional(), verified: z.boolean().optional() })

export async function POST(request: Request): Promise<Response> {
  if (!isTestMode()) return new Response('Not found', { status: 404 })
  getRuntime()
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new Response('Bad request', { status: 400 })
  const d = fakeDomains().get(parsed.data.name.toLowerCase())
  if (!d) return new Response('Unknown name', { status: 404 })
  if (parsed.data.pointed !== undefined) d.pointed = parsed.data.pointed
  if (parsed.data.verified !== undefined) d.verified = parsed.data.verified
  return Response.json({ ok: true })
}
