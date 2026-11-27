import { applyOps, emptyHistory, record, redo, undo, type EditContext, type EditOp, type History } from '@yakini/edits'
import type { SiteDoc } from '@yakini/site-schema'

/**
 * The editor's working copy (spec 10.3-10.5). Every change is applied here first (so the canvas
 * updates at once), kept for undo/redo, and saved to the server in order, 1.5 s after the last
 * change. The server re-checks everything and only saves on top of the rev this copy last saw:
 * if another window saved first, this copy takes the server's version and says so, so nothing is
 * silently overwritten. No React here, so it can be tested on its own.
 */
export type SaveState = 'saved' | 'unsaved' | 'saving' | 'offline'
export type Source = 'click' | 'chat' | 'undo' | 'redo'
type Batch = { ops: EditOp[]; source: Source; coalesceKey?: string }

export type Snapshot = {
  doc: SiteDoc
  rev: number
  save: SaveState
  canUndo: boolean
  canRedo: boolean
  /** A message for the owner (conflict, refused save, connection), or null. */
  notice: { kind: 'conflict' | 'error' | 'offline'; text: string } | null
  /** Sections changed by the last applied change, to highlight on the canvas. */
  changed: string[]
}

export type Transport = {
  save(body: { baseRev: number; ops: EditOp[]; source: Source }): Promise<
    | { ok: true; rev: number }
    | { ok: false; conflict: true; rev: number; doc: SiteDoc; error: string }
    | { ok: false; conflict?: false; status: number; error: string }
  >
  load(): Promise<{ rev: number; doc: SiteDoc } | null>
}

export const SAVE_DELAY_MS = 1500
const COALESCE_MS = 2000
const RETRY_MS = [2000, 5000, 15000, 30000]

export class EditSession {
  private doc: SiteDoc
  private rev: number
  private history: History = emptyHistory()
  private queue: Batch[] = []
  private inFlight = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private retries = 0
  private notice: Snapshot['notice'] = null
  private changed: string[] = []
  private lastEdit: { key: string; at: number } | null = null
  private listeners = new Set<() => void>()
  private snap: Snapshot

  constructor(doc: SiteDoc, rev: number, private ctx: EditContext, private transport: Transport, private now: () => number = Date.now) {
    this.doc = doc
    this.rev = rev
    this.snap = this.makeSnap()
  }

  // ------------------------------------------------------------------ store API for React
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  getSnapshot = () => this.snap
  private emit() { this.snap = this.makeSnap(); for (const l of this.listeners) l() }
  private makeSnap(): Snapshot {
    const pending = this.queue.length > 0 || this.inFlight
    const save: SaveState = this.notice?.kind === 'offline' ? 'offline' : this.inFlight ? 'saving' : pending ? 'unsaved' : 'saved'
    return { doc: this.doc, rev: this.rev, save, canUndo: this.history.past.length > 0, canRedo: this.history.future.length > 0, notice: this.notice, changed: this.changed }
  }

  get current(): SiteDoc { return this.doc }
  get hasUnsaved(): boolean { return this.queue.length > 0 || this.inFlight }
  dismissNotice() { this.notice = null; this.emit() }
  setAssets(ids: Iterable<string>) { this.ctx = { ...this.ctx, allowedAssetIds: new Set([...this.ctx.allowedAssetIds, ...ids]) } }

  /**
   * Apply a change. `coalesceKey` (e.g. a field path) folds quick repeated edits of the same field
   * into one undo step and one saved operation, so typing a word is one change, not twelve.
   */
  apply(ops: EditOp[], opts: { label: string; source?: 'click' | 'chat'; coalesceKey?: string }): { ok: true } | { ok: false; error: string } {
    const source = opts.source ?? 'click'
    const r = applyOps(this.doc, ops, this.ctx, { owner: source === 'click' })
    if (!r.ok) return { ok: false, error: r.error }
    const key = opts.coalesceKey
    const t = this.now()
    const fold = key && this.lastEdit?.key === key && t - this.lastEdit.at < COALESCE_MS && this.history.future.length === 0
    if (fold) {
      // Keep the first change's undo, take the newest value.
      const prev = this.history.past[this.history.past.length - 1]
      this.history = { past: [...this.history.past.slice(0, -1), { ...prev, applied: r.applied }], future: [] }
      const last = this.queue[this.queue.length - 1]
      if (last && last.coalesceKey === key && !this.sending(last)) last.ops = r.applied
      else this.queue.push({ ops: r.applied, source, coalesceKey: key })
    } else {
      this.history = record(this.history, { applied: r.applied, inverse: r.inverse, label: opts.label })
      this.enqueue({ ops: r.applied, source, coalesceKey: key })
    }
    this.lastEdit = key ? { key, at: t } : null
    this.doc = r.doc
    this.changed = [...r.changed]
    this.schedule()
    this.emit()
    return { ok: true }
  }

