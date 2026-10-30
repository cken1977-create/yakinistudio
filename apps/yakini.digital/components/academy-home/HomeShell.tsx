import type { ReactNode } from 'react'
import Link from 'next/link'
import { ACADEMY_CSS } from '@/components/academy/academy-css'
import { HOME } from '@/lib/academy/home-copy'
import { localeInfo, type AcademyLocale } from '@/lib/academy/locales'
import { HOME_CSS } from './home-css'
import { LanguagePicker } from './LanguagePicker'

export function HomeShell({ lang, hrefs, children }: { lang: AcademyLocale; hrefs: Record<AcademyLocale, string>; children: ReactNode }) {
  const c = HOME[lang]
  const L = localeInfo(lang)
  const a = (id: string) => `${L.home}#${id}`
  return (
    <div className="ya" lang={lang}>
      <style>{ACADEMY_CSS + HOME_CSS}</style>
      <header className="yh-head">
        <div className="yh-head-in">
          <a href={L.home} className="ya-brand" aria-label="Yakini Academy">
            <span className="ya-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/yakini-lockup.jpg" alt="Yakini" width={784} height={1168} />
            </span>
            <span className="ya-brand-name">YAKINI<br />ACADEMY</span>
          </a>
          <nav className="yh-nav" aria-label="Academy">
            <a href={a('courses')}>{c.nav.courses}</a>
            <a href={a('how')}>{c.nav.how}</a>
            <a href={a('organizations')}>{c.nav.orgs}</a>
            <a href={a('faq')}>{c.nav.faq}</a>
          </nav>
          <div className="yh-head-right">
            <LanguagePicker current={lang} hrefs={hrefs} label={c.nav.language} />
            <a className="yh-cta-sm" href={`${L.freeClass}?utm_campaign=academy-nav`}>{c.nav.freeClass}</a>
          </div>
        </div>
      </header>
      {children}
      <footer className="ya-foot">
        <div className="ya-foot-inner">
          <span>© 2026 BRSA Holdings, Inc. · {c.footer}</span>
          <nav aria-label={lang === 'es' ? 'Pie de página' : 'Footer'}>
            <a href={L.privacy}>{lang === 'es' ? 'Privacidad' : 'Privacy'}</a>
            <a href="mailto:hello@yakini.digital">hello@yakini.digital</a>
            <Link href="/">yakini.digital</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
