import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Budget: the site renderer adds 0 KB of client JavaScript (D1). Every section is a server
 * component: no 'use client' anywhere in the package, and no event handlers or hooks that would
 * need hydration. (Rendered pages carry no <script> except JSON-LD: render.test.tsx.)
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|jsx?)$/.test(f) && !/\.test\./.test(f) ? [p] : []
  })
}

describe('renderer ships no client JavaScript', () => {
  const src = files(join(__dirname))
  it('no client components', () => {
    for (const f of src) expect(readFileSync(f, 'utf8'), f).not.toMatch(/^\s*['"]use client['"]/m)
  })
  it('no React hooks or DOM event handlers', () => {
    for (const f of src) {
      const s = readFileSync(f, 'utf8')
      expect(s, f).not.toMatch(/\buse(State|Effect|LayoutEffect|Reducer|Ref|Transition|ActionState)\s*\(/)
      expect(s, f).not.toMatch(/\son(Click|Change|Submit|Input|KeyDown|Focus|Blur)=\{/)
    }
  })
})
