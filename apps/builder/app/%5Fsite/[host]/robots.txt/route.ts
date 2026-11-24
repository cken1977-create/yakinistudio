import { liveSite } from '@/lib/site/resolve'

/** robots.txt for a client host (spec 11.4): allow + sitemap only for an indexable live site. */
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ host: string }> }): Promise<Response> {
  const host = decodeURIComponent((await params).host)
  const s = await liveSite(host)
  const ok = s.kind === 'site' && s.site.indexable && (s.primaryHost ?? host) === host
  const body = ok ? `User-agent: *\nAllow: /\nDisallow: /thanks\n\nSitemap: https://${host}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n'
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' } })
}
