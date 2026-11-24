/** Small JSON-pointer helpers over plain JSON values (RFC 6901 subset: no escapes, ids are [A-Za-z0-9_]). */
export type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

export function parsePointer(pointer: string): string[] {
  if (pointer === '') return []
  if (!/^(\/[A-Za-z0-9_]+)+$/.test(pointer)) throw new Error(`Bad field path "${pointer}"`)
  return pointer.split('/').slice(1)
}

function step(container: unknown, key: string): unknown {
  if (Array.isArray(container)) return /^\d+$/.test(key) ? container[Number(key)] : undefined
  if (container && typeof container === 'object') return Object.hasOwn(container, key) ? (container as Record<string, unknown>)[key] : undefined
  return undefined
}

export function getAt(root: unknown, pointer: string): unknown {
  return parsePointer(pointer).reduce<unknown>((c, k) => step(c, k), root)
}

/**
 * Set (or, with `value === undefined`, delete) the value at `pointer`, mutating `root`. The parent
 * must already exist; array indexes must be within the array (or equal to its length to append).
 */
export function setAt(root: unknown, pointer: string, value: unknown): void {
  const keys = parsePointer(pointer)
  if (!keys.length) throw new Error('Cannot replace the whole object')
  const parent = keys.slice(0, -1).reduce<unknown>((c, k) => step(c, k), root)
  const last = keys[keys.length - 1]
  if (Array.isArray(parent)) {
    if (!/^\d+$/.test(last)) throw new Error(`"${last}" is not a list position`)
    const i = Number(last)
    if (i > parent.length) throw new Error('List position is past the end')
    if (value === undefined) { if (i < parent.length) parent.splice(i, 1) } else parent[i] = value
    return
  }
  if (!parent || typeof parent !== 'object') throw new Error(`Nothing to change at "${pointer}"`)
  if (value === undefined) delete (parent as Record<string, unknown>)[last]
  else (parent as Record<string, unknown>)[last] = value
}
