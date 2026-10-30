'use client'
import { useState } from 'react'

export type KitCardData = {
  slug: string
  name: string
  audience: string
  pitch: string
  thumbnail: string | null
  url: string | null
  video: string | null
  blurb: string
}

export function shareText(k: KitCardData): string {
  return `Hi! Here's a short guided demo of ${k.blurb}. It takes about 5 minutes, uses sample data only, and there's nothing to sign up for:\n${k.url}`
}

export function emailSubject(k: KitCardData): string {
  return `A quick look: ${k.name} demo`
}

export function emailBody(k: KitCardData): string {
  return `Hi,\n\nHere's a short guided demo of ${k.blurb}. It takes about 5 minutes, uses sample data only, and there's nothing to sign up for:\n\n${k.url}\n` +
    (k.video ? `\nPrefer to watch? Here's the narrated video version:\n${k.video}\n` : '') +
    `\nHappy to walk you through it live if that's easier.\n`
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for browsers without the async clipboard API.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    document.body.removeChild(ta)
    return ok
  }
}

export function KitCard({ kit }: { kit: KitCardData }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const live = !!kit.url
  const panelId = `share-${kit.slug}`

  async function doCopy(text: string, label: string) {
    setNote((await copy(text)) ? `${label} copied` : 'Could not copy. Select the text and copy it.')
    window.setTimeout(() => setNote(''), 2500)
  }

  const sms = live ? `sms:?&body=${encodeURIComponent(shareText(kit))}` : undefined
  const mailto = live ? `mailto:?subject=${encodeURIComponent(emailSubject(kit))}&body=${encodeURIComponent(emailBody(kit))}` : undefined

  return (
    <article className="rp-card" data-kit={kit.slug}>
      {live ? (
        <a className="rp-thumb" href={kit.url!} target="_blank" rel="noopener noreferrer" aria-label={`Open the ${kit.name} tour`}>
          {kit.thumbnail
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={kit.thumbnail} alt={`${kit.name} demo preview`} loading="lazy" />
            : <span className="rp-thumb-empty">Y</span>}
        </a>
      ) : (
        <div className="rp-thumb">
          <span className="rp-thumb-empty">Y</span>
          <span className="rp-badge">Coming soon</span>
        </div>
      )}
      <div className="rp-body">
        <p className="rp-aud">{kit.audience}</p>
        <h2 className="rp-name">{kit.name}</h2>
        <p className="rp-pitch">{kit.pitch}</p>
        <div className="rp-actions">
          {live ? (
            <a className="rp-act rp-act-primary" href={kit.url!} target="_blank" rel="noopener noreferrer" data-action="tour">Open tour</a>
          ) : (
            <span className="rp-act rp-act-primary" aria-disabled="true">Open tour</span>
          )}
          {kit.video ? (
            <a className="rp-act" href={kit.video} target="_blank" rel="noopener noreferrer" data-action="video">Watch video</a>
          ) : (
            <span className="rp-act" aria-disabled="true">Watch video</span>
          )}
          <button type="button" className="rp-act" data-action="share" disabled={!live}
            aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(o => !o)}>
            Share
          </button>
        </div>

        {live && open && (
          <div className="rp-share" id={panelId}>
            <p className="rp-share-label">Public link (no sign-in)</p>
            <div className="rp-share-link">
              <input readOnly value={kit.url!} aria-label="Public demo link" onFocus={e => e.currentTarget.select()} />
              <button type="button" className="rp-act" data-action="copy-link" onClick={() => doCopy(kit.url!, 'Link')}>Copy link</button>
            </div>
            <p className="rp-share-label">Message</p>
            <p className="rp-share-msg" data-share-text>{shareText(kit)}</p>
            <div className="rp-share-row">
              <a className="rp-act" href={sms} data-action="sms">Text</a>
              <a className="rp-act" href={mailto} data-action="email">Email</a>
              <button type="button" className="rp-act" data-action="copy-msg" onClick={() => doCopy(shareText(kit), 'Message')}>Copy text</button>
            </div>
            <p className="rp-copied" role="status" aria-live="polite">{note}</p>
          </div>
        )}
      </div>
    </article>
  )
}
