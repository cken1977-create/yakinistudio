import { NextRequest, NextResponse } from 'next/server'
import { clientIp } from '@/lib/esign/server'
import { rateLimited, tooMany } from '@/lib/server/guard'
import { completeInsights } from '@/lib/chat/xai'
import {
  asKitId,
  asSizeId,
  colorsLookWeak,
  extractBrand,
  FALLBACK_COLORS,
  looksLikeHostName,
  pageExcerpt,
  suggestKitFromText,
  type BrandProfile,
} from '@/lib/demo/extract-brand'
import { fetchPublicPage } from '@/lib/demo/fetch-page'
import { sanitizePublicHttpUrl } from '@/lib/demo/safe-url'

export const runtime = 'nodejs'
export const maxDuration = 15

// Nothing fetched from a prospect's site is stored here. The client keeps the
// profile in memory and, later, only contact + kit selections go to /api/leads.

async function withInsights(
  brand: BrandProfile,
  input: { industry?: string; excerpt?: string; givenName?: string },
): Promise<BrandProfile> {
  const insight = await completeInsights({
    name: brand.name,
    industry: input.industry,
    excerpt: input.excerpt || '',
    fetched: brand.fetched,
  })
  if (!insight) return brand

  const next: BrandProfile = { ...brand }
  if (insight.intro) next.intro = insight.intro
  if (!next.suggestedKit) next.suggestedKit = asKitId(insight.suggestedKit)
  if (!next.suggestedSize) next.suggestedSize = asSizeId(insight.suggestedSize)
  const weakName = !input.givenName && (!next.name || next.name === 'Your business' || looksLikeHostName(next.name))
  if (weakName && insight.name) next.name = insight.name
  if (insight.colors && (colorsLookWeak(next.colors) || !brand.fetched)) {
    next.colors = {
      primary: insight.colors.primary || next.colors.primary,
      secondary: insight.colors.secondary || next.colors.secondary,
      accent: insight.colors.accent || next.colors.accent,
    }
  }
  return next
}

export async function POST(req: NextRequest) {
  try {
    if (rateLimited(`demo-brand:${clientIp(req.headers) ?? 'unknown'}`, 8, 15 * 60_000)) return tooMany()

    const raw = await req.json().catch(() => ({}))
    const urlInput = raw.url == null ? '' : String(raw.url).trim().slice(0, 500)
    const givenName = raw.name == null ? '' : String(raw.name).trim().slice(0, 80)
    const industry = raw.industry == null ? '' : String(raw.industry).trim().slice(0, 40)

    if (!urlInput) {
      const profile: BrandProfile = {
        name: givenName || 'Your business',
        logoUrl: null,
        colors: FALLBACK_COLORS,
        sourceUrl: null,
        fetched: false,
        suggestedKit: suggestKitFromText(industry),
      }
      return NextResponse.json({ brand: await withInsights(profile, { industry, givenName, excerpt: `${givenName} ${industry}`.trim() }) })
    }

    const safe = sanitizePublicHttpUrl(urlInput)
    if (!safe.ok) return NextResponse.json({ error: safe.error }, { status: 400 })

    try {
      const page = await fetchPublicPage(safe.url.toString())
      const brand = extractBrand(page.html, page.finalUrl, givenName || undefined)
      if (givenName) brand.name = givenName
      if (!brand.suggestedKit) brand.suggestedKit = suggestKitFromText(industry)
      const excerpt = pageExcerpt(page.html)
      return NextResponse.json({ brand: await withInsights(brand, { industry, givenName, excerpt }) })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'We could not read that website.'
      const profile: BrandProfile = {
        name: givenName || safe.url.hostname.replace(/^www\./, ''),
        logoUrl: null,
        colors: FALLBACK_COLORS,
        sourceUrl: safe.url.toString(),
        fetched: false,
        suggestedKit: suggestKitFromText(`${givenName} ${industry}`),
      }
      return NextResponse.json({
        brand: await withInsights(profile, { industry, givenName, excerpt: `${givenName} ${industry}`.trim() }),
        warning: message,
      })
    }
  } catch (err) {
    console.error('demo brand error', err)
    return NextResponse.json({ error: 'We could not read that website.' }, { status: 500 })
  }
}
