import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyOps, type EditOp } from '@yakini/edits'
import type { SiteDoc } from '@yakini/site-schema'
import { EditSession, type Transport } from '@/lib/editor/session'
import { kitDoc } from './browser'

/** A pretend server holding the saved draft, applying ops exactly as the real route does. */
function server(start: SiteDoc) {
  const s = { doc: start, rev: 0, calls: [] as { baseRev: number; ops: EditOp[]; source: string }[], fail: 0 as number, offline: false }
  const t: Transport = {
    async save(b) {
      s.calls.push(structuredClone(b))
      if (s.offline) throw new TypeError('Failed to fetch')
      if (b.baseRev !== s.rev) return { ok: false, conflict: true, rev: s.rev, doc: s.doc, error: 'This site was changed in another window. We loaded the latest version.' }
      const r = applyOps(s.doc, b.ops, ctx, { internal: b.source === 'undo' || b.source === 'redo' })
      if (!r.ok) return { ok: false, status: 422, error: r.error }
      s.doc = r.doc; s.rev++
      return { ok: true, rev: s.rev }
    },
    async load() { return { doc: s.doc, rev: s.rev } },
  }
  return { s, t }
}
const ctx = { allowedAssetIds: new Set<string>() }
const headline = (v: string): EditOp => ({ op: 'update_field', pageId: 'home', sectionId: 'hero', path: '/headline', value: v })
const hero = (d: SiteDoc) => (d.pages[0].sections.find((x) => x.id === 'hero')!.props as { headline: string }).headline

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('editor working copy', () => {
  it('shows a change at once and saves it 1.5 s after the last change, typing folded into one save and one undo', async () => {
    const { s, t } = server(kitDoc())
    const e = new EditSession(kitDoc(), 0, ctx, t)
    const original = hero(e.current)
    for (const v of ['W', 'We', 'We c', 'We cater']) { e.apply([headline(v)], { label: 'Headline', coalesceKey: 'home/hero/headline' }); vi.advanceTimersByTime(300) }
    expect(hero(e.current)).toBe('We cater')
    expect(e.getSnapshot().save).toBe('unsaved')
    await vi.advanceTimersByTimeAsync(1500)
    expect(s.calls).toHaveLength(1)
    expect(hero(s.doc)).toBe('We cater')
    expect(e.getSnapshot()).toMatchObject({ save: 'saved', rev: 1, canUndo: true })
    e.undo()
    expect(hero(e.current)).toBe(original)
    await vi.advanceTimersByTimeAsync(1500)
    expect(hero(s.doc)).toBe(original)
    e.redo()
    await vi.advanceTimersByTimeAsync(1500)
    expect(hero(s.doc)).toBe('We cater')
    expect(s.calls.map((c) => c.source)).toEqual(['click', 'undo', 'redo'])
  })

  it('a change made while a save is on its way is saved after it, never lost', async () => {
    const { s, t } = server(kitDoc())
    let release!: () => void
    const slow: Transport = { ...t, save: (b) => new Promise((ok) => { release = () => ok(t.save(b)) }) }
    const e = new EditSession(kitDoc(), 0, ctx, slow)
    e.apply([headline('First')], { label: 'Headline', coalesceKey: 'k' })
    await vi.advanceTimersByTimeAsync(1500) // save of "First" starts
    e.apply([headline('First and more')], { label: 'Headline', coalesceKey: 'k' })
    release()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(1500)
    release?.()
    await vi.advanceTimersByTimeAsync(10)
    expect(hero(s.doc)).toBe('First and more')
    expect(e.getSnapshot().save).toBe('saved')
  })

  it('when another window saved first, takes the latest version and says so', async () => {
    const { s, t } = server(kitDoc())
    const e = new EditSession(kitDoc(), 0, ctx, t)
    // Another window saves a change.
    await t.save({ baseRev: 0, ops: [{ op: 'update_business', field: 'tagline', value: 'Other window' }], source: 'click' })
    e.apply([headline('This window')], { label: 'Headline' })
    await vi.advanceTimersByTimeAsync(1500)
    const snap = e.getSnapshot()
    expect(snap.notice).toEqual({ kind: 'conflict', text: 'This site was changed in another window. We loaded the latest version.' })
    expect(snap.doc.business.tagline).toBe('Other window')
    expect(snap.rev).toBe(1)
    expect(snap.canUndo).toBe(false)
    expect(s.doc.business.tagline).toBe('Other window')
  })

  it('keeps changes while offline and saves them when the connection is back', async () => {
    const { s, t } = server(kitDoc())
    const e = new EditSession(kitDoc(), 0, ctx, t)
    s.offline = true
    e.apply([headline('Saved later')], { label: 'Headline' })
    await vi.advanceTimersByTimeAsync(1500)
    expect(e.getSnapshot().save).toBe('offline')
    expect(e.hasUnsaved).toBe(true)
    s.offline = false
    await vi.advanceTimersByTimeAsync(2000)
    expect(hero(s.doc)).toBe('Saved later')
    expect(e.getSnapshot()).toMatchObject({ save: 'saved', notice: null })
  })

  it('refuses a change that breaks a rule, without touching the working copy', () => {
    const { t } = server(kitDoc())
    const e = new EditSession(kitDoc(), 0, ctx, t)
    const before = e.current
    expect(e.apply([headline('')], { label: 'Headline' }).ok).toBe(false)
    expect(e.apply([headline('x'.repeat(91))], { label: 'Headline' }).ok).toBe(false)
    expect(e.current).toBe(before)
    expect(e.hasUnsaved).toBe(false)
  })
})
