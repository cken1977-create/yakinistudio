'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import type { BrandProfile } from '@/lib/demo/extract-brand'
import { contrastInk, FALLBACK_COLORS, withAlpha } from '@/lib/demo/extract-brand'
import { addonCards, PREVIEW_BANNER, previewFor } from '@/lib/demo/kit-previews'
import type { KitId } from '@/lib/pricing'
import { KITS } from '@/lib/pricing'

function monogram(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = (parts[0]?.[0] || 'Y') + (parts[1]?.[0] || '')
  return letters.toUpperCase()
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
  const addons = useMemo(() => addonCards(items), [items])
  const primary = brand.colors.primary || FALLBACK_COLORS.primary
  const accent = brand.colors.accent || brand.colors.primary || FALLBACK_COLORS.accent
  const ink = contrastInk(primary)
  const [logoFailed, setLogoFailed] = useState(false)
  const showLogo = brand.logoUrl && !logoFailed

  const style = {
    '--kd-bg': primary,
    '--kd-ink': ink,
    '--kd-accent': accent,
    '--kd-accent-soft': withAlpha(accent, 0.2),
    '--kd-line': withAlpha(ink, 0.18),
    '--kd-card': withAlpha(ink, 0.06),
  } as CSSProperties

  const visible = preview.nav.find((n) => n.id === tab) || preview.nav[0]

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
          <span className="kd-kit">{kit ? `${kit.name} kit · sample dashboard` : 'Sample dashboard'}</span>
        </div>
      </div>
      <div className="kd-body">
        <nav className="kd-nav" aria-label="Sample kit sections">
          {preview.nav.map((item) => (
            <button key={item.id} type="button" className={visible.id === item.id ? 'on' : ''} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="kd-main">
          <div className="kd-stats">
            {preview.stats.map((stat) => (
              <div key={stat.label} className="kd-stat">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                {stat.hint ? <em>{stat.hint}</em> : null}
              </div>
            ))}
          </div>
          <div className="kd-table">
            <h4>{preview.tableTitle}</h4>
            {preview.rows.map((row) => (
              <div key={row.title} className="kd-row">
                <div>
                  {row.title}
                  <span className="kd-meta">{row.meta}</span>
                </div>
                <span className="kd-status">{row.status}</span>
              </div>
            ))}
          </div>
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
