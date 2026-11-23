import 'server-only'
import { cookies } from 'next/headers'
import { draftCookieName, draftTokenMatches } from './draft-token'
import type { Runtime } from './runtime'
import type { StoredDraft } from './store'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/**
 * The anonymous draft holder's access check (spec 5.2 g, 14.2). Only the browser holding the
 * draft cookie sees the draft; anything else (wrong token, expired, deleted, already claimed)
 * looks exactly like a missing page, so a draft id alone reveals nothing.
 */
export async function openDraft(rt: Runtime, siteId: string, now = Date.now()): Promise<StoredDraft | null> {
  if (!UUID.test(siteId)) return null
  const token = (await cookies()).get(draftCookieName(siteId))?.value
  if (!token) return null
  const draft = await rt.store.getDraft(siteId)
  if (!draft || draft.deleted || draft.claimed) return null
  if (!draft.expiresAt || draft.expiresAt.getTime() <= now) return null
  return draftTokenMatches(token, draft.tokenHash, rt.draftPepper) ? draft : null
}
