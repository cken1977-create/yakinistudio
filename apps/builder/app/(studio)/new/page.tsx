import type { Metadata } from 'next'
import { BUILDER_KITS } from '@yakini/kits'
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
            <label htmlFor="kitId" className={label}>Kind of site <span className="font-normal text-muted">(optional)</span></label>
            <select id="kitId" name="kitId" defaultValue="" className={input}>
              <option value="">Pick for me</option>
              {Object.values(BUILDER_KITS).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
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
            <legend className="px-1 text-sm font-semibold">Brand colors <span className="font-normal text-muted">(optional)</span></legend>
            <label className="flex min-h-11 items-center gap-3 text-base">
              <input type="checkbox" name="useColors" className="h-5 w-5 accent-[#C9A14A]" /> Use my colors
            </label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {([['primary', 'Main', '#7A2E2A'], ['secondary', 'Dark', '#1B1714'], ['accent', 'Accent', '#C9A14A']] as const).map(([n, l, v]) => (
                <label key={n} className="text-sm text-paper/85">
                  {l}
                  <input type="color" name={n} defaultValue={v} className="mt-2 block h-12 w-full cursor-pointer rounded-lg border border-paper/25 bg-transparent" />
                </label>
              ))}
            </div>
            <p className={hint}>Leave “Use my colors” unticked and we’ll use our default colors. You can replace them anytime.</p>
          </fieldset>

          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-7 font-semibold text-ink hover:brightness-110 sm:w-auto">
            Build my draft
          </button>
        </form>
      )}
    </main>
  )
}
