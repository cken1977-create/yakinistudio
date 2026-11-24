'use client'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { EditOp } from '@yakini/edits'
import { sampleImageById } from '@yakini/kits'
import type { SiteDoc } from '@yakini/site-schema'
import { EditSession, type Transport } from '@/lib/editor/session'
import { Canvas } from './Canvas'
import { ChatPanel, type Proposal } from './ChatPanel'
import { EditorContext, panel, type EditorApi, type Photo } from './context'
import { Inspector } from './Inspector'
import { PagesPanel } from './PagesPanel'
import { HelpPanel, KitPanel } from './SidePanels'
import { Tour } from './Tour'
import { TOUR_STEPS, tourStart, type TourStep } from '@/lib/editor/tutorial'

/**
 * The editor (spec 10.2). Desktop (≥ 1024 px): pages on the left, the live page in the middle, and
 * Edit · Chat · Kit · Help on the right. Phone: the page full width, with Pages · Edit · Chat ·
 * Publish along the bottom opening as sheets. Everything saves on its own; Undo/Redo go back and
 * forth through this visit's changes.
 */
export type EditorProps = {
  siteId: string
  siteName: string
  doc: SiteDoc
  rev: number
  photos: Photo[]
  kitSampleIds: string[]
  anonymous: boolean
  canManageVersions: boolean
  welcome: boolean
  /** Open on this page (links from the tutorial and tests). */
  initialPageId?: string
  /** Tour steps this person has finished on this site (members; drafts keep theirs in the browser). */
  tutorialDone: string[]
  /** Start the tour at this step ("Show me" on the written tutorial). */
  tourStep?: string
}

type Tab = 'edit' | 'chat' | 'kit' | 'help'

function transport(siteId: string): Transport {
  return {
    async save(body) {
      const res = await fetch(`/api/sites/${siteId}/draft`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true })
      const out = await res.json().catch(() => ({})) as { rev?: number; doc?: SiteDoc; error?: string; conflict?: boolean }
      if (res.ok && typeof out.rev === 'number') return { ok: true, rev: out.rev }
      if (res.status === 409 && out.conflict && out.doc && typeof out.rev === 'number') return { ok: false, conflict: true, rev: out.rev, doc: out.doc, error: out.error ?? 'This site was changed in another window. We loaded the latest version.' }
      if (res.status >= 500 || res.status === 429) throw new Error('retry')
      return { ok: false, status: res.status, error: out.error ?? 'That change couldn’t be saved.' }
    },
    async load() {
      const res = await fetch(`/api/drafts/${siteId}`, { cache: 'no-store' })
      if (!res.ok) return null
      return await res.json() as { rev: number; doc: SiteDoc }
    },
  }
}

