// Page maths for paged admin lists (?page=N, 1-based).

export type PageInfo = { page: number; pageSize: number; from: number; to: number; pages: number; total: number }

export function parsePage(raw: string | undefined | null): number {
  const n = Number.parseInt(raw ?? '', 10)
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 100_000) : 1
}

/** Row range for a page (inclusive, for Supabase .range()). */
export function pageRange(page: number, pageSize: number): { from: number; to: number } {
  const from = (page - 1) * pageSize
  return { from, to: from + pageSize - 1 }
}

export function pageInfo(page: number, pageSize: number, total: number): PageInfo {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const p = Math.min(Math.max(1, page), pages)
  const { from } = pageRange(p, pageSize)
  return { page: p, pageSize, from, to: Math.min(from + pageSize, total) - 1, pages, total }
}

/** Build a list URL keeping other params; page 1 drops the param. */
export function pageHref(base: string, params: Record<string, string | undefined>, page: number): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v && k !== 'page') q.set(k, v)
  if (page > 1) q.set('page', String(page))
  const s = q.toString()
  return s ? `${base}?${s}` : base
}
