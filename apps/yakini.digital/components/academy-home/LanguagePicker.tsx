import { ACADEMY_LOCALES, type AcademyLocale } from '@/lib/academy/locales'

/** Language picker. Works without JavaScript; lists every Academy language, so adding one adds it here. */
export function LanguagePicker({ current, hrefs, label }: { current: AcademyLocale; hrefs: Record<AcademyLocale, string>; label: string }) {
  const cur = ACADEMY_LOCALES.find((l) => l.code === current)!
  return (
    <details className="yh-lang">
      <summary aria-label={`${label}: ${cur.label}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" /></svg>
        {cur.short}
      </summary>
      <ul>
        {ACADEMY_LOCALES.map((l) => (
          <li key={l.code}>
            <a href={hrefs[l.code]} hrefLang={l.code} lang={l.code} aria-current={l.code === current ? 'true' : undefined}>
              {l.label}<span className="yh-lang-code">{l.short}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
