'use client'

// VIZIONZ SANKOFA · keep a list screen's filters in the URL
// So "open an item, then back" returns to the same search / tab / filter.
// Uses history.replaceState (Next.js keeps useSearchParams in sync) so typing
// in a search box does not refetch the page or add history entries.

import { useCallback, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export function useUrlState<T extends string>(
  key: string,
  defaultValue: T,
  allowed?: readonly T[],
): [T, (v: T) => void] {
  const searchParams = useSearchParams()
  const [value, setValue] = useState<T>(() => {
    const raw = searchParams?.get(key)
    if (raw === null || raw === undefined) return defaultValue
    if (allowed && !allowed.includes(raw as T)) return defaultValue
    return raw as T
  })

  const set = useCallback(
    (next: T) => {
      setValue(next)
      if (typeof window === 'undefined') return
      const url = new URL(window.location.href)
      if (next === defaultValue || next === '') url.searchParams.delete(key)
      else url.searchParams.set(key, next)
      window.history.replaceState(null, '', url.pathname + url.search + url.hash)
    },
    [key, defaultValue],
  )

  return [value, set]
}

/** Boolean flavour ("1" in the URL when on). */
export function useUrlFlag(key: string): [boolean, (v: boolean) => void] {
  const [raw, setRaw] = useUrlState<string>(key, '')
  return [raw === '1', (v: boolean) => setRaw(v ? '1' : '')]
}
