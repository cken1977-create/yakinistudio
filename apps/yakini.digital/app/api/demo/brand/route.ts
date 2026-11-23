import { NextRequest, NextResponse } from 'next/server'
import { clientIp } from '@/lib/esign/server'
import { rateLimited, tooMany } from '@/lib/server/guard'
import { extractBrand, FALLBACK_COLORS, suggestKitFromText, type BrandProfile } from '@/lib/demo/extract-brand'
import { fetchPublicPage } from '@/lib/demo/fetch-page'
import { sanitizePublicHttpUrl } from '@/lib/demo/safe-url'

export const runtime = 'nodejs'
export const maxDuration = 10

// Nothing fetched from a prospect's site is stored here. The client keeps the
// profile in memory and, later, only contact + kit selections go to /api/leads.

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
      return NextResponse.json({ brand: profile })
    }

    const safe = sanitizePublicHttpUrl(urlInput)
    if (!safe.ok) return NextResponse.json({ error: safe.error }, { status: 400 })

    try {
      const page = await fetchPublicPage(safe.url.toString())
      const brand = extractBrand(page.html, page.finalUrl, givenName || undefined)
      if (givenName) brand.name = givenName
      if (!brand.suggestedKit) brand.suggestedKit = suggestKitFromText(industry)
      return NextResponse.json({ brand })
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
      return NextResponse.json({ brand: profile, warning: message })
    }
  } catch (err) {
    console.error('demo brand error', err)
    return NextResponse.json({ error: 'We could not read that website.' }, { status: 500 })
  }
}
