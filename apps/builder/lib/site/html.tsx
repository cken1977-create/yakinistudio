/* eslint-disable @next/next/no-head-element -- a plain HTML document rendered outside Next.js pages, not a Next page head */
import type { ReactNode } from 'react'
import { preload } from 'react-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { SiteView, metaFor, type RenderContext } from '@yakini/sections'
import type { Page, SiteDoc } from '@yakini/site-schema'
import FONT_FILES from './font-files.json'

/**
 * Published client pages as plain HTML (perf decision 2026-11-27, spec 7.3, 13.5). No framework
 * JavaScript: the page is one server render with the site's own first-party stylesheet. The only
 * <script> is JSON-LD (data, never run). Forms are ordinary HTML form posts, so everything works
 * with JavaScript off.
 *
 * D7 hook: `islands` lets a 3D-plan site add its own first-party scripts later (nonce-tagged, after
 * the page is readable). Every other site passes none, and tests require that published pages
 * contain no other script.
 */
export type SiteIsland = { src: string }

/** The stylesheet built by scripts/build-site-css.mjs; ?v changes with every deploy. */
export function siteCssHref(): string {
  const v = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'local').slice(0, 12).replace(/[^a-zA-Z0-9_-]/g, '')
  return `/_site-assets/site.css?v=${v}`
}

/**
 * The site's own Latin font files (its font pair), preloaded so they arrive with the stylesheet and
 * are ready before the first paint: no swap, so nothing moves (CLS). Same files the page downloads
 * anyway, within the 100 KB font budget; nothing from another site.
 */
export function fontPreloads(pair: string): string[] {
  const keys = (FONT_FILES as Record<string, string[]>)[pair] ?? []
  return keys.map((k) => { const [, family, style] = k.match(/^(.+)-(normal|italic)$/)!; return `/_site-assets/fonts/${family}-latin-wght-${style}.woff2` })
}

type Head = { fonts?: string[]; title: string; description: string | null; canonical: string | null; robots: 'index' | 'noindex'; og?: { url: string; siteName: string; image?: string } }

function Document({ head, children, islands, nonce }: { head: Head; children: ReactNode; islands: SiteIsland[]; nonce: string | null }) {
  for (const f of head.fonts ?? []) preload(f, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{head.title}</title>
        {head.description ? <meta name="description" content={head.description} /> : null}
        <meta name="robots" content={head.robots === 'index' ? 'index, follow' : 'noindex, nofollow'} />
        {head.canonical ? <link rel="canonical" href={head.canonical} /> : null}
        {head.og ? (
          <>
            <meta property="og:title" content={head.title} />
            {head.description ? <meta property="og:description" content={head.description} /> : null}
            <meta property="og:url" content={head.og.url} />
            <meta property="og:site_name" content={head.og.siteName} />
            <meta property="og:locale" content="en_US" />
            <meta property="og:type" content="website" />
            {head.og.image ? <meta property="og:image" content={head.og.image} /> : null}
          </>
        ) : null}
        <link rel="icon" href="data:," />
        <link rel="stylesheet" href={siteCssHref()} />
      </head>
      <body>
        {children}
        {/* D7 only: first-party 3D islands, loaded after the page is readable. Empty for every other site. */}
        {islands.map((i) => <script key={i.src} src={i.src} type="module" async nonce={nonce ?? undefined} />)}
      </body>
    </html>
  )
}

const doctype = (body: string) => `<!doctype html>${body}`

export function publishedPageHtml(o: {
  doc: SiteDoc; page: Page; ctx: RenderContext; canonicalHost: string; indexable: boolean; thanks: boolean
  islands?: SiteIsland[]; nonce?: string | null
}): string {
  const meta = metaFor(o.doc, o.page)
  const title = o.thanks ? `Thank you · ${o.doc.business.name}` : meta.title
  const url = `https://${o.canonicalHost}${o.page.slug ? `/${o.page.slug}` : ''}`
  const head: Head = {
    fonts: fontPreloads(o.doc.style.fontPair),
    title, description: meta.description, canonical: url,
    robots: o.indexable && !o.thanks && !o.page.seo?.noindex ? 'index' : 'noindex',
    og: { url, siteName: o.doc.business.name, ...(o.doc.seo.ogImageAssetId ? { image: `https://${o.canonicalHost}/assets/${o.doc.seo.ogImageAssetId}` } : {}) },
  }
  return doctype(renderToStaticMarkup(<Document head={head} islands={o.islands ?? []} nonce={o.nonce ?? null}><SiteView ctx={o.ctx} /></Document>))
}

/** The neutral page (spec 11.4, 14.8 #9): no reason, no vendor names, noindex, no stylesheet needed. */
export function neutralHtml(title: string, note: string): string {
  const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' as const, background: '#fff', color: '#1a1a1a', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', margin: 0 }
  return doctype(renderToStaticMarkup(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="data:," />
      </head>
      <body style={{ margin: 0 }}>
        <main style={wrap}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>{title}</h1>
            <p style={{ marginTop: '12px', color: '#555' }}>{note}</p>
          </div>
        </main>
      </body>
    </html>,
  ))
}
