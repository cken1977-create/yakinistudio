// VIZIONZ SANKOFA · pure navigation-stack logic for the admin back control.
// Kept free of browser APIs so it can be unit-tested.

export const MAX_STACK = 40

/**
 * Apply an arrival at `url` to the stack of visited /admin URLs.
 * - same URL as the top: nothing changes (reload / re-render)
 * - same URL as the entry below the top: a step back, pop
 * - same screen as the top with different filters: replace the top
 * - anything else: push
 */
export function applyArrival(stack: string[], url: string): { stack: string[]; isBack: boolean } {
  const next = [...stack]
  const top = next[next.length - 1]
  if (top === url) return { stack: next, isBack: false }
  if (next.length >= 2 && next[next.length - 2] === url) {
    next.pop()
    return { stack: next, isBack: true }
  }
  if (top && top.split('?')[0] === url.split('?')[0]) {
    next[next.length - 1] = url
    return { stack: next, isBack: false }
  }
  next.push(url)
  if (next.length > MAX_STACK) next.splice(0, next.length - MAX_STACK)
  return { stack: next, isBack: false }
}

/** The /admin URL before the current one, or null. */
export function previousFrom(stack: string[], currentUrl: string): string | null {
  if (stack.length < 2 || stack[stack.length - 1] !== currentUrl) return null
  const prev = stack[stack.length - 2]
  return prev && prev.startsWith('/admin') ? prev : null
}
