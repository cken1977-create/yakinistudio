/**
 * Vercel domain-limit check (v1.1 addition). Every client address is attached to ONE Builder
 * project, and a hosting project has a cap on how many domains it can hold. Before adding a
 * subdomain or custom domain (Phases 3 and 5) the server compares the project's current domain
 * count with VERCEL_PROJECT_DOMAIN_LIMIT and refuses early, with headroom, instead of failing
 * half-way.
 *
 * The brsa-registry team is on Vercel Pro. Official docs (https://vercel.com/docs/limits,
 * checked 2026-11-23) list Pro as unlimited with a soft limit of 100,000 domains per project
 * (Hobby remains 50). Override with VERCEL_PROJECT_DOMAIN_LIMIT if that changes.
 */
export const DEFAULT_DOMAIN_LIMIT = 100_000
export const DEFAULT_HEADROOM = 5

export type DomainCapacity = { ok: boolean; remaining: number; warn: boolean }

export function domainCapacity(current: number, limit = DEFAULT_DOMAIN_LIMIT, toAdd = 1, headroom = DEFAULT_HEADROOM): DomainCapacity {
  if (!Number.isFinite(current) || current < 0 || !Number.isFinite(limit) || limit <= 0) return { ok: false, remaining: 0, warn: true }
  const remaining = limit - current
  return { ok: remaining - toAdd >= 0, remaining, warn: remaining - toAdd < headroom }
}

export function domainLimitFromEnv(raw: string | undefined): number {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_DOMAIN_LIMIT
}
