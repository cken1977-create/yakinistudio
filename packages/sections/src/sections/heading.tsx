import type { ReactNode } from 'react'

/** The page's first content section carries the page's only h1; every other section uses h2. */
export function Heading({ first, id, className, children }: { first: boolean; id?: string; className?: string; children: ReactNode }) {
  return first
    ? <h1 id={id} className={className ?? 'ys-h2'}>{children}</h1>
    : <h2 id={id} className={className ?? 'ys-h2'}>{children}</h2>
}
