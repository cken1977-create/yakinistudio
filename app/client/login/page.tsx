'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function ClientLogin() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')

  async function handleLogin() {
    if (!email) return
    setStatus('loading')
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://yakini.digital/client' }
    })
    setStatus('sent')
  }

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="text-[#C9A84C] text-[10px] tracking-[4px] uppercase mb-4">
            Client Portal
          </div>
          <h1 className="font-bold text-[#F5EFE3] text-3xl mb-3">
            Yakini
          </h1>
          <p className="text-[#F5EFE3]/40 text-sm leading-relaxed">
            Enter your email to receive a secure login link.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="bg-[#1C1C1C] border border-[#C9A84C]/20 p-8 text-center">
            <div className="text-[#C9A84C] text-2xl mb-4">✓</div>
            <p className="text-[#F5EFE3]/60 text-sm leading-relaxed">
              Check your email for a secure login link.
              It expires in 1 hour.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] tracking-[3px] uppercase text-[#F5EFE3]/40">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-[#1C1C1C] border border-[#F5EFE3]/10 text-[#F5EFE3] px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={status === 'loading' || !email}
              className="bg-[#C9A84C] text-[#141414] text-[11px] tracking-[2.5px] uppercase py-4 font-medium hover:bg-[#E2C97E] transition-colors disabled:opacity-40"
            >
              {status === 'loading' ? 'Sending...' : 'Send Login Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
