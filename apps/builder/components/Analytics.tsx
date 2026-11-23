'use client'

import { useEffect } from 'react'

/**
 * Product analytics on the STUDIO only (spec 6.2, 14.7): never rendered by the client-site
 * renderer. Off unless NEXT_PUBLIC_POSTHOG_KEY is set. No session recordings, inputs masked,
 * person profiles only for identified (signed-in) users.
 */
export function StudioAnalytics() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
    if (!key || !host) return
    let cancelled = false
    import('posthog-js').then(({ default: posthog }) => {
      if (cancelled) return
      posthog.init(key, {
        api_host: host,
        person_profiles: 'identified_only',
        disable_session_recording: true,
        mask_all_text: false,
        mask_all_element_attributes: false,
        autocapture: { dom_event_allowlist: ['click', 'submit'] },
        capture_pageleave: false,
        persistence: 'localStorage',
        session_recording: { maskAllInputs: true },
      })
    })
    return () => { cancelled = true }
  }, [])
  return null
}
