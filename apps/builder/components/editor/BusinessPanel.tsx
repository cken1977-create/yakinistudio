'use client'
import { useId, useState } from 'react'
import type { Business } from '@yakini/site-schema'
import { SOCIAL_KINDS } from '@yakini/site-schema'
import { DAYS, normalizeUsPhone, US_STATES } from '@/lib/claim'
import { panel, useEditor } from './context'
import { TextField } from './FieldEditors'

/**
 * Business info (spec 10.3): one form for the details several sections show (header phone,
 * hours and location, footer, contact). Changing them here changes them everywhere.
 */
type Field = 'tagline' | 'phone' | 'email' | 'address' | 'hours' | 'serviceArea' | 'social'

const showPhone = (e164: string | undefined) => {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164 ?? '')
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164 ?? ''
}
const SOCIAL_LABELS: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', linkedin: 'LinkedIn', yelp: 'Yelp', google: 'Google' }

export function BusinessPanel({ onBack }: { onBack: () => void }) {
  const { doc, change } = useEditor()
  const b = doc.business
  const set = (field: Field, value: unknown, label: string) => change([{ op: 'update_business', field, value }], label, `business/${field}`)

  return (
    <div className="space-y-6 p-5">
      <div className="flex items-center gap-2">
        <button type="button" className={panel.icon} onClick={onBack} aria-label="Back to pages">←</button>
        <h2 className={panel.h2}>Business info</h2>
      </div>
      <p className="text-sm text-paper/80">Your business name is <strong>{b.name}</strong>. To change it, ask Yakini.</p>

      <TextField label="Short line about you" value={b.tagline} limits={{ required: false, maxLength: 160 }} commit={(v) => set('tagline', v, 'Tagline')} />
      <PhoneField value={b.phone} commit={(v) => set('phone', v, 'Phone')} />
      <TextField label="Email for customers" value={b.email} limits={{ required: false, maxLength: 254 }}
        commit={(v) => (v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ? set('email', v, 'Email') : 'That email doesn’t look right.')} />
      <AddressField value={b.address} commit={(v) => set('address', v, 'Address')} />
      <HoursField value={b.hours} commit={(v) => set('hours', v, 'Hours')} />
      <TextField label="Where you serve" value={b.serviceArea} limits={{ required: false, maxLength: 200 }} multiline commit={(v) => set('serviceArea', v, 'Service area')} />
      <SocialField value={b.social} commit={(v) => set('social', v, 'Social links')} />
    </div>
  )
}

function PhoneField({ value, commit }: { value: string | undefined; commit: (v: string | undefined) => string | null }) {
  const id = useId()
  const [text, setText] = useState(showPhone(value))
  const [error, setError] = useState<string | null>(null)
  return (
    <div>
      <label htmlFor={id} className={panel.label}>Phone <span className="font-normal text-muted">(optional)</span></label>
      <input id={id} type="tel" inputMode="tel" className={panel.input} value={text} placeholder="(915) 555-0123"
        onChange={(e) => {
          setText(e.target.value)
          if (!e.target.value.trim()) { setError(commit(undefined)); return }
          const p = normalizeUsPhone(e.target.value)
          setError(p ? commit(p) : 'Use a 10-digit US number, like 915-555-0123.')
        }} />
      {error && <p className={panel.error}>{error}</p>}
    </div>
  )
}

type Address = NonNullable<Business['address']>
function AddressField({ value, commit }: { value: Address | undefined; commit: (v: Address | undefined) => string | null }) {
  const [a, setA] = useState({ line1: value?.line1 ?? '', line2: value?.line2 ?? '', city: value?.city ?? '', region: value?.region ?? '', postal: value?.postal ?? '' })
  const [error, setError] = useState<string | null>(null)
  const update = (patch: Partial<typeof a>) => {
    const n = { ...a, ...patch }
    setA(n)
    if (!n.line1 && !n.line2 && !n.city && !n.region && !n.postal) { setError(commit(undefined)); return }
    if (!n.line1.trim() || !n.city.trim() || !n.region || !/^\d{5}(-\d{4})?$/.test(n.postal)) { setError('Fill in the street, city, state and ZIP to save the address.'); return }
    setError(commit({ line1: n.line1.trim(), ...(n.line2.trim() ? { line2: n.line2.trim() } : {}), city: n.city.trim(), region: n.region, postal: n.postal, country: 'US' }))
  }
  return (
    <fieldset className="space-y-2 rounded-xl border border-paper/15 p-3">
      <legend className="px-1 text-sm font-semibold">Address <span className="font-normal text-muted">(optional)</span></legend>
      <input aria-label="Street" placeholder="Street" className={panel.input} maxLength={120} value={a.line1} onChange={(e) => update({ line1: e.target.value })} />
      <input aria-label="Suite or unit" placeholder="Suite or unit (optional)" className={panel.input} maxLength={120} value={a.line2} onChange={(e) => update({ line2: e.target.value })} />
      <div className="grid grid-cols-6 gap-2">
        <input aria-label="City" placeholder="City" className={`${panel.input} col-span-6 sm:col-span-3`} maxLength={80} value={a.city} onChange={(e) => update({ city: e.target.value })} />
        <select aria-label="State" className={`${panel.input} col-span-3 sm:col-span-1`} value={a.region} onChange={(e) => update({ region: e.target.value })}>
          <option value="">State</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input aria-label="ZIP" placeholder="ZIP" inputMode="numeric" className={`${panel.input} col-span-3 sm:col-span-2`} maxLength={10} value={a.postal} onChange={(e) => update({ postal: e.target.value })} />
      </div>
      {error && <p className={panel.error}>{error}</p>}
    </fieldset>
  )
}

