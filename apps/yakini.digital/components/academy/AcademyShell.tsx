import type { ReactNode } from 'react'
import Link from 'next/link'
import type { Lang } from '@/lib/academy/config'
import { PATHS } from '@/lib/academy/config'
import { PAGE } from '@/lib/academy/copy'
import { ACADEMY_CSS } from './academy-css'

/** Light page frame for Yakini Academy pages: logo, language switch, footer with privacy. */
export function AcademyShell({ lang, children, otherLangHref, preview }: { lang: Lang; children: ReactNode; otherLangHref?: string | null; preview?: string | null }) {
  const c = PAGE[lang]
  const other = otherLangHref === undefined ? c.otherLang.href : otherLangHref
  return (
    <div className="ya" lang={lang}>
      <style>{ACADEMY_CSS}</style>
      <header className="ya-top">
        <a href={PATHS[lang].landing} className="ya-brand" aria-label="Yakini Academy">
          <span className="ya-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/yakini-lockup.jpg" alt="Yakini" width={784} height={1168} />
          </span>
          <span className="ya-brand-name">YAKINI<br />ACADEMY</span>
        </a>
        {other && <a className="ya-lang" href={other} hrefLang={c.otherLang.hreflang} lang={c.otherLang.hreflang}>{c.otherLang.label}</a>}
      </header>
      {preview && <p className="ya-banner" role="note">{preview}</p>}
      {children}
      <footer className="ya-foot">
        <div className="ya-foot-inner">
          <span>© 2026 BRSA Holdings, Inc. · {c.footerNote}</span>
          <nav aria-label={lang === 'es' ? 'Pie de página' : 'Footer'}>
            <a href={PATHS[lang].privacy}>{c.privacy}</a>
            <a href="mailto:hello@yakini.digital">hello@yakini.digital</a>
            <Link href="/">yakini.digital</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
