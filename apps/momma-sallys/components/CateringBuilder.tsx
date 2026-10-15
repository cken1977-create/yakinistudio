'use client'

import { useMemo, useState } from 'react'
import {
  CATERING_PACKAGES,
  CATERING_MEATS,
  CATERING_SIDES,
  CATERING_DESSERTS,
  SERVICE_STYLES,
  CATERING_MIN_GUESTS,
  CATERING_MAX_GUESTS,
  EXTRA_MEAT_PER_GUEST,
  EXTRA_SIDE_PER_GUEST,
  EXTRA_DESSERT_PER_GUEST,
  type CateringOption,
} from '@/config/catering'
import { SMS_LINK, PHONE_TEL, PHONE_DISPLAY } from '@/config/site'
import { Reveal } from './Reveal'

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

function OptionPills({
  options,
  selected,
  onToggle,
  included,
}: {
  options: CateringOption[]
  selected: string[]
  onToggle: (id: string) => void
  included: number
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {options.map((o) => {
        const active = selected.includes(o.id)
        const isExtra = active && selected.indexOf(o.id) >= included
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            aria-pressed={active}
            style={{
              padding: '10px 16px',
              borderRadius: 999,
              border: `1px solid ${active ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
              background: active ? 'rgba(179,18,27,.18)' : '#0b0b0b',
              color: '#fff',
              fontSize: 15,
              cursor: 'pointer',
              transition: 'transform .15s ease, border-color .15s ease, background .15s ease',
              transform: active ? 'scale(1.04)' : 'none',
            }}
          >
            {o.name} <span style={{ opacity: 0.65, fontSize: 13 }}>· {o.es}</span>
            {isExtra && (
              <span style={{ color: 'var(--brand-primary)', fontSize: 12 }}> +extra</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function StepHead({ n, title, es, hint }: { n: number; title: string; es: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            color: 'var(--brand-primary)',
            border: '1px solid var(--brand-primary)',
            borderRadius: 999,
            width: 30,
            height: 30,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {n}
        </span>
        <h3 style={{ fontSize: 22, margin: 0 }}>
          {title} <span style={{ opacity: 0.55, fontSize: 16 }}>· {es}</span>
        </h3>
      </div>
      {hint && <p style={{ color: '#B5B5B5', fontSize: 14, margin: '8px 0 0 42px' }}>{hint}</p>}
    </div>
  )
}

export function CateringBuilder() {
  const [headcount, setHeadcount] = useState(50)
  const [pkgId, setPkgId] = useState('pitmaster')
  const [meats, setMeats] = useState<string[]>(['brisket', 'sausage'])
  const [sides, setSides] = useState<string[]>(['beans', 'mac'])
  const [desserts, setDesserts] = useState<string[]>([])
  const [serviceId, setServiceId] = useState('dropoff')
  const [date, setDate] = useState('')

  const pkg = CATERING_PACKAGES.find((p) => p.id === pkgId) ?? CATERING_PACKAGES[1]
  const service = SERVICE_STYLES.find((s) => s.id === serviceId) ?? SERVICE_STYLES[0]

  const calc = useMemo(() => {
    const extraMeats = Math.max(0, meats.length - pkg.meatsIncluded)
    const extraSides = Math.max(0, sides.length - pkg.sidesIncluded)
    const extraDesserts = Math.max(0, desserts.length - pkg.dessertsIncluded)
    const perGuest =
      pkg.perGuest +
      extraMeats * EXTRA_MEAT_PER_GUEST +
      extraSides * EXTRA_SIDE_PER_GUEST +
      extraDesserts * EXTRA_DESSERT_PER_GUEST +
      service.perGuest
    return { extraMeats, extraSides, extraDesserts, perGuest, total: perGuest * headcount }
  }, [meats, sides, desserts, pkg, service, headcount])

  const nameList = (ids: string[], options: CateringOption[]) =>
    ids.map((id) => options.find((o) => o.id === id)?.name ?? id).join(', ') || '—'

  const smsBody = useMemo(() => {
    const lines = [
      "Momma Sally's catering request",
      `${headcount} guests · ${pkg.name} · ${service.name}`,
      `Meats: ${nameList(meats, CATERING_MEATS)}`,
      `Sides: ${nameList(sides, CATERING_SIDES)}`,
    ]
    if (desserts.length) lines.push(`Desserts: ${nameList(desserts, CATERING_DESSERTS)}`)
    lines.push(`Estimate: ${money(calc.total)} (${money(calc.perGuest)}/guest)`)
    if (date) lines.push(`Event date: ${date}`)
    return lines.join('\n')
  }, [headcount, pkg, service, meats, sides, desserts, calc, date])

  const smsHref = `${SMS_LINK}?&body=${encodeURIComponent(smsBody)}`

  const card: React.CSSProperties = {
    border: '1px solid var(--brand-border)',
    borderRadius: 18,
    padding: 24,
    background: '#0b0b0b',
  }

  return (
    <div>
      <div style={{ display: 'grid', gap: 20 }}>
        <Reveal>
          <section style={card}>
            <StepHead n={1} title="How many guests?" es="¿Cuántos invitados?" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <input
                type="range"
                min={CATERING_MIN_GUESTS}
                max={CATERING_MAX_GUESTS}
                step={5}
                value={headcount}
                onChange={(e) => setHeadcount(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--brand-primary)' }}
                aria-label="Guest count"
              />
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 34,
                  minWidth: 90,
                  textAlign: 'right',
                }}
              >
                {headcount}
              </div>
            </div>
            <p style={{ color: '#B5B5B5', fontSize: 13, margin: '8px 0 0' }}>
              Minimum {CATERING_MIN_GUESTS} guests · Mínimo {CATERING_MIN_GUESTS} invitados
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section style={card}>
            <StepHead n={2} title="Pick your package" es="Elige tu paquete" />
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              {CATERING_PACKAGES.map((p) => {
                const active = p.id === pkgId
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPkgId(p.id)
                      setMeats(CATERING_MEATS.slice(0, p.meatsIncluded).map((m) => m.id))
                      setSides(CATERING_SIDES.slice(0, p.sidesIncluded).map((s) => s.id))
                      setDesserts(CATERING_DESSERTS.slice(0, p.dessertsIncluded).map((d) => d.id))
                    }}
                    aria-pressed={active}
                    style={{
                      textAlign: 'left',
                      padding: 20,
                      borderRadius: 14,
                      cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
                      background: active ? 'rgba(179,18,27,.12)' : 'transparent',
                      color: '#fff',
                      transition: 'transform .15s ease, border-color .15s ease',
                      transform: active ? 'scale(1.02)' : 'none',
                      position: 'relative',
                    }}
                  >
                    {p.featured && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -11,
                          left: 16,
                          background: 'var(--brand-primary)',
                          color: '#fff',
                          fontSize: 11,
                          padding: '3px 10px',
                          borderRadius: 999,
                          letterSpacing: '.06em',
                        }}
                      >
                        MOST BOOKED
                      </span>
                    )}
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{p.name}</div>
                    <div style={{ opacity: 0.6, fontSize: 13, marginBottom: 8 }}>{p.es}</div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 26,
                        color: 'var(--brand-primary)',
                      }}
                    >
                      {money(p.perGuest)}
                      <span style={{ fontSize: 14, color: '#B5B5B5' }}>/guest</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#ddd', margin: '8px 0 0', lineHeight: 1.5 }}>
                      {p.blurb}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section style={card}>
            <StepHead
              n={3}
              title="Build your menu"
              es="Arma tu menú"
              hint={`Includes ${pkg.meatsIncluded} meat${pkg.meatsIncluded > 1 ? 's' : ''}, ${pkg.sidesIncluded} sides${pkg.dessertsIncluded ? `, ${pkg.dessertsIncluded} dessert` : ''} — extras are priced per guest.`}
            />
            <h4 style={{ fontSize: 15, margin: '18px 0 10px', letterSpacing: '.04em' }}>
              MEATS · CARNES
            </h4>
            <OptionPills
              options={CATERING_MEATS}
              selected={meats}
              onToggle={(id) => setMeats(toggle(meats, id))}
              included={pkg.meatsIncluded}
            />
            <h4 style={{ fontSize: 15, margin: '18px 0 10px', letterSpacing: '.04em' }}>
              SIDES · ACOMPAÑAMIENTOS
            </h4>
            <OptionPills
              options={CATERING_SIDES}
              selected={sides}
              onToggle={(id) => setSides(toggle(sides, id))}
              included={pkg.sidesIncluded}
            />
            <h4 style={{ fontSize: 15, margin: '18px 0 10px', letterSpacing: '.04em' }}>
              DESSERTS · POSTRES
            </h4>
            <OptionPills
              options={CATERING_DESSERTS}
              selected={desserts}
              onToggle={(id) => setDesserts(toggle(desserts, id))}
              included={pkg.dessertsIncluded}
            />
          </section>
        </Reveal>

        <Reveal>
          <section style={card}>
            <StepHead n={4} title="How do you want it served?" es="¿Cómo lo servimos?" />
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              }}
            >
              {SERVICE_STYLES.map((s) => {
                const active = s.id === serviceId
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServiceId(s.id)}
                    aria-pressed={active}
                    style={{
                      textAlign: 'left',
                      padding: 18,
                      borderRadius: 14,
                      cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
                      background: active ? 'rgba(179,18,27,.12)' : 'transparent',
                      color: '#fff',
                    }}
                  >
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ opacity: 0.6, fontSize: 13 }}>{s.es}</div>
                    <div style={{ fontSize: 14, color: 'var(--brand-primary)', margin: '6px 0' }}>
                      {s.perGuest === 0 ? 'Included' : `+${money(s.perGuest)}/guest`}
                    </div>
                    <p style={{ fontSize: 13, color: '#B5B5B5', margin: 0, lineHeight: 1.5 }}>
                      {s.blurb}
                    </p>
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: 18 }}>
              <label htmlFor="cb-date" style={{ fontSize: 14, color: '#B5B5B5' }}>
                Event date · Fecha del evento
              </label>
              <input
                id="cb-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--brand-border)',
                  background: '#0b0b0b',
                  color: '#fff',
                  fontSize: 15,
                  colorScheme: 'dark',
                }}
              />
            </div>
          </section>
        </Reveal>
      </div>

      {/* Sticky estimate bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 20,
          marginTop: 24,
          border: '1px solid var(--brand-primary)',
          borderRadius: 18,
          background: 'rgba(10,10,10,.96)',
          backdropFilter: 'blur(8px)',
          padding: '18px 22px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: '#B5B5B5' }}>Your estimate · Tu estimado</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 1.1 }}>
            {money(calc.total)}{' '}
            <span style={{ fontSize: 15, color: '#B5B5B5' }}>
              ({money(calc.perGuest)}/guest · {headcount} guests)
            </span>
          </div>
          {(calc.extraMeats > 0 || calc.extraSides > 0 || calc.extraDesserts > 0) && (
            <div style={{ fontSize: 12, color: '#B5B5B5', marginTop: 4 }}>
              Includes extras: {[
                calc.extraMeats > 0 && `${calc.extraMeats} meat${calc.extraMeats > 1 ? 's' : ''}`,
                calc.extraSides > 0 && `${calc.extraSides} side${calc.extraSides > 1 ? 's' : ''}`,
                calc.extraDesserts > 0 && `${calc.extraDesserts} dessert${calc.extraDesserts > 1 ? 's' : ''}`,
              ]
                .filter(Boolean)
                .join(', ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={smsHref} className="ms-btn ms-btn-red">
            Text us this menu
          </a>
          <a href={PHONE_TEL} className="ms-btn ms-btn-ghost">
            Call {PHONE_DISPLAY}
          </a>
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#777', marginTop: 12, textAlign: 'center' }}>
        Estimate only — final quote confirmed by phone. · Solo un estimado — cotización final por
        teléfono.
      </p>
    </div>
  )
}
