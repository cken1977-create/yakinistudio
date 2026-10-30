import type { Metadata } from 'next'
import { InviteVideo } from '@/components/academy/InviteVideo'
import { inviteVideo } from '@/lib/academy/config'
import { COURSES } from '@/lib/academy/catalog'
import { HOME } from '@/lib/academy/home-copy'
import { ACADEMY_LOCALES, localeInfo, type AcademyLocale } from '@/lib/academy/locales'
import { HomeShell } from './HomeShell'
import { OrgForm } from './OrgForm'

const homeHrefs = Object.fromEntries(ACADEMY_LOCALES.map((l) => [l.code, l.home])) as Record<AcademyLocale, string>
const invite = (lang: AcademyLocale) => inviteVideo(lang === 'es' ? 'es' : 'en')

export function homeMetadata(lang: AcademyLocale): Metadata {
  const c = HOME[lang]
  const L = localeInfo(lang)
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: L.home, languages: homeHrefs },
    openGraph: { title: c.metaTitle, description: c.metaDescription, url: L.home, siteName: 'Yakini Academy', type: 'website', images: [{ url: invite(lang).poster, width: 1080, height: 1920 }] },
  }
}

export function AcademyHome({ lang }: { lang: AcademyLocale }) {
  const c = HOME[lang]
  const L = localeInfo(lang)
  const v = invite(lang)
  return (
    <HomeShell lang={lang} hrefs={homeHrefs}>
      <main>
        <section className="yh-hero">
          <div className="yh-wrap yh-hero-grid">
            <div>
              <div className="ya-eyebrow"><span className="ya-dot" aria-hidden="true" />{c.eyebrow}</div>
              <h1 className="yh-h1">{c.h1}<em>{c.h1Accent}</em></h1>
              <p className="yh-support">{c.support}</p>
              <p className="yh-sub">{c.sub}</p>
              <div className="yh-ctas">
                <a className="yh-btn yh-btn-gold" href={`${L.freeClass}?utm_campaign=academy-hero`}>{c.ctaPrimary}</a>
                <a className="yh-btn yh-btn-ghost" href="#courses">{c.ctaSecondary}</a>
              </div>
              <ul className="ya-facts">{c.chips.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <aside className="yh-free" aria-label={c.free.title}>
              <InviteVideo src={v.src} poster={v.poster} label={c.free.videoAlt} playLabel={lang === 'es' ? 'Ver el video' : 'Play the video'} />
              <span className="yh-badge">{c.free.badge}</span>
              <h2>{c.free.title}</h2>
              <p>{c.free.body}</p>
              <p className="yh-meta">{c.free.meta}</p>
              <a className="yh-btn yh-btn-gold" style={{ width: '100%' }} href={`${L.freeClass}?utm_campaign=academy-free-card`}>{c.free.cta}</a>
            </aside>
          </div>
        </section>

        <section className="yh-section" id="mistakes" aria-labelledby="yh-mistakes-h">
          <div className="yh-wrap">
            <p className="yh-eyebrow">{c.mistakes.eyebrow}</p>
            <h2 id="yh-mistakes-h" className="yh-h2">{c.mistakes.title}</h2>
            <p className="yh-lead">{c.mistakes.sub}</p>
            <div className="yh-mistakes">
              {c.mistakes.items.map((m) => (
                <div key={m.t} className="yh-mistake">
                  <span className="yh-x" aria-hidden="true">✕</span>
                  <div><h3>{m.t}</h3><p>{m.b}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="yh-section" id="courses" aria-labelledby="yh-courses-h">
          <div className="yh-wrap">
            <p className="yh-eyebrow">{c.catalog.eyebrow}</p>
            <h2 id="yh-courses-h" className="yh-h2">{c.catalog.title}</h2>
            <p className="yh-lead">{c.catalog.sub}</p>
            <div className="yh-grid">
              {COURSES.map((x, i) => (
                <article key={x.id} className={`yh-course${x.free ? ' yh-course-free' : ''}`}>
                  <div className="yh-course-top">
                    <span className="yh-num">{String(i).padStart(2, '0')}</span>
                    <span className={`yh-status${x.free ? ' yh-status-free' : ''}`}>{x.free ? c.catalog.free : c.catalog.comingSoon}</span>
                  </div>
                  <h3>{x.title[lang]}</h3>
                  <p>{x.summary[lang]}</p>
                  <ul className="yh-tags">{x.topics[lang].map((t) => <li key={t}>{t}</li>)}</ul>
                  <div className="yh-course-foot">
                    <span className="yh-price">{x.free ? '' : c.catalog.pricingSoon}</span>
                    <span className="yh-links">
                      {x.free
                        ? <a className="yh-link" href={`${L.freeClass}?utm_campaign=academy-catalog`}>{c.catalog.startFree} →</a>
                        : <>
                            {x.detail && <a className="yh-link" href={`${L.courses}/${x.slug[lang]}`}>{c.catalog.preview}</a>}
                            <a className="yh-link" href={`${L.freeClass}?utm_campaign=waitlist-${x.id}`}>{c.catalog.waitlist} →</a>
                          </>}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <p className="yh-note">{c.catalog.waitlistNote}</p>
          </div>
        </section>

        <section className="yh-section" id="how" aria-labelledby="yh-how-h">
          <div className="yh-wrap">
            <p className="yh-eyebrow">{c.how.eyebrow}</p>
            <h2 id="yh-how-h" className="yh-h2">{c.how.title}</h2>
            <div className="yh-steps" style={{ marginTop: 28 }}>
              {c.how.steps.map((s) => <div key={s.t} className="yh-step"><h3>{s.t}</h3><p>{s.b}</p></div>)}
            </div>
          </div>
        </section>

        <section className="yh-section" id="organizations" aria-labelledby="yh-orgs-h">
          <div className="yh-wrap yh-orgs">
            <div>
              <p className="yh-eyebrow">{c.orgs.eyebrow}</p>
              <h2 id="yh-orgs-h" className="yh-h2">{c.orgs.title}</h2>
              <p className="yh-lead">{c.orgs.sub}</p>
              <ul className="yh-points">{c.orgs.points.map((p) => <li key={p.t}><b>{p.t}</b><span>{p.b}</span></li>)}</ul>
            </div>
            <OrgForm f={c.orgs.form} />
          </div>
        </section>

        <section className="yh-section" id="faq" aria-labelledby="yh-faq-h">
          <div className="yh-wrap ya-faq" style={{ borderTop: 0, paddingTop: 0 }}>
            <h2 id="yh-faq-h" className="yh-h2">{c.faqTitle}</h2>
            {c.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            <p style={{ marginTop: 28 }}><a className="yh-btn yh-btn-gold" href={`${L.freeClass}?utm_campaign=academy-faq`}>{c.ctaPrimary}</a></p>
          </div>
        </section>
      </main>
    </HomeShell>
  )
}
