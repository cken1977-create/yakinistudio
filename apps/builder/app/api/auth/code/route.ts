import { EMAIL_RE, emailHash, getAuth, safeNext } from '@/lib/server/auth'
import { withRuntime } from '@/lib/server/draft-flow'
import { clientIp, hashIp, originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'
import { seeOther, signinPath, writeSigninState } from '@/lib/server/signin'

/**
 * POST /api/auth/code: "Send me a sign-in code" (spec 5.4 step 2). Email only. The person asked for
 * this email, so it is allowed (R5). Limited per IP and per address so it can't be used to flood an
 * inbox. The answer never says whether the address already has an account.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  return withRuntime(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return seeOther(request, signinPath('/sites', { e: 'origin' }))
    const form = await readCappedForm(request, 4 * 1024)
    const next = safeNext(form?.get('next'))
    const email = typeof form?.get('email') === 'string' ? (form!.get('email') as string).trim().toLowerCase() : ''
    if (!EMAIL_RE.test(email) || email.length > 254) return seeOther(request, signinPath(next, { e: 'email' }))

    const ip = hashIp(clientIp(request.headers), rt.ipPepper)
    const [ipOk, emailOk] = await Promise.all([
      rt.store.hitRateLimit(`signin:ip:${ip}`, 10, 3600),
      rt.store.hitRateLimit(`signin:email:${emailHash(email)}`, 5, 3600),
    ])
    if (!ipOk || !emailOk) return seeOther(request, signinPath(next, { e: 'rate' }))

    const callback = new URL('/auth/callback', request.url)
    callback.searchParams.set('next', next)
    const sent = await getAuth().sendCode(email, callback.toString())
    if (!sent.ok) return seeOther(request, signinPath(next, { e: 'send' }))

    await writeSigninState({ email, next })
    return seeOther(request, signinPath(next, { step: 'code' }))
  })
}
