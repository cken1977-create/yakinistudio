import { CODE_RE, emailHash, getAuth } from '@/lib/server/auth'
import { withRuntime } from '@/lib/server/draft-flow'
import { clientIp, hashIp, originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'
import { clearSigninState, readSigninState, seeOther, signinPath } from '@/lib/server/signin'

/** POST /api/auth/verify: the 6-digit code from the sign-in email. Guessing is capped per address and IP. */
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  return withRuntime(async (rt) => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return seeOther(request, signinPath('/sites', { e: 'origin' }))
    const state = await readSigninState()
    if (!state) return seeOther(request, signinPath('/sites', { e: 'expired' }))

    const form = await readCappedForm(request, 1024)
    const code = typeof form?.get('code') === 'string' ? (form!.get('code') as string).replace(/\s+/g, '') : ''
    if (!CODE_RE.test(code)) return seeOther(request, signinPath(state.next, { step: 'code', e: 'code' }))

    const ip = hashIp(clientIp(request.headers), rt.ipPepper)
    const [ipOk, emailOk] = await Promise.all([
      rt.store.hitRateLimit(`verify:ip:${ip}`, 30, 3600),
      rt.store.hitRateLimit(`verify:email:${emailHash(state.email)}`, 10, 900),
    ])
    if (!ipOk || !emailOk) return seeOther(request, signinPath(state.next, { step: 'code', e: 'rate' }))

    const user = await getAuth().verifyCode(state.email, code)
    if (!user) return seeOther(request, signinPath(state.next, { step: 'code', e: 'code' }))
    await clearSigninState()
    return seeOther(request, state.next)
  })
}
