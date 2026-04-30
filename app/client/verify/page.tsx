'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function VerifyContent() {
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.location.href = '/client'
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="text-[#C9A84C] text-2xl mb-4 animate-pulse">◆</div>
            <p className="text-[#F5EFE3]/50 text-sm">Verifying your link...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-400 text-2xl mb-4">✕</div>
            <p className="text-[#F5EFE3]/50 text-sm mb-6">
              This link is invalid or has expired.
            </p>
            <a href="/client/login"
              className="text-[10px] tracking-[2px] uppercase bg-[#C9A84C] text-[#141414] px-6 py-3 inline-block">
              Request New Link
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}
