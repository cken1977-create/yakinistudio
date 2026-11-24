import { getAuth, safeNext } from '@/lib/server/auth'
import { withRuntime } from '@/lib/server/draft-flow'
import { clearSigninState, seeOther, signinPath } from '@/lib/server/signin'

/**
 * GET /auth/callback?code=…&next=…: the link in the sign-in email. The link works in the browser
 * that asked for it; in any other browser the person types the code instead (the page says so).
 * `next` is only ever a path on this studio.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  return withRuntime(async () => {
    const url = new URL(request.url)
    const next = safeNext(url.searchParams.get('next'))
    const code = url.searchParams.get('code') ?? ''
    if (!code || code.length > 512) return seeOther(request, signinPath(next, { e: 'link' }))
    const user = await getAuth().exchangeLink(code)
    if (!user) return seeOther(request, signinPath(next, { e: 'link' }))
    await clearSigninState()
    return seeOther(request, next)
  })
}
