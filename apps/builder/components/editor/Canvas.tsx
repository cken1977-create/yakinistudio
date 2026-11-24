'use client'
import { useMemo, type CSSProperties } from 'react'
import { SiteView, type RenderContext } from '@yakini/sections'
import type { Page, SiteDoc } from '@yakini/site-schema'

/**
 * The live page in the editor (spec 10.2): the same components as the published site, so what the
 * owner sees is what visitors get. Clicking a section selects it; links and forms inside the canvas
 * don't navigate or submit. Changed sections are outlined after a change. Keyboard users pick
 * sections from the Pages panel's section list, which lists the same sections in order.
 */
export function Canvas({ doc, page, view, selected, changed, onSelect, onPage, imageUrl, preview }: {
  doc: SiteDoc
  page: Page
  view: 'desktop' | 'phone'
  selected: string | null
  changed: readonly string[]
  onSelect: (id: string | null) => void
  onPage: (pageId: string) => void
  imageUrl: (id: string) => string | null
  /** True while showing a proposed chat change that isn't applied yet. */
  preview?: boolean
}) {
  const ctx = useMemo<RenderContext>(() => ({
    doc, page, mode: 'draft',
    hrefForPage: (p) => `#page-${p.id}`,
    image: (id) => { const src = imageUrl(id); return src ? { src, width: 1600, height: 1000 } : null },
    formAction: () => null,
    reportUrl: null,
    today: null,
  }), [doc, page, imageUrl])

  const highlight = changed.filter((c) => c.startsWith(`${page.id}/`)).map((c) => c.slice(page.id.length + 1))
  const css = [
    selected ? `[data-ys-section="${cssEscape(selected)}"]{outline:3px solid #C9A14A;outline-offset:-3px}` : '',
    ...highlight.map((id) => `[data-ys-section="${cssEscape(id)}"]{box-shadow:inset 0 0 0 4px rgba(201,161,74,.55)}`),
    '[data-ys-section]{cursor:pointer;scroll-margin-top:80px}',
    '[data-ys-section]:hover{outline:2px dashed rgba(201,161,74,.7);outline-offset:-2px}',
  ].join('')

  const click = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const a = target.closest('a')
    if (a) {
      e.preventDefault()
      const m = /^#page-(.+)$/.exec(a.getAttribute('href') ?? '')
      if (m && doc.pages.some((p) => p.id === m[1])) { onPage(m[1]); return }
    }
    const el = target.closest('[data-ys-section]')
    onSelect(el?.getAttribute('data-ys-section') ?? null)
  }

  return (
    <div className={view === 'phone' ? 'flex justify-center px-3 py-6' : ''}>
      <style>{css}</style>
      <div
        className={view === 'phone' ? 'w-full max-w-[390px] overflow-hidden rounded-[28px] border-8 border-black shadow-2xl' : 'bg-white'}
        style={preview ? ({ outline: '3px dashed #C9A14A', outlineOffset: '-3px' } as CSSProperties) : undefined}
        onClickCapture={click} onSubmitCapture={(e) => e.preventDefault()}
        data-preview={view} aria-label={`${page.title} page`} role="region"
      >
        <SiteView ctx={ctx} />
      </div>
    </div>
  )
}

const cssEscape = (s: string) => s.replace(/[^a-z0-9-]/gi, '')
