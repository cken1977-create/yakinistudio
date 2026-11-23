'use client'

import { startSetupUrl } from '@/lib/demo/start-url'
import { handoffFields, studioBuilds, type Handoff } from '@/lib/demo/handoff'

type Props = {
  handoff: Handoff
  name?: string
  website?: string
  kitId?: string
  sizeId?: string
  items: readonly string[]
}

/**
 * "Start my setup". With the studio hand-off on and a kit the studio builds, a normal top-level
 * form POST (not fetch, so no cross-site cookie trouble) to the studio; otherwise the existing link.
 */
export function StartSetup({ handoff, name, website, kitId, sizeId, items }: Props) {
  if (handoff && kitId && studioBuilds(kitId)) {
    return (
      <form method="post" action={handoff.action} style={{ display: 'contents' }}>
        {handoffFields({ name, website, kitId, sizeId, items }).map(([k, v], i) => <input key={`${k}-${i}`} type="hidden" name={k} value={v} />)}
        <button type="submit" className="db-btn">Start my setup</button>
      </form>
    )
  }
  return (
    <a className="db-btn" href={startSetupUrl({ name, website, kitId, sizeId })} target="_blank" rel="noopener noreferrer">
      Start my setup
    </a>
  )
}
