import type { Metadata } from 'next'
import { COLOR_PRESETS, INDUSTRIES, INDUSTRY_GROUPS } from '@yakini/kits'
import { signFormTime } from '@/lib/server/request'
import { getRuntime } from '@/lib/server/runtime'

/**
 * Flow A2 (spec 5.3): start a draft by describing the business. A plain form that works with
 * JavaScript off; no email or phone asked (R16). Bot protection is a hidden honeypot and a signed
 * time field, so no third-party captcha loads (R2).
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Describe your business' }

const label = 'block text-sm font-semibold text-paper'
const input = 'mt-2 block w-full rounded-xl border border-paper/25 bg-[#15130F] px-4 py-3 text-base text-paper placeholder:text-paper/40 focus:border-gold focus:outline-none'
const hint = 'mt-1 text-sm text-muted'
const swatch = 'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-paper/15 px-3 py-2 text-sm text-paper/90 hover:border-paper/40 has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold'

/** The signed "form shown at" time, or null when the studio is not configured yet. */
function freshFormTime(): string | null {
  try { return signFormTime(Date.now(), getRuntime().ipPepper) } catch { return null }
}

export default function NewDraft() {
  const formTime = freshFormTime()

  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-10 sm:py-16">
      <a href="https://yakini.digital" className="inline-flex min-h-11 items-center font-serif text-xl tracking-wide text-paper">
        Yakini <span className="text-gold">Studio</span>
      </a>
      <h1 className="mt-8 font-serif text-4xl leading-tight">Describe your business</h1>
      <p className="mt-3 text-lg text-paper/85">We’ll build a site draft in your name in about a minute. No email or phone needed.</p>

      {!formTime ? (
        <p className="mt-10 rounded-2xl border border-paper/15 p-5 text-paper/85">The studio isn’t open yet. Please try again soon.</p>
      ) : (
        <form method="post" action="/api/drafts" encType="multipart/form-data" className="mt-10 space-y-7">
          <input type="hidden" name="t" value={formTime} />
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>Leave this empty <input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>

          <div>
            <label htmlFor="businessName" className={label}>Business name</label>
            <input id="businessName" name="businessName" required maxLength={120} autoComplete="organization" className={input} />
          </div>

          <div>
            <label htmlFor="description" className={label}>What do you do?</label>
            <textarea id="description" name="description" required maxLength={500} rows={3} aria-describedby="description-hint"
              placeholder="Street tacos and aguas frescas, at breweries and events around town." className={input} />
            <p id="description-hint" className={hint}>One or two sentences. Up to 500 characters.</p>
          </div>

          <div>
            <label htmlFor="industry" className={label}>Kind of business <span className="font-normal text-muted">(optional)</span></label>
            <select id="industry" name="industry" defaultValue="" aria-describedby="industry-hint" className={input}>
              <option value="">Pick for me from my description</option>
              {INDUSTRY_GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {INDUSTRIES.filter((i) => i.group === g).map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
                </optgroup>
              ))}
            </select>
            <p id="industry-hint" className={hint}>Over 150 kinds of business. Don’t see yours? Pick “Something else” and describe it above.</p>
          </div>

          <div>
            <label htmlFor="city" className={label}>City <span className="font-normal text-muted">(optional)</span></label>
            <input id="city" name="city" maxLength={80} autoComplete="address-level2" className={input} />
          </div>

          <div>
            <label htmlFor="logo" className={label}>Logo <span className="font-normal text-muted">(optional)</span></label>
            <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/svg+xml" aria-describedby="logo-hint"
              className="mt-2 block w-full text-sm text-paper file:mr-4 file:min-h-11 file:rounded-full file:border-0 file:bg-paper file:px-5 file:font-semibold file:text-ink" />
            <p id="logo-hint" className={hint}>PNG, JPG or SVG, up to 2 MB.</p>
          </div>

          <fieldset className="rounded-2xl border border-paper/15 p-5">
            <legend className="px-1 text-sm font-semibold">Colors <span className="font-normal text-muted">(optional)</span></legend>
            <p className={hint}>Pick a color set, or use your own brand colors. You can change them anytime.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <label className={swatch}>
                <input type="radio" name="palette" value="" defaultChecked className="sr-only" />
                <span className="flex h-6 w-14 items-center justify-center rounded-md border border-dashed border-paper/40 text-xs text-paper/70" aria-hidden="true">Auto</span>
                <span>Pick for me</span>
              </label>
              {COLOR_PRESETS.map((p) => (
                <label key={p.id} className={swatch}>
                  <input type="radio" name="palette" value={p.id} className="sr-only" />
                  <span className="flex h-6 w-14 overflow-hidden rounded-md ring-1 ring-paper/20" aria-hidden="true">
                    {[p.colors.primary, p.colors.secondary, p.colors.accent].map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
                  </span>
                  <span>{p.name}</span>
                </label>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-paper/15 p-4 has-[:checked]:border-gold">
              <label className="flex min-h-11 items-center gap-3 text-base">
                <input type="radio" name="palette" value="custom" className="h-5 w-5 accent-[#C9A14A]" /> Use my own colors
              </label>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {([['primary', 'Main', '#7A2E2A'], ['secondary', 'Dark', '#1B1714'], ['accent', 'Accent', '#C9A14A']] as const).map(([n, l, v]) => (
                  <label key={n} className="text-sm text-paper/85">
                    {l}
                    <input type="color" name={n} defaultValue={v} className="mt-2 block h-12 w-full cursor-pointer rounded-lg border border-paper/25 bg-transparent" />
                  </label>
                ))}
              </div>
              <p className={hint}>Main is for buttons and headings, Dark for the header and footer, Accent for highlights. Your colors are used exactly as you pick them.</p>
            </div>
          </fieldset>

          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-7 font-semibold text-ink hover:brightness-110 sm:w-auto">
            Build my draft
          </button>
        </form>
      )}
    </main>
  )
}
