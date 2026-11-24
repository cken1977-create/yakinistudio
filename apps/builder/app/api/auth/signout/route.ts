import { getAuth } from '@/lib/server/auth'
import { withRuntime } from '@/lib/server/draft-flow'
import { originAllowed, requestOrigin } from '@/lib/server/request'
import { seeOther } from '@/lib/server/signin'

/** POST /api/auth/signout. A form post from the studio only, so another site can't sign people out. */
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  return withRuntime(async () => {
    if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
    await getAuth().signOut()
    return seeOther(request, '/signin?out=1')
  })
}
