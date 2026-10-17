// VIZIONZ SANKOFA · in-app navigation history (sessionStorage, per tab)
// Lets the back control know where the user came from inside /admin, and
// remembers scroll position per screen so "back" lands where they were.

import { applyArrival, previousFrom } from '@/lib/admin-nav/stack'

const STACK_KEY = 'vs-admin-nav-stack'
const SCROLL_KEY = 'vs-admin-nav-scroll'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full / disabled: navigation still works, just without memory
  }
}

export function getStack(): string[] {
  return read<string[]>(STACK_KEY, [])
}

/**
 * Record arrival at `url`. Returns true when this arrival was a step back
 * (the url equals the previous entry), so the caller can restore scroll.
 */
export function recordArrival(url: string): boolean {
  const { stack, isBack } = applyArrival(getStack(), url)
  write(STACK_KEY, stack)
  return isBack
}

/** The /admin screen the user was on before the current one, if any. */
export function previousAdminUrl(currentUrl: string): string | null {
  return previousFrom(getStack(), currentUrl)
}

export function saveScroll(url: string, y: number) {
  const map = read<Record<string, number>>(SCROLL_KEY, {})
  map[url.split('?')[0]] = Math.max(0, Math.round(y))
  write(SCROLL_KEY, map)
}

export function savedScroll(url: string): number | null {
  const map = read<Record<string, number>>(SCROLL_KEY, {})
  const v = map[url.split('?')[0]]
  return typeof v === 'number' ? v : null
}
