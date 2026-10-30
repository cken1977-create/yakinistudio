import 'server-only'
import { funnel } from './db'
import { stopSequence } from './mailer'

/** Unsubscribe a lead by its email token and cancel every waiting follow-up. */
export async function unsubscribeToken(token: string, via: 'link' | 'one_click') {
  if (!/^[0-9a-f]{64}$/.test(token)) return false
  const r = await funnel<{ id: string } | null>('unsubscribe', { token, via })
  if (!r?.id) return false
  await stopSequence(r.id, 'unsubscribed')
  return true
}
