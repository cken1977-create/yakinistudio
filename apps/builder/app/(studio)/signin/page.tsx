import type { Metadata } from 'next'
import { ui } from '@/components/ui'
import { currentUser, safeNext } from '@/lib/server/auth'
import { readSigninState } from '@/lib/server/signin'

/**
 * Sign in (spec 5.4 step 2, 10.1): email only, then the 6-digit code or the link from the email.
 * No passwords. Works with JavaScript off.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } }

const ERRORS: Record<string, string> = {
  email: 'Please check your email address and try again.',
  rate: 'That’s a lot of tries for now. Please wait a few minutes and try again.',
  send: 'We couldn’t send the email just now. Please try again in a minute.',
  code: 'That code didn’t work. Check the newest email from us and try again, or ask for a new code.',
  expired: 'That sign-in took too long. Please enter your email again.',
  link: 'That sign-in link didn’t work. It may have expired, or it was opened in a different browser. Enter your email to get a new one.',
  origin: 'Please sign in from this page.',
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function SignIn({ searchParams }: Props) {
  const q = await searchParams
  const next = safeNext(one(q.next))
  const error = ERRORS[one(q.e) ?? ''] ?? null
  const [user, state] = await Promise.all([currentUser(), readSigninState()])
  const codeStep = one(q.step) === 'code' && state !== null

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-10 sm:py-16">
      <a href="https://yakini.digital" className="inline-flex min-h-11 items-center font-serif text-xl tracking-wide text-paper">
        Yakini <span className="text-gold">Studio</span>
      </a>

      {user ? (
        <>
          <h1 className="mt-8 font-serif text-4xl leading-tight">You’re signed in</h1>
          <p className="mt-3 text-lg text-paper/85">Signed in as <strong className="font-semibold">{user.email}</strong>.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={next} className={ui.primary}>Continue</a>
            <form method="post" action="/api/auth/signout"><button type="submit" className={ui.secondary}>Sign out</button></form>
          </div>
        </>
      ) : codeStep ? (
        <>
          <h1 className="mt-8 font-serif text-4xl leading-tight">Check your email</h1>
          <p className="mt-3 text-lg text-paper/85">We sent a sign-in email to <strong className="font-semibold">{state!.email}</strong>. Enter the 6-digit code from it, or tap the link in it on this device.</p>
          {error && <p role="alert" className={`mt-6 ${ui.error}`}>{error}</p>}
          <form method="post" action="/api/auth/verify" className="mt-8 space-y-6">
            <div>
              <label htmlFor="code" className={ui.label}>6-digit code</label>
              <input id="code" name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="\s*\d{6}\s*" maxLength={12}
                className={`${ui.input} tracking-[0.4em]`} />
            </div>
            <button type="submit" className={`${ui.primary} w-full sm:w-auto`}>Sign in</button>
          </form>
          <p className="mt-8 text-paper/80">No email? Check spam, or <a href={`/signin?next=${encodeURIComponent(next)}`} className="underline underline-offset-4 hover:text-gold">use a different email</a>.</p>
        </>
      ) : (
        <>
          <h1 className="mt-8 font-serif text-4xl leading-tight">Sign in</h1>
          <p className="mt-3 text-lg text-paper/85">Enter your email and we’ll send you a sign-in code. No password needed.</p>
          {one(q.out) === '1' && !error && <p className={`mt-6 ${ui.note}`}>You’re signed out.</p>}
          {error && <p role="alert" className={`mt-6 ${ui.error}`}>{error}</p>}
          <form method="post" action="/api/auth/code" className="mt-8 space-y-6">
            <input type="hidden" name="next" value={next} />
            <div>
              <label htmlFor="email" className={ui.label}>Email</label>
              <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" className={ui.input} />
            </div>
            <button type="submit" className={`${ui.primary} w-full sm:w-auto`}>Email me a code</button>
          </form>
          <p className="mt-8 text-sm text-muted">We only use your email to sign you in and to send messages you ask for.</p>
        </>
      )}
    </main>
  )
}
