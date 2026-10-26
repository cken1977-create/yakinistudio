'use client'
// Magic-link sign-in (pattern from Vizionz Sankofa's admin login).
// shouldCreateUser: false, so only people the owner added can get a link.
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })
    // Same message either way, so the form doesn't reveal who has an account.
    setState(error && error.status !== 400 && error.status !== 422 ? 'error' : 'sent')
  }

  if (state === 'sent') return <p className="card">If that email has access, a sign-in link is on its way. Check your inbox.</p>
  return (
    <form onSubmit={submit} className="card row">
      <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1 }} aria-label="Email" />
      <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Email me a link'}</button>
      {state === 'error' && <p className="bad" style={{ width: '100%' }}>Something went wrong. Try again in a minute.</p>}
    </form>
  )
}
