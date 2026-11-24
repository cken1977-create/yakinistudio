'use client'
import { useEffect, useRef, useState } from 'react'
import { Qr } from './Qr'

/**
 * Publish screen actions (spec 5.6, 10.7, 11.2, 14.8 #3): pick the address with a live check,
 * Publish, see the live link with copy and QR, roll back, unpublish, and manage preview links.
 */
type Check = { id: string; ok: boolean; blocking: boolean; label: string; detail?: string }
type Version = { id: string; number: number; createdAt: string }
type Link = { id: string; expiresAt: string; active: boolean; lastUsedAt: string | null }

export type PublishPanelProps = {
  siteId: string
  canPublish: boolean
  canShare: boolean
  operatorOverride: boolean
  hasPlan: boolean
  suggestedSlug: string
  rootDomain: string
  liveUrl: string | null
  addressPending: boolean
  publishedNumber: number | null
  inReview: boolean
  paused: boolean
  checks: Check[]
  versions: Version[]
  links: Link[]
}

const btn = 'inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold'
const primary = `${btn} bg-gold text-ink hover:brightness-110 disabled:opacity-50`
const secondary = `${btn} border border-paper/25 text-paper hover:border-gold disabled:opacity-50`
const input = 'block w-full min-w-0 rounded-xl border border-paper/25 bg-[#15130F] px-4 py-3 text-base text-paper focus:border-gold focus:outline-none'

async function call(path: string, method: string, body?: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(path, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: res.status, data: await res.json().catch(() => ({})) }
  } catch { return { status: 0, data: { error: 'You’re offline. Please try again when you’re back.' } } }
}

