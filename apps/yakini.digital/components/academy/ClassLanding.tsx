import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { inviteVideo, PATHS, type Lang } from '@/lib/academy/config'
import { CLASS_TITLE, PAGE } from '@/lib/academy/copy'
import { AcademyShell } from './AcademyShell'
import { InviteVideo } from './InviteVideo'
import { SignupForm } from './SignupForm'

export function classMetadata(lang: Lang): Metadata {
  const c = PAGE[lang]
  const v = inviteVideo(lang)
  return {
    title: c.htmlTitle,
    description: c.metaDescription,
    alternates: { canonical: PATHS[lang].landing, languages: { en: '/class', es: '/clase' } },
    openGraph: {
      title: c.htmlTitle, description: c.metaDescription, url: PATHS[lang].landing, siteName: 'Yakini Academy',
      type: 'website', locale: lang === 'es' ? 'es_US' : 'en_US',
      images: [{ url: v.poster, width: 1080, height: 1920, alt: CLASS_TITLE[lang] }],
      videos: [{ url: v.src, secureUrl: v.src, type: 'video/mp4', width: 1080, height: 1920 }],
    },
    twitter: { card: 'summary_large_image', title: c.htmlTitle, description: c.metaDescription, images: [v.poster] },
  }
}

export async function ClassLanding({ lang }: { lang: Lang }) {
  const c = PAGE[lang]
  const v = inviteVideo(lang)
  const h = await headers()
  const geo = h.get('x-vercel-ip-country')?.toUpperCase() ?? null
  const defaultCountry = geo && /^[A-Z]{2}$/.test(geo) ? geo : null
  const playLabel = lang === 'es' ? 'Ver el video' : 'Play the video'

  return (
    <AcademyShell lang={lang}>
      <main className="ya-main">
        <section className="ya-hero">
          <div className="ya-hero-text">
            <div className="ya-hero-copy">
              <div className="ya-eyebrow"><span className="ya-dot" aria-hidden="true" />{c.eyebrow}</div>
              <h1 className="ya-h1">{c.h1}<em>{c.h1Accent}</em></h1>
              <p className="ya-sub">{c.sub.split(CLASS_TITLE[lang]).flatMap((part, i) => i === 0 ? [part] : [<strong key={i}>{CLASS_TITLE[lang]}</strong>, part])}</p>
              <ul className="ya-facts">{c.facts.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
            <div className="ya-form-wrap">
              <SignupForm lang={lang} defaultCountry={defaultCountry} />
            </div>
          </div>
          <InviteVideo src={v.src} poster={v.poster} label={c.videoLabel} playLabel={playLabel} />
        </section>

        <section className="ya-sections">
          <div className="ya-card">
            <h2 className="ya-h2">{c.learnHeading}</h2>
            <ul className="ya-learn">{c.learn.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
          <div className="ya-card">
            <h2 className="ya-h2">{c.whoHeading}</h2>
            <p className="ya-p">{c.who}</p>
            <h2 className="ya-h2" style={{ marginTop: 28 }}>{c.bioHeading}</h2>
            <p className="ya-p">{c.bio}</p>
          </div>
        </section>

        <section className="ya-faq" aria-labelledby="ya-faq-h">
          <h2 id="ya-faq-h" className="ya-h2">{c.faqHeading}</h2>
          {c.faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
          <p style={{ marginTop: 28 }}><a className="ya-btn ya-btn-inline" href="#signup">{c.button}</a></p>
        </section>
      </main>
    </AcademyShell>
  )
}
