'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import type { BrandProfile } from '@/lib/demo/extract-brand'
import { contrastInk, FALLBACK_COLORS, withAlpha } from '@/lib/demo/extract-brand'
import { addonCards, PREVIEW_BANNER, previewFor, type PreviewKind, type PreviewRow } from '@/lib/demo/kit-previews'
import type { KitId } from '@/lib/pricing'
import { KITS } from '@/lib/pricing'

function monogram(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = (parts[0]?.[0] || 'Y') + (parts[1]?.[0] || '')
  return letters.toUpperCase()
}

const ORDER_CYCLE = ['New', 'In the window', 'Ready', 'Picked up'] as const

function cycleOrderStatus(current: string): string {
  const i = ORDER_CYCLE.findIndex((s) => s.toLowerCase() === current.toLowerCase())
  if (i >= 0) return ORDER_CYCLE[(i + 1) % ORDER_CYCLE.length]
  const aliases: Record<string, string> = {
    firing: 'Ready',
    scheduled: 'Ready',
    queued: 'On site',
    'on site': 'Done',
    'en route': 'On site',
    'at shipper': 'En route',
    dispatched: 'En route',
    done: 'New',
  }
  return aliases[current.toLowerCase()] || 'Ready'
}

function nextMenuStatus(current: string): string {
  const sold = /sold out|86/i.test(current)
  return sold ? 'On the board' : 'Sold out'
}

function rowActionLabel(kind: PreviewKind | undefined, row: PreviewRow): string {
  if (kind === 'menu') {
    return /sold out|86/i.test(row.status)
      ? `Sample: put ${row.title} back on the board`
      : `Sample: mark ${row.title} sold out`
  }
  if (kind === 'orders') return `Sample: advance ${row.title} to the next status`
  return `Sample: open ${row.title}`
}

export function DashboardPreview({
  brand,
  kitId,
  items,
}: {
  brand: BrandProfile
  kitId?: KitId
  items: string[]
}) {
  const kit = KITS.find((k) => k.id === kitId)
  const preview = previewFor(kitId)
  const [tab, setTab] = useState(preview.nav[0]?.id)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [opened, setOpened] = useState<string | null>(null)
  const [flash, setFlash] = useState('')
  const addons = useMemo(() => addonCards(items), [items])
  const primary = brand.colors.primary || FALLBACK_COLORS.primary
  const accent = brand.colors.accent || brand.colors.primary || FALLBACK_COLORS.accent
  const ink = contrastInk(primary)
  const [logoFailed, setLogoFailed] = useState(false)
  const showLogo = brand.logoUrl && !logoFailed

  // A different kit starts the preview fresh. Reset while rendering (React's pattern for state that
  // follows a prop), not in an effect, so there's no extra render with the old kit's state.
  const [shownKit, setShownKit] = useState(kitId)
  if (shownKit !== kitId) {
    setShownKit(kitId)
    setTab(preview.nav[0]?.id)
    setOverrides({})
    setOpened(null)
    setFlash('')
  }

  const style = {
    '--kd-bg': primary,
    '--kd-ink': ink,
    '--kd-accent': accent,
    '--kd-accent-soft': withAlpha(accent, 0.2),
    '--kd-line': withAlpha(ink, 0.18),
    '--kd-card': withAlpha(ink, 0.06),
  } as CSSProperties

  const visible = preview.nav.find((n) => n.id === tab) || preview.nav[0]
  const kind = visible?.kind || 'list'

  const onSelectTab = (id: string) => {
    setTab(id)
    setOpened(null)
    setFlash('')
  }

  const onRow = (row: PreviewRow, index: number) => {
    const key = `${visible.id}:${index}`
    if (kind === 'menu') {
      const current = overrides[key] || row.status
      const next = nextMenuStatus(current)
      setOverrides((cur) => ({ ...cur, [key]: next }))
      setFlash(`Sample data: ${row.title} is now “${next}.” In a live kit this would update your real menu.`)
      return
    }
    if (kind === 'orders') {
      const current = overrides[key] || row.status
      const next = cycleOrderStatus(current)
      setOverrides((cur) => ({ ...cur, [key]: next }))
      setFlash(`Sample data: ${row.title} is now “${next}.” In a live kit this would update the real ticket.`)
      return
    }
    setOpened((cur) => (cur === key ? null : key))
    setFlash(`Sample data: opened “${row.title}.” This is a preview, not a live record.`)
  }

  return (
    <div className="kd" style={style}>
      <div className="kd-banner">{PREVIEW_BANNER}</div>
      <div className="kd-top">
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="kd-logo" src={brand.logoUrl!} alt="" onError={() => setLogoFailed(true)} />
        ) : (
          <div className="kd-mono" style={{ color: primary, background: '#fff' }}>{monogram(brand.name)}</div>
        )}
        <div>
          <div className="kd-name">{brand.name}</div>
          <span className="kd-kit">{kit ? `${kit.name} kit · clickable sample` : 'Clickable sample'}</span>
        </div>
      </div>
      <div className="kd-body">
        <nav className="kd-nav" aria-label="Sample kit sections">
          {preview.nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={visible.id === item.id ? 'on' : ''}
              onClick={() => onSelectTab(item.id)}
              aria-current={visible.id === item.id ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="kd-main">
          <div className="kd-stats">
            {visible.stats.map((stat) => (
              <div key={stat.label} className="kd-stat">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                {stat.hint ? <em>{stat.hint}</em> : null}
              </div>
            ))}
          </div>
          <div className="kd-table">
            <h4>{visible.tableTitle}</h4>
            {visible.rows.map((row, index) => {
              const key = `${visible.id}:${index}`
              const status = overrides[key] || row.status
              const isOpen = opened === key
              return (
                <div key={key}>
                  <button
                    type="button"
                    className={`kd-row kd-row-btn${isOpen ? ' on' : ''}`}
                    onClick={() => onRow({ ...row, status }, index)}
                    aria-label={rowActionLabel(kind, { ...row, status })}
                    aria-pressed={kind === 'list' ? isOpen : undefined}
                  >
                    <div>
                      {row.title}
                      <span className="kd-meta">{row.meta}</span>
                    </div>
                    <span className="kd-status">{status}</span>
                  </button>
                  {isOpen ? (
                    <p className="kd-row-detail">
                      Sample record for {row.title}. {row.meta}. Status: {status}. Nothing here is saved.
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
          {flash ? <p className="kd-flash" role="status">{flash}</p> : null}
          {preview.tourUrl ? (
            <p className="kd-tour">
              <a href={preview.tourUrl} target="_blank" rel="noopener noreferrer">
                {preview.tourLabel || 'Open the full guided walkthrough'}
              </a>
              <span> Opens in a new tab, still sample data.</span>
            </p>
          ) : null}
          {addons.length ? (
            <div className="kd-addons">
              {addons.map((card) => (
                <div key={card.id} className="kd-addon">
                  <h4>{card.title}</h4>
                  <p className="kd-note">{card.detail}</p>
                </div>
              ))}
            </div>
          ) : null}
          <p className="kd-note">{preview.note}</p>
        </div>
      </div>
    </div>
  )
}
