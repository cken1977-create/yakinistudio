'use client'

import { useEffect, useMemo, useState } from 'react'
import { PHONE_DISPLAY, PHONE_TEL, SMS_LINK } from '@/config/site'
import {
  THANKSGIVING_PAN_COUNT,
  THANKSGIVING_SIDES,
  THANKSGIVING_SPECIAL,
  THANKSGIVING_TOTAL_USD,
  buildThanksgivingRequestText,
  countedPans,
  requestErrorText,
  type RequestErrorCode,
  type ThanksgivingDish,
  type ThanksgivingSelection,
} from '@/config/thanksgiving'

const emptySelection = (): ThanksgivingSelection => {
  const selection: ThanksgivingSelection = {}
  for (const dish of THANKSGIVING_SIDES) selection[dish.id] = 0
  return selection
}

export function ThanksgivingSpecial() {
  const s = THANKSGIVING_SPECIAL
  const [selection, setSelection] = useState<ThanksgivingSelection>(emptySelection)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pickup, setPickup] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle')

  const count = countedPans(selection)
  const requestText = buildThanksgivingRequestText({ selection, name, phone, pickup })
  const errors = useMemo(() => {
    const codes: RequestErrorCode[] = []
    if (requestText) return codes
    if (count !== THANKSGIVING_PAN_COUNT) codes.push('pan-count')
    if (name.trim().length < 2) codes.push('name')
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) codes.push('phone')
    if (pickup.trim().length < 3) codes.push('pickup')
    return codes
  }, [requestText, count, name, phone, pickup])

  const setQty = (id: string, next: number) => {
    setCopyState('idle')
    setSelection((current) => {
      const safe = Math.max(0, Math.min(THANKSGIVING_PAN_COUNT, next))
      const without = countedPans({ ...current, [id]: 0 })
      const capped = Math.min(safe, THANKSGIVING_PAN_COUNT - without)
      return { ...current, [id]: capped }
    })
  }

  const showErrors = attempted && !requestText

  useEffect(() => {
    if (showErrors) document.getElementById('tg-errors')?.focus()
  }, [showErrors])

  const revealErrors = () => setAttempted(true)

  const copyRequest = async () => {
    if (!requestText) {
      revealErrors()
      return
    }
    setCopyState('copying')
    try {
      await navigator.clipboard.writeText(requestText)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }

  return (
    <section id="thanksgiving" className="tg" aria-labelledby="tg-title">
      <style>{`
        .tg { scroll-margin-top: 120px; }
        .tg h2 { font-size: clamp(36px, 8vw, 64px); letter-spacing: -.02em; margin: 0; line-height: 1; }
        .tg-lead { max-width: 40em; font-size: 18px; line-height: 1.5; margin: 14px 0 0; color: #ddd; }
        .tg-total { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin: 18px 0 8px; }
        .tg-amt { font-family: var(--font-display); font-size: clamp(56px, 12vw, 88px); line-height: .9; color: #fff; }
        .tg-amt-label { font-size: 14px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--brand-muted); }
        .tg-layout { display: grid; gap: 28px; margin-top: 28px; }
        @media (min-width: 900px) { .tg-layout { grid-template-columns: 1.2fr .8fr; align-items: start; } }
        .tg-panel { border: 1px solid var(--brand-border); border-top: 3px solid var(--brand-primary); border-radius: 18px; background: #0b0b0b; padding: 18px 16px 20px; }
        .tg h3 { font-size: 22px; margin: 0 0 4px; }
        .tg-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
        .tg-name { font-weight: 700; font-size: 16px; }
        .tg-qty { display: flex; align-items: center; gap: 8px; }
        .tg-qty button { width: 44px; height: 44px; border-radius: 999px; border: 1px solid var(--brand-border); background: #111; color: #fff; font-size: 22px; line-height: 1; }
        .tg-qty button:disabled { opacity: .35; }
        .tg-qty span { min-width: 1.4em; text-align: center; font-family: var(--font-display); font-size: 22px; }
        .tg-meter { margin-top: 14px; font-weight: 700; }
        .tg label { display: block; font-weight: 700; font-size: 14px; margin: 14px 0 6px; }
        .tg input, .tg textarea { width: 100%; box-sizing: border-box; background: #000; color: #fff; border: 1px solid var(--brand-border); border-radius: 12px; padding: 12px 14px; font: 16px/1.4 var(--font-body), sans-serif; }
        .tg textarea { min-height: 76px; resize: vertical; }
        .tg-actions { display: grid; gap: 10px; margin-top: 16px; }
        .tg-actions a, .tg-actions button { width: 100%; }
        .tg-note { font-size: 14px; color: #ddd; margin: 12px 0 0; }
        .tg-errors { margin: 12px 0 0; padding: 0; color: #fff; }
        .tg-errors li { margin: 4px 0; }
        .tg-status { font-size: 14px; margin-top: 10px; }
      `}</style>

      <div className="ms-eyebrow">{s.eyebrow} · {s.eyebrowEs}</div>
      <h2 id="tg-title">{s.title}</h2>
      <p className="ms-es" style={{ marginTop: 6 }}>{s.titleEs}</p>
      <p className="tg-lead">{s.summary}</p>
      <p className="ms-es">{s.summaryEs}</p>
      <p className="tg-lead">{s.scope} {s.bundle}</p>
      <p className="ms-es">{s.scopeEs} {s.bundleEs}</p>
      <div className="tg-total">
        <span className="tg-amt">${THANKSGIVING_TOTAL_USD}</span>
        <span className="tg-amt-label">{s.totalLabel} · {s.totalLabelEs}</span>
      </div>

      <div className="tg-layout">
        <div>
          <DishList
            heading={s.sidesHeading}
            headingEs={s.sidesHeadingEs}
            dishes={THANKSGIVING_SIDES}
            selection={selection}
            count={count}
            onChange={setQty}
          />
          <div style={{ height: 16 }} />
          <div className="tg-panel">
            <h3>{s.dessertsHeading}</h3>
            <p className="ms-es" style={{ marginTop: 0 }}>{s.dessertsHeadingEs}</p>
            <p className="tg-note">{s.dessertsNote}</p>
            <p className="ms-es">{s.dessertsNoteEs}</p>
          </div>
        </div>

        <form
          className="tg-panel"
          onSubmit={(event) => {
            event.preventDefault()
            setAttempted(true)
            if (!requestText) revealErrors()
          }}
        >
          <h3>Request this special</h3>
          <p className="ms-es" style={{ marginTop: 0 }}>Pide este especial</p>
          <p className="tg-meter" aria-live="polite">
            {count} of {THANKSGIVING_PAN_COUNT} half pans
            <span className="ms-es"> · {count} de {THANKSGIVING_PAN_COUNT} medias charolas</span>
          </p>

          <label htmlFor="tg-name">Name · Nombre</label>
          <input
            id="tg-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => { setName(event.target.value); setCopyState('idle') }}
            aria-invalid={showErrors && errors.includes('name')}
          />

          <label htmlFor="tg-phone">Phone · Teléfono</label>
          <input
            id="tg-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => { setPhone(event.target.value); setCopyState('idle') }}
            aria-invalid={showErrors && errors.includes('phone')}
          />

          <label htmlFor="tg-pickup">Requested pickup · Recogida que pides</label>
          <textarea
            id="tg-pickup"
            name="pickup"
            value={pickup}
            onChange={(event) => { setPickup(event.target.value); setCopyState('idle') }}
            aria-invalid={showErrors && errors.includes('pickup')}
            aria-describedby="tg-pickup-hint"
          />
          <p id="tg-pickup-hint" className="ms-es" style={{ marginTop: 6 }}>
            Day and place you have in mind. El día y el lugar que tienes en mente.
          </p>

          {showErrors && (
            <ul id="tg-errors" className="tg-errors" role="alert" tabIndex={-1}>
              {errors.map((code) => {
                const text = requestErrorText(code, count)
                return <li key={code}>{text.en} <span className="ms-es">{text.es}</span></li>
              })}
            </ul>
          )}

          <div className="tg-actions">
            {requestText ? (
              <a className="ms-btn ms-btn-red" href={`${SMS_LINK}?&body=${encodeURIComponent(requestText)}`}>
                Text this request · Enviar por texto
              </a>
            ) : (
              <button type="button" className="ms-btn ms-btn-red" onClick={revealErrors}>
                Text this request · Enviar por texto
              </button>
            )}
            <a className="ms-btn ms-btn-ghost" href={PHONE_TEL}>Call to order {PHONE_DISPLAY}</a>
            <button type="button" className="ms-btn ms-btn-ghost" onClick={copyRequest}>
              Copy request · Copiar solicitud
            </button>
          </div>
          <p className="tg-note">{s.requestNote}</p>
          <p className="ms-es">{s.requestNoteEs}</p>
          <p className="tg-status" role="status">
            {copyState === 'copying' && 'Copying the request…'}
            {copyState === 'copied' && 'Copied. Paste it into a text to Momma Sally’s. This page did not send it.'}
            {copyState === 'error' && 'Could not copy. Call to order instead. Nothing was sent.'}
          </p>
        </form>
      </div>
    </section>
  )
}

function DishList({
  heading,
  headingEs,
  dishes,
  selection,
  count,
  onChange,
}: {
  heading: string
  headingEs: string
  dishes: readonly ThanksgivingDish[]
  selection: ThanksgivingSelection
  count: number
  onChange: (id: string, next: number) => void
}) {
  return (
    <div className="tg-panel">
      <h3>{heading}</h3>
      <p className="ms-es" style={{ marginTop: 0 }}>{headingEs}</p>
      {dishes.map((dish) => {
        const qty = selection[dish.id] ?? 0
        return (
          <div className="tg-row" key={dish.id}>
            <div>
              <div className="tg-name">{dish.name}</div>
              <div className="ms-es" style={{ fontSize: 14 }}>{dish.es}</div>
            </div>
            <div className="tg-qty" role="group" aria-label={`${dish.name} half pans`}>
              <button type="button" aria-label={`Remove one ${dish.name}`} disabled={qty === 0} onClick={() => onChange(dish.id, qty - 1)}>−</button>
              <span>{qty}</span>
              <button
                type="button"
                aria-label={`Add one ${dish.name}`}
                disabled={count >= THANKSGIVING_PAN_COUNT}
                onClick={() => onChange(dish.id, qty + 1)}
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