export function PublishPanel(p: PublishPanelProps) {
  const [slug, setSlug] = useState(p.suggestedSlug)
  const [slugMsg, setSlugMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [checks, setChecks] = useState(p.checks)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState<{ url: string; pending: boolean } | null>(p.liveUrl ? { url: p.liveUrl, pending: p.addressPending } : null)
  const [justPublished, setJustPublished] = useState(false)
  const [inReview, setInReview] = useState(p.inReview)
  const [reason, setReason] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [links, setLinks] = useState(p.links)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shownMsg = slug.trim() ? slugMsg : null
  const blocking = checks.filter((c) => c.blocking && !c.ok && !(c.id === 'plan_active' && p.operatorOverride))

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const s = slug.trim().toLowerCase()
    if (!s) return
    timer.current = setTimeout(async () => {
      const r = await call(`/api/slugs/check?slug=${encodeURIComponent(s)}&site=${p.siteId}`, 'GET')
      if (r.status === 200) setSlugMsg(r.data.ok ? { ok: true, text: `${s}.${p.rootDomain} is free.` } : { ok: false, text: String(r.data.message ?? 'Please pick another address.') })
    }, 350)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [slug, p.siteId, p.rootDomain])

  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(null), 2000) } catch { /* the link is selectable */ } }

  async function publish() {
    setBusy(true); setError(null)
    const r = await call(`/api/sites/${p.siteId}/publish`, 'POST', { slug: slug.trim().toLowerCase(), ...(p.operatorOverride && !p.hasPlan ? { overrideReason: reason } : {}) })
    setBusy(false)
    if (r.status === 200 && r.data.status === 'live') { setLive({ url: String(r.data.url), pending: r.data.address === 'pending' }); setJustPublished(true); return }
    if (r.status === 200 && r.data.status === 'in_review') { setInReview(true); return }
    if (Array.isArray(r.data.items)) setChecks(r.data.items as Check[])
    setError(String(r.data.error ?? 'Publishing didn’t work. Please try again.'))
  }

  async function rollback(v: Version) {
    if (!window.confirm(`Put version ${v.number} back on your live site?`)) return
    setBusy(true); setError(null)
    const r = await call(`/api/sites/${p.siteId}/rollback`, 'POST', { versionId: v.id })
    setBusy(false)
    if (r.status === 200) window.location.reload(); else setError(String(r.data.error ?? 'That didn’t work. Please try again.'))
  }

  async function unpublish() {
    if (!window.confirm('Take your site offline? Visitors will see “This site is being updated” until you publish again.')) return
    setBusy(true)
    const r = await call(`/api/sites/${p.siteId}/unpublish`, 'POST')
    setBusy(false)
    if (r.status === 200) window.location.reload(); else setError(String(r.data.error ?? 'That didn’t work. Please try again.'))
  }

  async function makeLink() {
    setBusy(true); setError(null)
    const r = await call(`/api/sites/${p.siteId}/share-links`, 'POST', {})
    setBusy(false)
    if (r.status === 201) {
      setShareUrl(String(r.data.url))
      setLinks((l) => [{ id: String(r.data.id), expiresAt: new Date(Date.now() + Number(r.data.days ?? 7) * 86_400_000).toISOString(), active: true, lastUsedAt: null }, ...l])
    } else setError(String(r.data.error ?? 'That link couldn’t be made.'))
  }

  async function revoke(id: string) {
    const r = await call(`/api/sites/${p.siteId}/share-links/${id}`, 'DELETE')
    if (r.status === 200) setLinks((l) => l.map((x) => (x.id === id ? { ...x, active: false } : x)))
  }

  if (p.paused) {
    return <p role="alert" className="mt-8 rounded-xl border border-[#E3A08F]/60 bg-[#3a1d17] px-4 py-3">Your site is paused and can’t be published right now. <a href="https://yakini.digital/contact" className="font-semibold underline underline-offset-4">Contact us</a></p>
  }

  return (
    <div className="mt-8 space-y-10">
      {justPublished && live ? (
        <section aria-labelledby="live-h" className="rounded-2xl border border-gold/40 bg-gold/10 p-5" data-testid="live-result">
          <h2 id="live-h" className="font-serif text-3xl">Your site is live</h2>
          {live.pending ? <p className="mt-2 text-paper/85">Your address is being set up. It usually takes a few minutes.</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <Qr value={live.url} />
            <div className="min-w-0 space-y-3">
              <a href={live.url} target="_blank" rel="noopener" className="block break-all text-lg font-semibold text-gold underline underline-offset-4">{live.url.replace(/^https:\/\//, '')}</a>
              <button type="button" className={secondary} onClick={() => copy(live.url)}>{copied === live.url ? 'Copied' : 'Copy link'}</button>
              <p className="text-sm text-paper/80">Next: connect your own domain (opens soon).</p>
            </div>
          </div>
        </section>
      ) : null}

      {inReview ? (
        <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3" data-testid="in-review">We’re giving your site a quick look before it goes live. Your preview still works.</p>
      ) : null}

      <section aria-labelledby="checks-h">
        <h2 id="checks-h" className="text-xl font-semibold">Before you publish</h2>
        <ul className="mt-3 space-y-2">
          {checks.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-xl border border-paper/10 px-4 py-3" data-check={c.id} data-ok={c.ok}>
              <span aria-hidden="true" className={c.ok ? 'text-[#8FD19E]' : c.blocking ? 'text-[#F2B8A8]' : 'text-gold'}>{c.ok ? '✓' : c.blocking ? '✕' : '!'}</span>
              <span><span className="font-semibold">{c.label}</span><span className="sr-only">{c.ok ? ': done' : c.blocking ? ': needs fixing' : ': worth a look'}</span>{c.detail ? <span className="block text-sm text-paper/80">{c.detail}</span> : null}</span>
            </li>
          ))}
        </ul>
      </section>

      {p.canPublish ? (
        <section aria-labelledby="addr-h">
          <h2 id="addr-h" className="text-xl font-semibold">Your address</h2>
          <label htmlFor="slug" className="mt-3 block text-sm font-semibold">Pick the first part of your address</label>
          <div className="mt-2 flex items-center gap-2">
            <input id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} maxLength={40} autoComplete="off" spellCheck={false} aria-describedby="slug-msg" className={input} />
            <span className="shrink-0 text-paper/80">.{p.rootDomain}</span>
          </div>
          <p id="slug-msg" role="status" className={`mt-2 text-sm ${shownMsg?.ok === false ? 'text-[#F2B8A8]' : 'text-paper/80'}`}>{shownMsg?.text ?? 'Lowercase letters, numbers and dashes.'}</p>
          {p.operatorOverride && !p.hasPlan ? (
            <div className="mt-4">
              <label htmlFor="reason" className="block text-sm font-semibold">Why publish without a plan? (operator)</label>
              <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className={`${input} mt-2`} />
              <p className="mt-1 text-sm text-paper/70">A first publish without a plan waits for a review.</p>
            </div>
          ) : null}
          {error ? <p role="alert" className="mt-4 rounded-xl border border-[#E3A08F]/60 bg-[#3a1d17] px-4 py-3">{error}</p> : null}
          {!p.hasPlan && !p.operatorOverride ? <p className="mt-4 text-paper/85">Choose a plan to go live. Your preview still works.</p> : null}
          <button type="button" className={`${primary} mt-5`} onClick={publish} disabled={busy || blocking.length > 0 || !slug.trim() || shownMsg?.ok === false || (!p.hasPlan && !p.operatorOverride)} data-testid="publish">
            {busy ? 'Publishing…' : live ? 'Publish changes' : 'Publish'}
          </button>
          {blocking.length ? <p className="mt-2 text-sm text-paper/80">Fix the items marked ✕ in the editor, then come back.</p> : null}
        </section>
      ) : <p className="text-paper/85">Only the owner can publish this site.</p>}

      {p.canPublish && live && !justPublished ? (
        <section aria-labelledby="live2-h">
          <h2 id="live2-h" className="text-xl font-semibold">Live now{p.publishedNumber ? `: version ${p.publishedNumber}` : ''}</h2>
          <p className="mt-2"><a href={live.url} target="_blank" rel="noopener" className="break-all text-gold underline underline-offset-4">{live.url.replace(/^https:\/\//, '')}</a></p>
          {p.versions.length > 1 ? (
            <ul className="mt-4 space-y-2">
              {p.versions.filter((v) => v.number !== p.publishedNumber).slice(0, 10).map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-paper/10 px-4 py-2">
                  <span>Version {v.number} <span className="text-sm text-paper/70">{new Date(v.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span></span>
                  <button type="button" className={secondary} onClick={() => rollback(v)} disabled={busy}>Roll back to this</button>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" className={`${secondary} mt-4`} onClick={unpublish} disabled={busy}>Take the site offline</button>
        </section>
      ) : null}

      {p.canShare ? (
        <section aria-labelledby="share-h">
          <h2 id="share-h" className="text-xl font-semibold">Preview links</h2>
          <p className="mt-2 text-paper/80">A private link to your current draft for someone you trust. It stops working after 7 days, and you can turn it off any time.</p>
          {shareUrl ? (
            <div className="mt-3 rounded-xl border border-gold/40 bg-gold/10 p-4" data-testid="share-url">
              <p className="text-sm">Copy it now. For your safety we can’t show it again.</p>
              <p className="mt-2 break-all font-mono text-sm">{shareUrl}</p>
              <button type="button" className={`${secondary} mt-3`} onClick={() => copy(shareUrl)}>{copied === shareUrl ? 'Copied' : 'Copy link'}</button>
            </div>
          ) : null}
          <button type="button" className={`${secondary} mt-3`} onClick={makeLink} disabled={busy}>Make a preview link</button>
          {links.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {links.map((l) => {
                const off = !l.active
                return (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-paper/10 px-4 py-2">
                    <span>{off ? 'Off' : `Works until ${new Date(l.expiresAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}`}{l.lastUsedAt ? ' · opened' : ''}</span>
                    {!off ? <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => revoke(l.id)}>Turn off</button> : null}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