type Hours = NonNullable<Business['hours']>
function HoursField({ value, commit }: { value: Hours | undefined; commit: (v: Hours | undefined) => string | null }) {
  const byDay = new Map((value ?? []).map((h) => [h.day, h]))
  const [error, setError] = useState<string | null>(null)
  const setDay = (day: (typeof DAYS)[number]['id'], next: Hours[number] | null) => {
    const m = new Map(byDay)
    if (next) m.set(day, next); else m.delete(day)
    const list = DAYS.map((d) => m.get(d.id)).filter(Boolean) as Hours
    setError(commit(list.length ? list : undefined))
  }
  return (
    <fieldset className="rounded-xl border border-paper/15 p-3">
      <legend className="px-1 text-sm font-semibold">Hours <span className="font-normal text-muted">(optional)</span></legend>
      <div className="space-y-3">
        {DAYS.map((d) => {
          const h = byDay.get(d.id)
          const closed = Boolean(h && 'closed' in h)
          const open = h && 'open' in h ? h.open : ''
          const close = h && 'close' in h ? h.close : ''
          return (
            <div key={d.id} className="grid grid-cols-[5.5rem_1fr_1fr] items-center gap-2">
              <span className="text-sm font-semibold">{d.label}</span>
              {closed ? <span className="col-span-2 text-sm text-muted">Closed</span> : (
                <>
                  <input type="time" aria-label={`${d.label} opens`} className={`${panel.input} mt-0 py-2`} value={open}
                    onChange={(e) => e.target.value && setDay(d.id, { day: d.id, open: e.target.value, close: close || '17:00' })} />
                  <input type="time" aria-label={`${d.label} closes`} className={`${panel.input} mt-0 py-2`} value={close}
                    onChange={(e) => e.target.value && setDay(d.id, { day: d.id, open: open || '09:00', close: e.target.value })} />
                </>
              )}
              <div className="col-span-3 flex gap-3 text-sm">
                <label className="flex min-h-9 items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[#C9A14A]" checked={closed} onChange={(e) => setDay(d.id, e.target.checked ? { day: d.id, closed: true } : null)} /> Closed</label>
                {h && !closed && <button type="button" className="text-muted underline underline-offset-4" onClick={() => setDay(d.id, null)}>Clear</button>}
              </div>
            </div>
          )
        })}
      </div>
      {error && <p className={panel.error}>{error}</p>}
    </fieldset>
  )
}

type Social = NonNullable<Business['social']>
function SocialField({ value, commit }: { value: Social | undefined; commit: (v: Social | undefined) => string | null }) {
  const [rows, setRows] = useState<{ kind: string; url: string }[]>(value ?? [])
  const [error, setError] = useState<string | null>(null)
  const save = (next: { kind: string; url: string }[]) => {
    setRows(next)
    const filled = next.filter((r) => r.url.trim())
    if (filled.some((r) => !/^https:\/\/\S+$/.test(r.url.trim()))) { setError('Links start with https://'); return }
    setError(commit(filled.length ? filled.map((r) => ({ kind: r.kind as Social[number]['kind'], url: r.url.trim() })) : undefined))
  }
  return (
    <fieldset className="space-y-2 rounded-xl border border-paper/15 p-3">
      <legend className="px-1 text-sm font-semibold">Social pages <span className="font-normal text-muted">(optional)</span></legend>
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <select aria-label="Site" className={`${panel.input} mt-0 w-36`} value={r.kind} onChange={(e) => save(rows.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))}>
            {SOCIAL_KINDS.map((k) => <option key={k} value={k}>{SOCIAL_LABELS[k]}</option>)}
          </select>
          <input aria-label="Link" className={`${panel.input} mt-0`} placeholder="https://…" value={r.url} onChange={(e) => save(rows.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
          <button type="button" className={panel.icon} aria-label="Remove" onClick={() => save(rows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      {rows.length < 8 && <button type="button" className={panel.btn} onClick={() => setRows([...rows, { kind: 'instagram', url: '' }])}>+ Add a social page</button>}
      {error && <p className={panel.error}>{error}</p>}
    </fieldset>
  )
}
