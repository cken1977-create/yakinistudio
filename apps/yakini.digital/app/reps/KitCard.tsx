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

/** The link a rep shares: the guided tour, or the video when there is no tour yet. */
export function shareLink(k: KitCardData): string | null {
  return k.url ?? k.video
}

function intro(k: KitCardData): string {
  return k.url ? `Here's a short guided demo of ${k.blurb}` : `Here's a short narrated video of ${k.blurb}`
}

export function shareText(k: KitCardData): string {
  return `Hi! ${intro(k)}. It only takes a few minutes, uses sample data only, and there's nothing to sign up for:\n${shareLink(k)}`
}

export function emailSubject(k: KitCardData): string {
  return `A quick look: ${k.name} demo`
}

export function emailBody(k: KitCardData): string {
  return `Hi,\n\n${intro(k)}. It only takes a few minutes, uses sample data only, and there's nothing to sign up for:\n\n${shareLink(k)}\n` +
    (k.url && k.video ? `\nPrefer to watch? Here's the narrated video version:\n${k.video}\n` : '') +
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
  const link = shareLink(kit)
  const live = !!link
  const panelId = `share-${kit.slug}`
  const badge = !live ? 'Coming soon' : !kit.url ? 'Tour coming' : !kit.video ? 'Video coming' : null
  const thumbHref = kit.url ?? kit.video

  async function doCopy(text: string, label: string) {
    setNote((await copy(text)) ? `${label} copied` : 'Could not copy. Select the text and copy it.')
    window.setTimeout(() => setNote(''), 2500)
  }

  const sms = live ? `sms:?&body=${encodeURIComponent(shareText(kit))}` : undefined
  const mailto = live ? `mailto:?subject=${encodeURIComponent(emailSubject(kit))}&body=${encodeURIComponent(emailBody(kit))}` : undefined

  const thumbInner = (
    <>
      {kit.thumbnail
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={kit.thumbnail} alt={`${kit.name} demo preview`} loading="lazy" />
        : <span className="rp-thumb-empty"><span className="rp-thumb-y">Y</span><span className="rp-thumb-name">{kit.name}</span></span>}
      {badge && <span className={`rp-badge${live ? ' rp-badge-soft' : ''}`} data-badge>{badge}</span>}
    </>
  )

  return (
    <article className="rp-card" data-kit={kit.slug}>
      {thumbHref ? (
        <a className="rp-thumb" href={thumbHref} target="_blank" rel="noopener noreferrer" aria-label={`Open the ${kit.name} demo`}>{thumbInner}</a>
      ) : (
        <div className="rp-thumb">{thumbInner}</div>
      )}
      <div className="rp-body">
        <p className="rp-aud">{kit.audience}</p>
        <h2 className="rp-name">{kit.name}</h2>
        <p className="rp-pitch">{kit.pitch}</p>
        {live ? (
          <div className="rp-actions">
            {kit.url && <a className="rp-act rp-act-primary" href={kit.url} target="_blank" rel="noopener noreferrer" data-action="tour">Open tour</a>}
            {kit.video && <a className={`rp-act${kit.url ? '' : ' rp-act-primary'}`} href={kit.video} target="_blank" rel="noopener noreferrer" data-action="video">Watch video</a>}
            <button type="button" className="rp-act" data-action="share"
              aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(o => !o)}>
              Share
            </button>
          </div>
        ) : (
          <p className="rp-soon">Links will appear here when the public demo is ready.</p>
        )}

        {live && open && (
          <div className="rp-share" id={panelId}>
            <p className="rp-share-label">Public link (no sign-in)</p>
            <div className="rp-share-link">
              <input readOnly value={link!} aria-label="Public demo link" onFocus={e => e.currentTarget.select()} />
              <button type="button" className="rp-act" data-action="copy-link" onClick={() => doCopy(link!, 'Link')}>Copy link</button>
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
