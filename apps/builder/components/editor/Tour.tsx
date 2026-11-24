'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TOUR_STEPS, TOUR_SKIPPED, type TourStep } from '@/lib/editor/tutorial'
import { panel } from './context'

/**
 * The guided tour (spec 10.9): 8 steps, each pointing at the real part of the editor, with words for
 * computers and phones. Skip any time; each finished step is remembered, so it picks up where the
 * owner left off. Escape skips. The card is a labelled dialog that takes focus on each step.
 */
type Rect = { top: number; left: number; width: number; height: number }

function findTarget(step: TourStep, phone: boolean): HTMLElement | null {
  for (const sel of phone ? step.targets.phone : step.targets.desktop) {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el
    }
  }
  return null
}

export function Tour({ start, onPrepare, onStepDone, onClose }: {
  start: number
  onPrepare: (p: TourStep['prepare']) => void
  onStepDone: (id: string) => void
  onClose: () => void
}) {
  const [i, setI] = useState(start)
  const [rect, setRect] = useState<Rect | null>(null)
  const [phone, setPhone] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const step = TOUR_STEPS[i]

  const measure = useCallback(() => {
    const isPhone = window.matchMedia('(max-width: 1023px)').matches
    setPhone(isPhone)
    const el = findTarget(step, isPhone)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  // Get the editor ready for this step, then bring its target into view and measure it.
  useEffect(() => {
    onPrepare(step.prepare)
    const t = setTimeout(() => {
      const el = findTarget(step, window.matchMedia('(max-width: 1023px)').matches)
      el?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
      measure()
      card.current?.focus()
    }, 80)
    return () => clearTimeout(t)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [measure])

  const skip = useCallback(() => { onStepDone(TOUR_SKIPPED); onClose() }, [onClose, onStepDone])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') skip() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [skip])

  const next = () => {
    onStepDone(step.id)
    if (i === TOUR_STEPS.length - 1) { onPrepare('clear'); onClose() } else setI(i + 1)
  }

  // Card position: phones get a card across the top; computers get it beside the target.
  const style: React.CSSProperties = (() => {
    if (phone || !rect) return phone ? { top: 64, left: 12, right: 12 } : { top: '30%', left: '50%', transform: 'translateX(-50%)', width: 380 }
    const w = 360, gap = 12
    const below = rect.top + rect.height + gap + 220 < window.innerHeight
    const top = below ? rect.top + rect.height + gap : Math.max(64, rect.top - gap - 220)
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - w - 12)
    return { top, left, width: w }
  })()

  return (
    <>
      {rect && (
        <div aria-hidden="true" className="pointer-events-none fixed z-40 rounded-xl"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: '0 0 0 3px #C9A14A, 0 0 0 9999px rgba(0,0,0,.45)' }} />
      )}
      <div ref={card} role="dialog" aria-modal="false" aria-labelledby="tour-title" aria-describedby="tour-body" tabIndex={-1} data-tour-step={step.id}
        className="fixed z-50 rounded-2xl border border-gold/60 bg-[#121010] p-5 text-paper shadow-2xl focus:outline-none" style={style}>
        <p className="text-xs uppercase tracking-wide text-muted">Step {i + 1} of {TOUR_STEPS.length}</p>
        <h2 id="tour-title" className="mt-1 font-serif text-xl">{step.title}</h2>
        <p id="tour-body" className="mt-2 text-paper/90">{phone && step.phoneBody ? step.phoneBody : step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" className="text-sm text-muted underline underline-offset-4 hover:text-paper" onClick={skip}>Skip tour</button>
          <div className="flex gap-2">
            {i > 0 && <button type="button" className={panel.btn} onClick={() => setI(i - 1)}>Back</button>}
            <button type="button" className={panel.primary} onClick={next}>{i === TOUR_STEPS.length - 1 ? 'Done' : 'Next'}</button>
          </div>
        </div>
      </div>
    </>
  )
}
