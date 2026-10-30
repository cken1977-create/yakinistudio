import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { courseBySlug, COURSES } from '@/lib/academy/catalog'
import { HOME } from '@/lib/academy/home-copy'
import { ACADEMY_LOCALES, localeInfo, type AcademyLocale } from '@/lib/academy/locales'
import { HomeShell } from './HomeShell'

/** Slugs that have a detail page, for one language. */
export const detailSlugs = (lang: AcademyLocale) => COURSES.filter((c) => c.detail).map((c) => ({ slug: c.slug[lang] }))

const hrefsFor = (id: string) => {
  const c = COURSES.find((x) => x.id === id)!
  return Object.fromEntries(ACADEMY_LOCALES.map((l) => [l.code, `${l.courses}/${c.slug[l.code]}`])) as Record<AcademyLocale, string>
}

export function courseMetadata(lang: AcademyLocale, slug: string): Metadata {
  const c = courseBySlug(lang, slug)
  if (!c?.detail) return {}
  const hrefs = hrefsFor(c.id)
  return {
    title: `${c.title[lang]} · Yakini Academy`,
    description: c.detail.tagline[lang],
    alternates: { canonical: hrefs[lang], languages: hrefs },
  }
}

export function CoursePage({ lang, slug }: { lang: AcademyLocale; slug: string }) {
  const course = courseBySlug(lang, slug)
  if (!course?.detail) notFound()
  const d = course.detail
  const t = HOME[lang].course
  const L = localeInfo(lang)
  const wait = `${L.freeClass}?utm_campaign=waitlist-${course.id}`
  return (
    <HomeShell lang={lang} hrefs={hrefsFor(course.id)}>
      <main className="yh-wrap yh-course-hero">
        <a className="yh-crumb" href={`${L.home}#courses`}>← {t.back}</a>
        <div className="yh-course-grid">
          <div>
            <div className="ya-eyebrow"><span className="ya-dot" aria-hidden="true" />YAKINI ACADEMY · {t.status.toUpperCase()}</div>
            <h1 className="yh-h1" style={{ fontSize: 'clamp(42px, 6vw, 76px)' }}>{course.title[lang]}</h1>
            <p className="yh-sub">{d.tagline[lang]}</p>
            <ul className="yh-facts">
              <li>{t.status}</li><li>{t.pricing}</li><li>{t.selfPaced}</li><li>{d.modules.length} {t.modules}</li><li>English · Español</li>
            </ul>

            <section className="yh-block">
              <h2>{t.learn}</h2>
              <ul className="ya-learn">{d.learn[lang].map((x) => <li key={x}>{x}</li>)}</ul>
            </section>

            <section className="yh-block">
              <h2>{t.outline}</h2>
              <ol className="yh-modules">
                {d.modules.map((m, i) => (
                  <li key={m.title.en}>
                    <span className="yh-mod-n">{t.module.toUpperCase()}<b>{String(i + 1).padStart(2, '0')}</b></span>
                    <h3>{m.title[lang]}</h3>
                    <p>{m.body[lang]}</p>
                  </li>
                ))}
              </ol>
              <p className="yh-draft">{t.draftOutline}</p>
            </section>

            <section className="yh-block">
              <h2>{t.who}</h2>
              <p className="ya-p">{d.who[lang]}</p>
            </section>

            <section className="yh-block">
              <h2>{t.instructor}</h2>
              <div className="yh-bio">
                {/* Still from Clarence's invite video (captions cropped out). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/academy/clarence-still.jpg" alt="Clarence Kennedy" width={720} height={827} />
                <div><b>Clarence Kennedy</b><p className="ya-p">{t.bio}</p></div>
              </div>
            </section>
          </div>

          <aside className="yh-side">
            <div className="ya-card">
              <div className="yh-side-status"><span className="yh-badge" style={{ marginBottom: 0 }}>{t.status.toUpperCase()}</span><span>{t.pricing}</span></div>
              <a className="yh-btn yh-btn-gold" href={wait}>{t.waitlist}</a>
              <a className="yh-btn yh-btn-ghost" href={`${L.freeClass}?utm_campaign=academy-course-${course.id}`}>{t.startFree}</a>
              <p className="ya-consent" style={{ marginTop: 4 }}>{t.waitlistNote}</p>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '20px 0 4px' }}>{t.languages}</h3>
              <ul className="yh-langs">{t.langRows.map((r) => <li key={r.l}>{r.l}<span>{r.s}</span></li>)}</ul>
            </div>
          </aside>
        </div>
      </main>
    </HomeShell>
  )
}