  undo(): string | null { return this.step('undo') }
  redo(): string | null { return this.step('redo') }

  private step(which: 'undo' | 'redo'): string | null {
    const s = which === 'undo' ? undo(this.history) : redo(this.history)
    if (!s) return null
    const ops = which === 'undo' ? s.entry.inverse : s.entry.applied
    const r = applyOps(this.doc, ops, this.ctx, { internal: true })
    if (!r.ok) { this.notice = { kind: 'error', text: 'That can’t be undone any more. Your work is saved.' }; this.history = emptyHistory(); this.emit(); return null }
    this.history = s.next
    this.lastEdit = null
    this.doc = r.doc
    this.changed = [...r.changed]
    this.enqueue({ ops, source: which })
    this.schedule()
    this.emit()
    return s.entry.label
  }

  private enqueue(b: Batch) {
    const last = this.queue[this.queue.length - 1]
    // Batches go in order; neighbours from the same source and without a fold key travel together.
    if (last && !this.sending(last) && last.source === b.source && !last.coalesceKey && !b.coalesceKey && last.ops.length + b.ops.length <= 60) last.ops = [...last.ops, ...b.ops]
    else this.queue.push(b)
  }

  /** The batch on its way to the server can't change any more. */
  private sending(b: Batch) { return this.inFlight && this.queue[0] === b }

  private schedule(delay = SAVE_DELAY_MS) {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => { this.timer = null; void this.flush() }, delay)
  }

  /** Save everything waiting, in order. Safe to call any time (e.g. before leaving the page). */
  async flush(): Promise<void> {
    if (this.inFlight) return
    while (this.queue.length) {
      const batch = this.queue[0]
      this.inFlight = true
      this.emit()
      let res: Awaited<ReturnType<Transport['save']>>
      try {
        res = await this.transport.save({ baseRev: this.rev, ops: batch.ops, source: batch.source })
      } catch {
        this.inFlight = false
        this.notice = { kind: 'offline', text: 'You’re offline or the connection dropped. Your changes are kept here and will save when you’re back.' }
        this.schedule(RETRY_MS[Math.min(this.retries++, RETRY_MS.length - 1)])
        this.emit()
        return
      }
      this.inFlight = false
      this.retries = 0
      if (this.notice?.kind === 'offline') this.notice = null
      if (res.ok) {
        this.rev = res.rev
        if (this.queue[0] === batch) this.queue.shift()
        continue
      }
      if (res.conflict) {
        // Another window saved first: take its version; this window's unsaved changes are dropped
        // rather than written over the other window's work.
        this.adopt(res.doc, res.rev, { kind: 'conflict', text: res.error })
        return
      }
      // Refused (shouldn't happen: the same checks ran here first). Reload what is really saved.
      const fresh = await this.transport.load().catch(() => null)
      if (fresh) this.adopt(fresh.doc, fresh.rev, { kind: 'error', text: `${res.error} We reloaded your last saved version.` })
      else { this.queue = []; this.notice = { kind: 'error', text: res.error }; this.emit() }
      return
    }
    this.emit()
  }

  /** Replace the working copy with a saved version (after a conflict, a restore, or a reload). */
  adopt(doc: SiteDoc, rev: number, notice: Snapshot['notice'] = null) {
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    this.doc = doc
    this.rev = rev
    this.queue = []
    this.history = emptyHistory()
    this.lastEdit = null
    this.changed = []
    this.notice = notice
    this.emit()
  }

  dispose() { if (this.timer) clearTimeout(this.timer); this.listeners.clear() }
}
