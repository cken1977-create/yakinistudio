import { liveSite } from '@/lib/site/resolve'

/** sitemap.xml for a client host (spec 11.4): every page of the live site on its main address. */
export const dynamic = 'force-dynamic'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function GET(_request: Request, { params }: { params: Promise<{ host: string }> }): Promise<Response> {
  const host = decodeURIComponent((await params).host)
  const s = await liveSite(host)
  if (s.kind !== 'site') return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } })
  const base = `https://${s.site.canonicalHost}`
  const urls = s.site.doc.pages.filter((p) => !p.seo?.noindex).map((p) => `  <url><loc>${esc(`${base}${p.slug ? `/${p.slug}` : '/'}`)}</loc></url>`)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300' } })
}
