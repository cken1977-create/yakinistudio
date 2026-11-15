'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { CateringBuilder, type CateringBuilderState } from './CateringBuilder'
import { CATERING_MEATS, CATERING_SIDES, CATERING_DESSERTS } from '@/config/catering'
import { PHONE_DISPLAY, PHONE_TEL, SMS_LINK } from '@/config/site'

/* ───────────── shared ───────────── */

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Adds .is-in once the element scrolls into view (CSS does the motion). JS off / reduced motion: shown immediately via CSS. */
export function InView({ children, className = '', as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' }) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced()) { setInView(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const Tag = as as 'div'
  return <Tag ref={ref as React.RefObject<HTMLDivElement>} className={`c-inview${inView ? ' is-in' : ''} ${className}`}>{children}</Tag>
}

/** Soft steam wisps over a framed card. Pure CSS; off for reduced motion. */
export function Steam() {
  return (
    <span className="c-steam" aria-hidden="true">
      <i /><i /><i />
    </span>
  )
}

/* ───────────── sticky bar: Call / Text / Build catering ───────────── */

export function StickyBar() {
  const [hide, setHide] = useState(false)
  useEffect(() => {
    const el = document.getElementById('catering')
    if (!el) return
    // The catering builder has its own sticky estimate bar; step aside while it's on screen.
    const io = new IntersectionObserver(([e]) => setHide(e.isIntersecting), { rootMargin: '-30% 0px -10% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <nav className={`c-bar${hide ? ' is-hidden' : ''}`} aria-label="Quick actions · Acciones rápidas">
      <a href={PHONE_TEL} className="c-bar-red">Call<small>Llamar</small></a>
      <a href={SMS_LINK} className="c-bar-ghost">Text<small>Texto</small></a>
      <a href="#catering" className="c-bar-white">Build catering<small>Arma tu banquete</small></a>
    </nav>
  )
}

/* ───────────── 02 plate builder ───────────── */

/** Real photo crops for the plate builder; meats without a real photo use a plain swatch. */
const PLATE_PHOTOS: Record<string, string> = {
  brisket: '/photos/enhanced/plate-brisket.webp',
  sausage: '/photos/enhanced/plate-sausage.webp',
}

type PlateMeat = { id: string; name: string; es: string }

export function PlateBuilder({ meats, plates, note }: { meats: PlateMeat[]; plates: { count: 1 | 2; name: string; es: string; price: string }[]; note: string }) {
  const [size, setSize] = useState<1 | 2>(1)
  const [picked, setPicked] = useState<string[]>(['brisket'])
  const plate = plates.find(p => p.count === size) ?? plates[0]

  const choose = (id: string) => {
    setPicked(cur => {
      if (cur.includes(id)) return cur.filter(x => x !== id)
      const next = [...cur, id]
      return next.slice(-size)
    })
  }
  const pickSize = (n: 1 | 2) => { setSize(n); setPicked(cur => cur.slice(-n)) }
  const names = picked.map(id => meats.find(m => m.id === id)?.name).filter(Boolean) as string[]
  const ready = picked.length === size
  const sms = `${SMS_LINK}?&body=${encodeURIComponent(`Hi Momma Sally's! I'd like a ${plate.name}${names.length ? `: ${names.join(' + ')}` : ''}. Where's the truck today?`)}`

  return (
    <div className="c-pb">
      <div className="c-pb-controls">
        <div className="c-pb-sizes" role="group" aria-label="Plate size · Tamaño">
          {plates.map(p => (
            <button key={p.count} type="button" aria-pressed={size === p.count} onClick={() => pickSize(p.count)} className="c-pb-size">
              <span className="c-pb-price">{p.price}</span>
              <span>{p.name}</span>
              <span className="ms-es">{p.es}</span>
            </button>
          ))}
        </div>
        <div className="c-pb-step">Pick {size === 1 ? 'your meat' : 'two meats'} · Elige {size === 1 ? 'tu carne' : 'dos carnes'}</div>
        <div className="c-pb-meats">
          {meats.map(m => (
            <button key={m.id} type="button" aria-pressed={picked.includes(m.id)} onClick={() => choose(m.id)} className="c-chip">
              {m.name} <span>· {m.es}</span>
            </button>
          ))}
        </div>
        <p className="c-pb-note">{note}</p>
        <div className="c-pb-ctas">
          <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call to order · {PHONE_DISPLAY}</a>
          <a href={sms} className="ms-btn ms-btn-ghost">{ready ? 'Text this plate' : 'Text us'} · Enviar</a>
        </div>
      </div>
      <div className="c-pb-plate" aria-live="polite">
        <div className="c-plate">
          <div className="c-plate-rim" />
          {picked.map((id, i) => {
            const m = meats.find(x => x.id === id)
            const photo = PLATE_PHOTOS[id]
            return m ? <div key={id} className={`c-plate-meat c-plate-meat-${size === 1 ? 'solo' : i}${photo ? ' has-photo' : ''}`} style={photo ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,.65)), url(${photo})` } : undefined}>{m.name}<small>{m.es}</small></div> : null
          })}
          <div className="c-plate-sides">+ sides · acompañamientos</div>
          {!picked.length && <div className="c-plate-empty">Tap a meat · Toca una carne</div>}
        </div>
        <div className="c-pb-total">
          <span>{plate.name}</span>
          <strong>{plate.price}</strong>
        </div>
      </div>
    </div>
  )
}

/* ───────────── 03 catering: builder + pans-filling counter ───────────── */

export function CateringChapter() {
  const [st, setSt] = useState<CateringBuilderState>({ headcount: 50, meats: ['brisket', 'sausage'], sides: ['beans', 'mac'], desserts: [] })
  const onChange = useCallback((s: CateringBuilderState) => setSt(s), [])
  const pans = useMemo(() => [
    ...st.meats.map(id => { const o = CATERING_MEATS.find(m => m.id === id); return { id, kind: 'meat', name: o?.name ?? id, es: o?.es ?? '' } }),
    ...st.sides.map(id => { const o = CATERING_SIDES.find(m => m.id === id); return { id, kind: 'side', name: o?.name ?? id, es: o?.es ?? '' } }),
    ...st.desserts.map(id => { const o = CATERING_DESSERTS.find(m => m.id === id); return { id, kind: 'dessert', name: o?.name ?? id, es: o?.es ?? '' } }),
  ], [st])
  const fill = Math.min(100, Math.round(30 + (st.headcount / 300) * 70))

  return (
    <div className="c-cat">
      <div className="c-pans" aria-live="polite">
        <div className="c-pans-head">
          <div>
            <div className="c-pans-count"><strong>{pans.length}</strong> {pans.length === 1 ? 'pan' : 'pans'} on the table</div>
            <div className="ms-es">{pans.length} {pans.length === 1 ? 'charola' : 'charolas'} en la mesa · {st.headcount} guests · invitados</div>
          </div>
        </div>
        <div className="c-pans-row">
          {pans.map(p => (
            <div key={p.kind + p.id} className={`c-pan c-pan-${p.kind}`}>
              <div className="c-pan-tray"><div className="c-pan-fill" style={{ height: `${fill}%` }} /></div>
              <div className="c-pan-name">{p.name}</div>
            </div>
          ))}
          {/* SLOT — Party Pack: contents and price not confirmed by Sally. Shown as a labeled slot only. */}
          <div className="c-pan c-pan-slot" data-slot="party-pack">
            <div className="c-pan-tray c-pan-tray-slot">?</div>
            <div className="c-pan-name">Party Pack<small>Paquete fiesta · ask us · pregúntanos</small></div>
          </div>
        </div>
      </div>
      <CateringBuilder onChange={onChange} />
    </div>
  )
}

/* ───────────── Thanksgiving: hide out of season ───────────── */

/** Renders children until `until` (YYYY-MM-DD, local). JS off shows it (server render). */
export function SeasonGate({ until, children }: { until: string; children: ReactNode }) {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const end = new Date(`${until}T23:59:59`)
    if (Date.now() > end.getTime()) setShow(false)
  }, [until])
  return show ? <>{children}</> : null
}

/* ───────────── 06 quote reveal ───────────── */

export function QuoteReveal({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <InView className="c-quote">
      <p>
        &ldquo;{words.map((w, i) => <span key={i}><span className="c-w" style={{ transitionDelay: `${i * 55}ms` }}>{w}</span>{i < words.length - 1 ? ' ' : ''}</span>)}&rdquo;
      </p>
    </InView>
  )
}

/* ───────────── truck illustration (route line + parking) ───────────── */

export function TruckSvg({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 110" aria-hidden="true">
      <g className="c-truck-puff"><circle cx="18" cy="30" r="8" /><circle cx="8" cy="18" r="6" /><circle cx="22" cy="10" r="5" /></g>
      <rect x="28" y="22" width="126" height="62" rx="8" fill="#B3121B" />
      <rect x="36" y="32" width="64" height="26" rx="4" fill="#111" />
      <rect x="36" y="32" width="64" height="5" fill="#ffb347" opacity=".8" />
      <text x="127" y="62" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="13" fill="#fff">Momma</text>
      <text x="127" y="76" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="13" fill="#fff">Sally&apos;s</text>
      <path d="M154 40 h30 l18 22 v22 h-48 z" fill="#e8e1d8" />
      <path d="M160 46 h22 l12 15 h-34 z" fill="#1d2a33" />
      <rect x="28" y="84" width="174" height="6" fill="#222" />
      <g className="c-wheel"><circle cx="62" cy="92" r="12" fill="#111" /><circle cx="62" cy="92" r="5" fill="#888" /></g>
      <g className="c-wheel"><circle cx="176" cy="92" r="12" fill="#111" /><circle cx="176" cy="92" r="5" fill="#888" /></g>
    </svg>
  )
}

export function RouteLine() {
  return (
    <InView className="c-route">
      <div className="c-route-road" aria-hidden="true" />
      <TruckSvg className="c-route-truck" />
      {/* No stops or hours are listed on purpose: the location changes daily. */}
      <div className="c-route-pins">
        <span>Today&rsquo;s stop? · ¿Parada de hoy?</span>
        <a href={PHONE_TEL}>Call {PHONE_DISPLAY}</a>
        <a href={SMS_LINK}>Text · Texto</a>
      </div>
    </InView>
  )
}

export function ParkTruck() {
  return (
    <InView className="c-park">
      <div className="c-park-lot" aria-hidden="true"><span /><span /><span /></div>
      <TruckSvg className="c-park-truck" />
    </InView>
  )
}

export function MenuLink() {
  return <Link href="/menu" className="ms-btn ms-btn-ghost">View Menu · Ver Menú</Link>
}
