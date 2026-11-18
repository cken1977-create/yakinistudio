'use client'

import { useState, useSyncExternalStore } from 'react'
import { HOLIDAY_URL } from '@/lib/holiday'

// Thank-you screen add-on: invite people to share /holiday so more businesses get nominated.
// Phones with the Web Share API get the native share sheet; everyone also gets
// copy link, text message, Facebook and X.
export const SHARE_TEXT = 'Know a business or organization that deserves a blessing? Nominate them for the Yakini Holiday Giveaway.'
const SHARE_TITLE = 'Yakini Holiday Giveaway'

const noop = () => () => {}
const canNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function'

export function ShareInvite() {
  const native = useSyncExternalStore(noop, canNativeShare, () => false)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  const url = HOLIDAY_URL
  const full = `${SHARE_TEXT} ${url}`
  const enc = encodeURIComponent

  async function share() {
    try { await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url }) } catch { /* dismissed */ }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(full); setCopied('ok') } catch { setCopied('fail') }
    setTimeout(() => setCopied('idle'), 2500)
  }

  return (
    <div className="hg-share" aria-labelledby="hg-share-h">
      <h4 id="hg-share-h">Help us find the next one</h4>
      <p>Know a business or organization that deserves a blessing? Share this page so they can be nominated too.</p>
      {native && (
        <button type="button" className="hm-btn hm-btn-gold hg-share-native" onClick={share}>
          <span>Share this page</span><span className="yk-btn-arrow">→</span>
        </button>
      )}
      <div className="hg-share-row">
        <button type="button" className="hg-share-btn" onClick={copy}>{copied === 'ok' ? 'Link copied ✓' : copied === 'fail' ? 'Copy failed' : 'Copy link'}</button>
        <a className="hg-share-btn" href={`sms:?&body=${enc(full)}`}>Text it</a>
        <a className="hg-share-btn" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
        <a className="hg-share-btn" href={`https://twitter.com/intent/tweet?text=${enc(SHARE_TEXT)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">X</a>
      </div>
      {copied === 'fail' && <p className="hg-share-manual">Copy this: <span>{url}</span></p>}
    </div>
  )
}
