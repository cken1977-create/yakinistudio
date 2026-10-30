import type { Metadata } from 'next'
import { CLASS_VIDEO, PATHS, WORKBOOK_URL, type Lang } from '@/lib/academy/config'
import { CLASS_TITLE, WATCH } from '@/lib/academy/copy'
import { signupByToken, tokenOk, type Signup } from '@/lib/academy/server'
import { AcademyShell } from './AcademyShell'
import { ClassPlayer } from './ClassPlayer'

export function watchMetadata(lang: Lang): Metadata {
  // Personal link: never indexed, and the token never leaks through the Referer header.
  return { title: WATCH[lang].htmlTitle, robots: { index: false, follow: false }, referrer: 'no-referrer' }
}

export async function WatchView({ lang, token }: { lang: Lang; token: string | null }) {
  const w = WATCH[lang]
  let signup: Signup | null = null
  let lookupOk = true
  if (tokenOk(token)) {
    try { signup = (await signupByToken(token)).signup } catch { lookupOk = false }
  }
  const video = CLASS_VIDEO[lang]
  const otherHref = null // the personal page stays in the signup's language

  return (
    <AcademyShell lang={lang} otherLangHref={otherHref}>
      <main className="ya-main">
        <div className="ya-narrow">
          <div className="ya-eyebrow"><span className="ya-dot" aria-hidden="true" />{w.eyebrow}</div>
          {!signup ? (
            <div className="ya-card">
              <h1 className="ya-h2">{w.invalidTitle}</h1>
              <p className="ya-p" style={{ marginBottom: 20 }}>{lookupOk ? w.invalidBody : (lang === 'es' ? 'No pudimos abrir tu enlace en este momento. Inténtalo de nuevo en un rato.' : "We couldn't open your link just now. Please try again shortly.")}</p>
              <a className="ya-btn ya-btn-inline" href={`${PATHS[lang].landing}#signup`}>{w.signupCta}</a>
            </div>
          ) : (
            <>
              <h1 className="ya-h1" style={{ fontSize: 'clamp(36px, 6vw, 60px)' }}>{w.hello(signup.first_name)}</h1>
              <p className="ya-sub">{CLASS_TITLE[lang]}</p>
              {video ? (
                <>
                  <ClassPlayer token={signup.access_token} src={video.src} poster={video.poster} label={CLASS_TITLE[lang]} />
                  {signup.watched_at && <p className="ya-p" style={{ marginTop: 14 }}>{w.watchedNote}</p>}
                  {WORKBOOK_URL && (
                    <div className="ya-card" style={{ marginTop: 28 }}>
                      <h2 className="ya-h2">{w.nextTitle}</h2>
                      <p className="ya-p" style={{ marginBottom: 18 }}>{w.nextBody}</p>
                      <a className="ya-btn ya-btn-inline" href={WORKBOOK_URL}>{w.nextCta}</a>
                    </div>
                  )}
                </>
              ) : (
                <div className="ya-card ya-soon" role="status">
                  <span className="ya-soon-badge">{lang === 'es' ? 'PRÓXIMAMENTE' : 'COMING SOON'}</span>
                  <h2 className="ya-h2">{w.comingTitle}</h2>
                  <p className="ya-p">{w.comingBody}</p>
                </div>
              )}
              <p className="ya-p" style={{ marginTop: 28, fontSize: 13 }}>
                <a href={`${PATHS[lang].unsubscribe}?t=${signup.access_token}`}>{w.unsubscribe}</a>
              </p>
            </>
          )}
        </div>
      </main>
    </AcademyShell>
  )
}
