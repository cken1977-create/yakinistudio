'use client'

import { useState } from 'react'
import { PATHS, type Lang } from '@/lib/academy/config'
import { UNSUB } from '@/lib/academy/copy'

export function UnsubscribeView({ lang, token }: { lang: Lang; token: string | null }) {
  const u = UNSUB[lang]
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'invalid' | 'error'>(token ? 'idle' : 'invalid')
  const go = async () => {
    setState('working')
    try {
      const r = await fetch('/api/class/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token }) })
      setState(r.ok ? 'done' : r.status === 404 ? 'invalid' : 'error')
    } catch { setState('error') }
  }
  return (
    <div className="ya-card" role="status" aria-live="polite">
      {state === 'done' ? (
        <><h1 className="ya-h2">{u.doneTitle}</h1><p className="ya-p">{u.doneBody}</p></>
      ) : state === 'invalid' ? (
        <><h1 className="ya-h2">{u.invalidTitle}</h1><p className="ya-p">{u.invalidBody}</p></>
      ) : (
        <>
          <h1 className="ya-h2">{u.title}</h1>
          <p className="ya-p" style={{ marginBottom: 20 }}>{u.body}</p>
          {state === 'error' && <p className="ya-alert" role="alert">{u.error}</p>}
          <button type="button" className="ya-btn ya-btn-inline" onClick={go} disabled={state === 'working'}>{state === 'working' ? u.working : u.button}</button>
        </>
      )}
      <p className="ya-p" style={{ marginTop: 24, fontSize: 14 }}><a href={PATHS[lang].landing}>{u.back}</a></p>
    </div>
  )
}
