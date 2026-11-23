/**
 * Yakini Builder hand-off (builder spec 5.2 step 3): with BUILDER_HANDOFF_ENABLED on, "Start my
 * setup" for a kit the studio builds becomes a plain top-level form POST to the studio's /start,
 * so the prospect lands on a draft of their own site. Off (the default), nothing changes.
 */
export const STUDIO_KITS = ['food-truck', 'restaurant'] as const

export type Handoff = { action: string; describeUrl: string } | null

/** Read on the server only; the client gets the result as a prop. */
export function handoffFromEnv(env: Record<string, string | undefined> = process.env): Handoff {
  if (env.BUILDER_HANDOFF_ENABLED !== '1' && env.BUILDER_HANDOFF_ENABLED !== 'true') return null
  let origin = 'https://studio.yakini.digital'
  if (env.BUILDER_STUDIO_ORIGIN) {
    try {
      const u = new URL(env.BUILDER_STUDIO_ORIGIN)
      if (u.protocol === 'https:' || u.hostname === 'localhost') origin = u.origin
    } catch { /* keep the default */ }
  }
  return { action: `${origin}/start`, describeUrl: `${origin}/new` }
}

export function studioBuilds(kitId: string | undefined): boolean {
  return !!kitId && (STUDIO_KITS as readonly string[]).includes(kitId)
}

const FEATURE_RE = /^[a-z0-9-]{1,60}$/

/** The hidden fields the studio's /start expects. Only safe, known-shape values are sent. */
export function handoffFields(v: { website?: string; name?: string; kitId: string; sizeId?: string; items: readonly string[] }): [string, string][] {
  const fields: [string, string][] = [
    ['sourceUrl', (v.website ?? '').trim().slice(0, 2048)],
    ['businessName', (v.name ?? '').trim().slice(0, 120)],
    ['kitId', v.kitId],
  ]
  if (v.sizeId) fields.push(['sizeId', v.sizeId])
  for (const f of v.items.filter((i) => FEATURE_RE.test(i)).slice(0, 30)) fields.push(['features[]', f])
  return fields
}