export function Editor(props: EditorProps) {
  const [session] = useState(() => new EditSession(props.doc, props.rev, { allowedAssetIds: new Set([...props.photos.map((p) => p.id), ...props.kitSampleIds]), maxPages: 5 }, transport(props.siteId)))
  const snap = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot)
  const doc = snap.doc
  const [pageId, setPageId] = useState(props.initialPageId && doc.pages.some((p) => p.id === props.initialPageId) ? props.initialPageId : doc.pages[0].id)
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView] = useState<'desktop' | 'phone'>('desktop')
  const [tab, setTab] = useState<Tab>('edit')
  const [sheet, setSheet] = useState<null | 'pages' | 'edit' | 'chat' | 'publish'>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [photos, setPhotos] = useState<Photo[]>(props.photos)
  const [announce, setAnnounce] = useState('')
  const [chatPrefill, setChatPrefill] = useState<string | undefined>()

  const [tourAt, setTourAt] = useState<number | null>(null)
  const page = doc.pages.find((p) => p.id === pageId) ?? doc.pages[0]

  // The tour: first visit, a half-finished tour, or "Show me" from the written tutorial.
  const tourKey = `yk-tour-${props.siteId}`
  useEffect(() => {
    let done = props.tutorialDone
    if (props.anonymous) { try { done = JSON.parse(localStorage.getItem(tourKey) ?? '[]') as string[] } catch { done = [] } }
    const asked = TOUR_STEPS.findIndex((s) => s.id === props.tourStep)
    const at = asked >= 0 ? asked : tourStart(done)
    if (at === null) return
    const t = setTimeout(() => setTourAt(at), 400) // let the page settle first
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const stepDone = useCallback((id: string) => {
    if (props.anonymous) {
      try { const d = new Set(JSON.parse(localStorage.getItem(tourKey) ?? '[]') as string[]); d.add(id); localStorage.setItem(tourKey, JSON.stringify([...d])) } catch { /* private mode: the tour just starts again next time */ }
      return
    }
    void fetch(`/api/sites/${props.siteId}/tutorial`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ step: id }) }).catch(() => {})
  }, [props.anonymous, props.siteId, tourKey])
  useEffect(() => () => session.dispose(), [session])

  // Save before leaving; warn only if something truly couldn't be saved yet.
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => { if (session.hasUnsaved) { void session.flush(); e.preventDefault() } }
    const hide = () => { if (document.visibilityState === 'hidden') void session.flush() }
    window.addEventListener('beforeunload', before)
    document.addEventListener('visibilitychange', hide)
    return () => { window.removeEventListener('beforeunload', before); document.removeEventListener('visibilitychange', hide) }
  }, [session])

  const undoRedo = useCallback((which: 'undo' | 'redo') => {
    const label = which === 'undo' ? session.undo() : session.redo()
    if (label) setAnnounce(`${which === 'undo' ? 'Undid' : 'Redid'}: ${label}`)
  }, [session])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable]')) return // the field's own undo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undoRedo(e.shiftKey ? 'redo' : 'undo') }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); undoRedo('redo') }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [undoRedo])

  const imageUrl = useCallback((id: string) => {
    const sample = sampleImageById(id)
    if (sample) return `/${sample.storagePath}`
    // The business's own photos come through the access-checked asset route (its tenant only).
    return /^[0-9a-f-]{36}$/.test(id) ? `/api/drafts/${props.siteId}/assets/${id}` : null
  }, [props.siteId])

  const refreshPhotos = useCallback(async () => {
    const res = await fetch(`/api/sites/${props.siteId}/assets`, { cache: 'no-store' }).catch(() => null)
    if (!res?.ok) return
    const out = await res.json() as { photos: Photo[] }
    session.setAssets(out.photos.map((p) => p.id))
    setPhotos(out.photos)
  }, [props.siteId, session])

  const select = useCallback((id: string | null) => {
    setSelected(id)
    setProposal(null)
    if (id) { setTab('edit'); if (window.matchMedia('(max-width: 1023px)').matches) setSheet('edit') }
  }, [])

  const api: EditorApi = {
    siteId: props.siteId, doc, session, pageId: page.id, selected, select,
    showPage: (id) => { setPageId(id); setSelected(null); window.scrollTo({ top: 0 }) },
    change: (ops: EditOp[], label: string, coalesceKey?: string) => { const r = session.apply(ops, { label, coalesceKey }); return r.ok ? null : r.error },
    photos, refreshPhotos, imageUrl, canManageVersions: props.canManageVersions, anonymous: props.anonymous,
  }

  const prepare = (p: TourStep['prepare']) => {
    if (p === 'select-first-section') {
      const first = page.sections.find((x) => !x.hidden && x.type !== 'header' && x.type !== 'footer')
      if (first) { setSelected(first.id); setTab('edit'); if (window.matchMedia('(max-width: 1023px)').matches) setSheet('edit') }
    } else { setSelected(null); setSheet(null); setTab('edit') }
  }

  const shown = proposal ? proposal.doc : doc
  const shownPage = shown.pages.find((p) => p.id === page.id) ?? shown.pages[0]
  const changed = proposal ? proposal.changed : snap.changed
  const status = { saved: 'Saved', unsaved: 'Saving soon…', saving: 'Saving…', offline: 'Offline, will save' }[snap.save]

  const chat = <ChatPanel proposal={proposal} setProposal={setProposal} prefill={chatPrefill} />
  const panelFor = (t: Tab) => t === 'edit' ? <Inspector /> : t === 'chat' ? chat : t === 'kit' ? <KitPanel /> : <HelpPanel onAskChat={(q) => { setChatPrefill(q); setTab('chat'); if (window.matchMedia('(max-width: 1023px)').matches) setSheet('chat') }} onStartTour={() => { setSheet(null); setTourAt(0) }} />

  return (
    <EditorContext.Provider value={api}>
      <div className="min-h-screen bg-[#1a1714] text-paper">
        <p className="sr-only" aria-live="polite">{announce}</p>
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-paper/10 bg-ink/95 px-3 py-2 backdrop-blur lg:px-4">
          <a href={props.anonymous ? `/d/${props.siteId}` : '/sites'} className="hidden font-serif text-lg sm:inline">Yakini <span className="text-gold">Studio</span></a>
          <span className="min-w-0 flex-1 truncate font-semibold" title={props.siteName}>{props.siteName}</span>
          <span className={`hidden text-sm sm:inline ${snap.save === 'offline' ? 'text-[#F2B8A8]' : 'text-muted'}`} role="status">{status}</span>
          <button type="button" className={panel.icon} disabled={!snap.canUndo} onClick={() => undoRedo('undo')} aria-label="Undo" title="Undo (Ctrl+Z)">↶</button>
          <button type="button" className={panel.icon} disabled={!snap.canRedo} onClick={() => undoRedo('redo')} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">↷</button>
          <nav aria-label="Preview size" data-tour="view" className="hidden rounded-full border border-paper/20 p-1 text-sm lg:flex">
            {(['desktop', 'phone'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`min-h-9 rounded-full px-3 ${view === v ? 'bg-paper text-ink' : 'text-paper/85'}`}>{v === 'desktop' ? 'Desktop' : 'Phone'}</button>
            ))}
          </nav>
          <a href={`/d/${props.siteId}${page.slug ? `/${page.slug}` : ''}`} target="_blank" rel="noopener" className={`${panel.btn} hidden lg:inline-flex`} onClick={() => void session.flush()}>Preview</a>
          {props.canManageVersions && <a href={`/sites/${props.siteId}/versions`} className={`${panel.btn} hidden lg:inline-flex`} onClick={() => void session.flush()}>Versions</a>}
          <button type="button" data-tour="publish" className={`${panel.primary} hidden lg:inline-flex`} disabled title="Publishing opens soon">Publish</button>
        </header>

        {props.anonymous && (
          <div className="border-b border-gold/30 bg-gold/10 px-4 py-2 text-sm">
            You’re editing a draft kept in this browser for 14 days. <a href={`/claim/${props.siteId}`} className="font-semibold underline underline-offset-4">Make it mine</a> to keep it and use it anywhere.
          </div>
        )}
        {snap.notice && (
          <div role="alert" className="flex items-start justify-between gap-3 border-b border-paper/10 bg-[#3a1d17] px-4 py-3 text-sm">
            <span>{snap.notice.text}</span>
            <button type="button" className="underline underline-offset-4" onClick={() => session.dismissNotice()}>OK</button>
          </div>
        )}
        {props.welcome && tourAt === null && <Welcome />}
        {tourAt !== null && <Tour start={tourAt} onPrepare={prepare} onStepDone={stepDone} onClose={() => setTourAt(null)} />}

        <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)_24rem]">
          <aside data-tour="pages" className="hidden max-h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-paper/10 lg:sticky lg:top-14 lg:block" aria-label="Pages">
            <PagesPanel />
          </aside>
          <main className="min-w-0 pb-24 lg:pb-0">
            <Canvas doc={shown} page={shownPage} view={view} selected={selected} changed={changed} onSelect={select} onPage={api.showPage} imageUrl={imageUrl} preview={Boolean(proposal)} />
          </main>
          <aside className="hidden max-h-[calc(100vh-3.5rem)] flex-col border-l border-paper/10 lg:sticky lg:top-14 lg:flex" aria-label="Editing tools">
            <div role="tablist" aria-label="Editing tools" className="flex gap-1 border-b border-paper/10 p-2">
              {(['edit', 'chat', 'kit', 'help'] as const).map((t) => (
                <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)} data-tour={t === 'chat' ? 'chat' : undefined}
                  className={`min-h-10 flex-1 rounded-full text-sm font-semibold ${tab === t ? 'bg-paper text-ink' : 'text-paper/85 hover:text-paper'}`}>{{ edit: 'Edit', chat: 'Chat', kit: 'Kit', help: 'Help' }[t]}</button>
              ))}
            </div>
            <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto">{panelFor(tab)}</div>
          </aside>
        </div>

        {/* Phone: bottom bar and sheets */}
        <nav aria-label="Editor" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-paper/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          {([['pages', 'Pages'], ['edit', 'Edit'], ['chat', 'Chat'], ['publish', 'Publish']] as const).map(([k, l]) => (
            <button key={k} type="button" data-tour={`${k}-phone`} aria-pressed={sheet === k} onClick={() => setSheet(sheet === k ? null : k)} className={`min-h-14 text-sm font-semibold ${sheet === k ? 'text-gold' : 'text-paper'}`}>{l}</button>
          ))}
        </nav>
        {sheet && (
          <div className="fixed inset-x-0 bottom-14 z-20 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-paper/15 bg-[#121010] shadow-2xl lg:hidden" role="dialog" aria-label={sheet}>
            <div className="sticky top-0 flex justify-between border-b border-paper/10 bg-[#121010] px-4 py-2">
              <span className="text-sm text-muted">{status}</span>
              <button type="button" className="text-sm underline underline-offset-4" onClick={() => setSheet(null)}>Close</button>
            </div>
            {sheet === 'pages' && <PagesPanel onPicked={() => setSheet(null)} />}
            {sheet === 'edit' && <Inspector />}
            {sheet === 'chat' && <div className="h-[60vh]">{chat}</div>}
            {sheet === 'publish' && (
              <div className="space-y-3 p-5">
                <h2 className={panel.h2}>Publish</h2>
                <p className="text-paper/85">Publishing opens soon. Your changes are saved, and you can preview the whole site any time.</p>
                <a href={`/d/${props.siteId}`} className={panel.btn}>Preview the site</a>
                {props.canManageVersions && <a href={`/sites/${props.siteId}/versions`} className={`${panel.btn} ml-2`}>Versions</a>}
              </div>
            )}
          </div>
        )}
      </div>
    </EditorContext.Provider>
  )
}

function Welcome() {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className="flex items-start justify-between gap-3 border-b border-paper/10 bg-paper/5 px-4 py-3 text-sm">
      <span><strong>It’s yours.</strong> Tap any part of the page to change it, or ask for a change in Chat. Everything saves on its own.</span>
      <button type="button" className="underline underline-offset-4" onClick={() => setOpen(false)}>OK</button>
    </div>
  )
}
