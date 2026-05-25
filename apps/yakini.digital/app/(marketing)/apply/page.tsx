'use client'

import { useState } from 'react'
import { SiteShell } from '@/components/SiteShell'
import { createClient } from '@supabase/supabase-js'

// ═════════════════════════════════════════════════════════════════════════
// YAKINI APPLY PAGE
// File: apps/yakini.digital/app/(marketing)/apply/page.tsx
//
// Purpose: Premium strategic partner application that filters, qualifies,
// and converts. Saves to Supabase. Notifies admin@yakini.digital.
//
// IMPORTANT: This page assumes a `partnership_applications` table exists
// in Yakini's Supabase. If not, run the migration SQL at the bottom
// of this file in Yakini's Supabase SQL editor.
// ═════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TIERS = [
  { val: 'foundation', label: 'Foundation · $1,500/mo' },
  { val: 'authority', label: 'Authority · $3,000/mo' },
  { val: 'intelligence', label: 'Intelligence · $7,500/mo' },
  { val: 'enterprise', label: 'Enterprise · $15,000+/mo' },
  { val: 'unsure', label: 'Not sure yet — help me decide' },
]

const INDUSTRIES = [
  'Tow defense / Legal services',
  'Private chef / Catering / Hospitality',
  'Oilfield services / Energy',
  'Trucking / Fleet / Logistics',
  'Restaurant / Food service',
  'Film / Production / Creative',
  'Transportation / Mobility',
  'Real estate / Property services',
  'Healthcare / Wellness',
  'Construction / Trades',
  'Nonprofit / Community services',
  'Other',
]

const TIMELINES = [
  'ASAP — I need this yesterday',
  'Within 30 days',
  'Within 60-90 days',
  'Exploring for next quarter',
  'Just researching',
]

const REVENUE_RANGES = [
  'Pre-revenue / Just starting',
  'Under $100K annual revenue',
  '$100K – $500K',
  '$500K – $1M',
  '$1M – $5M',
  '$5M – $10M',
  '$10M+',
  'Prefer not to say',
]

type Step = 1 | 2 | 3 | 4 | 'success'

export default function ApplyPage() {
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    // Step 1: About you
    full_name: '',
    email: '',
    phone: '',
    role: '',
    // Step 2: About business
    business_name: '',
    business_website: '',
    industry: '',
    industry_other: '',
    revenue_range: '',
    location: '',
    // Step 3: The build
    tier_interest: '',
    timeline: '',
    current_pain: '',
    biggest_outcome: '',
    // Step 4: Fit check
    referral_source: '',
    why_yakini: '',
    additional: '',
  })

  const update = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v })

  const validateStep = (s: number): boolean => {
    setError('')
    if (s === 1) {
      if (!form.full_name.trim()) return setErr('Full name required')
      if (!form.email.trim()) return setErr('Email required')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setErr('Valid email required')
      if (!form.phone.trim()) return setErr('Phone number required')
      if (!form.role.trim()) return setErr('Your role required')
    }
    if (s === 2) {
      if (!form.business_name.trim()) return setErr('Business name required')
      if (!form.industry) return setErr('Please select an industry')
      if (form.industry === 'Other' && !form.industry_other.trim()) return setErr('Please describe your industry')
      if (!form.revenue_range) return setErr('Please select revenue range')
      if (!form.location.trim()) return setErr('Location required')
    }
    if (s === 3) {
      if (!form.tier_interest) return setErr('Please select tier interest')
      if (!form.timeline) return setErr('Please select timeline')
      if (!form.current_pain.trim() || form.current_pain.length < 30) return setErr('Please describe what\'s broken (at least 30 chars)')
      if (!form.biggest_outcome.trim() || form.biggest_outcome.length < 30) return setErr('Please describe your desired outcome (at least 30 chars)')
    }
    return true
  }

  const setErr = (msg: string): false => {
    setError(msg)
    return false
  }

  const next = () => {
    if (!validateStep(step as number)) return
    if (typeof step === 'number' && step < 4) setStep((step + 1) as Step)
  }

  const prev = () => {
    if (typeof step === 'number' && step > 1) setStep((step - 1) as Step)
  }

  const submit = async () => {
    if (!validateStep(3)) return
    setSubmitting(true)
    setError('')
    try {
      const submission = {
        ...form,
        industry: form.industry === 'Other' ? form.industry_other : form.industry,
        submitted_at: new Date().toISOString(),
        status: 'new',
      }

      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')

      setStep('success')
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Try again.')
    }
    setSubmitting(false)
  }

  return (
    <SiteShell>
      <style>{PAGE_CSS}</style>

      {/* ───── HEADER ───── */}
      <header className="yk-page-header ap-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>STRATEGIC PARTNER APPLICATION</span>
          </div>
          <h1 className="yk-page-h1">
            <span className="yk-italic">Apply for</span>
            <br />
            <span className="yk-gold">partnership.</span>
          </h1>
          <p className="yk-page-sub">
            Yakini is selective. We work with a handful of serious founders at a time.
            This application takes 5-7 minutes and gives us what we need to know if we're a fit
            before either of us invests further time. Real conversations come after real applications.
          </p>
        </div>
      </header>

      {/* ───── APPLICATION FORM ───── */}
      <section className="yk-section ap-form-section">
        <div className="yk-section-inner">
          <div className="ap-form-wrapper">

            {/* Progress */}
            {step !== 'success' && (
              <div className="ap-progress">
                <div className="ap-progress-inner">
                  {[1, 2, 3, 4].map(s => (
                    <div
                      key={s}
                      className={`ap-progress-step ${
                        step === s ? 'active' : ''
                      } ${typeof step === 'number' && s < step ? 'complete' : ''}`}
                    >
                      <div className="ap-progress-num">{s}</div>
                      <div className="ap-progress-label">
                        {s === 1 && 'You'}
                        {s === 2 && 'Business'}
                        {s === 3 && 'The Build'}
                        {s === 4 && 'Fit'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="ap-form-card">

              {/* STEP 1 — About You */}
              {step === 1 && (
                <div className="ap-step">
                  <div className="ap-step-meta">STEP 01 OF 04</div>
                  <h2 className="ap-step-h">Tell us about <span className="yk-italic">you.</span></h2>
                  <p className="ap-step-sub">
                    Yakini works with founders and decision-makers directly.
                    We don't run intake calls with project managers or marketing assistants.
                  </p>

                  <div className="ap-fields">
                    <Field label="Full name *" value={form.full_name} onChange={v => update('full_name', v)} placeholder="John Smith" />
                    <Field label="Email *" type="email" value={form.email} onChange={v => update('email', v)} placeholder="you@business.com" />
                    <Field label="Phone *" type="tel" value={form.phone} onChange={v => update('phone', v)} placeholder="(555) 123-4567" />
                    <Field label="Your role *" value={form.role} onChange={v => update('role', v)} placeholder="Founder · CEO · Owner · etc." />
                  </div>
                </div>
              )}

              {/* STEP 2 — Business */}
              {step === 2 && (
                <div className="ap-step">
                  <div className="ap-step-meta">STEP 02 OF 04</div>
                  <h2 className="ap-step-h">About your <span className="yk-italic">business.</span></h2>
                  <p className="ap-step-sub">
                    Yakini builds platforms for serious operations. The more context we have on your business now,
                    the better we can architect what you need.
                  </p>

                  <div className="ap-fields">
                    <Field label="Business name *" value={form.business_name} onChange={v => update('business_name', v)} placeholder="Your business" />
                    <Field label="Current website (if any)" value={form.business_website} onChange={v => update('business_website', v)} placeholder="https://example.com" />

                    <div className="ap-field">
                      <label>Industry *</label>
                      <select value={form.industry} onChange={e => update('industry', e.target.value)}>
                        <option value="">Select your industry...</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>

                    {form.industry === 'Other' && (
                      <Field label="Describe your industry *" value={form.industry_other} onChange={v => update('industry_other', v)} placeholder="..." />
                    )}

                    <div className="ap-field">
                      <label>Annual revenue range *</label>
                      <select value={form.revenue_range} onChange={e => update('revenue_range', e.target.value)}>
                        <option value="">Select...</option>
                        {REVENUE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <span className="ap-field-hint">This helps us match you to the right tier and tell you honestly if Yakini is a fit.</span>
                    </div>

                    <Field label="Location *" value={form.location} onChange={v => update('location', v)} placeholder="City, State (or 'Remote')" />
                  </div>
                </div>
              )}

              {/* STEP 3 — The Build */}
              {step === 3 && (
                <div className="ap-step">
                  <div className="ap-step-meta">STEP 03 OF 04</div>
                  <h2 className="ap-step-h">Tell us about <span className="yk-italic">the build.</span></h2>
                  <p className="ap-step-sub">
                    The more specific you are here, the more useful our first conversation will be.
                    Honesty matters more than polish.
                  </p>

                  <div className="ap-fields">
                    <div className="ap-field">
                      <label>Tier interest *</label>
                      <select value={form.tier_interest} onChange={e => update('tier_interest', e.target.value)}>
                        <option value="">Select tier...</option>
                        {TIERS.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                      </select>
                    </div>

                    <div className="ap-field">
                      <label>Timeline *</label>
                      <select value={form.timeline} onChange={e => update('timeline', e.target.value)}>
                        <option value="">When are you ready to start?</option>
                        {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="ap-field">
                      <label>What's broken right now? *</label>
                      <textarea
                        value={form.current_pain}
                        onChange={e => update('current_pain', e.target.value)}
                        placeholder="What's not working in your operations? What tools are you patching together? What's costing you time, money, or sanity?"
                        rows={5}
                      />
                      <span className="ap-field-hint">{form.current_pain.length} chars · Minimum 30</span>
                    </div>

                    <div className="ap-field">
                      <label>What's the biggest outcome you want from this platform? *</label>
                      <textarea
                        value={form.biggest_outcome}
                        onChange={e => update('biggest_outcome', e.target.value)}
                        placeholder="If we built you the perfect platform, what would change in your business? What can't you currently do that you wish you could?"
                        rows={5}
                      />
                      <span className="ap-field-hint">{form.biggest_outcome.length} chars · Minimum 30</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 — Fit */}
              {step === 4 && (
                <div className="ap-step">
                  <div className="ap-step-meta">STEP 04 OF 04</div>
                  <h2 className="ap-step-h">Last few <span className="yk-italic">questions.</span></h2>
                  <p className="ap-step-sub">
                    Optional but helpful. The more we know going in, the more focused our first call will be.
                  </p>

                  <div className="ap-fields">
                    <Field
                      label="How did you hear about Yakini?"
                      value={form.referral_source}
                      onChange={v => update('referral_source', v)}
                      placeholder="Referral · Search · Social · Garland · etc."
                    />

                    <div className="ap-field">
                      <label>Why Yakini specifically?</label>
                      <textarea
                        value={form.why_yakini}
                        onChange={e => update('why_yakini', e.target.value)}
                        placeholder="What drew you to apply? What made you stop and read this far?"
                        rows={4}
                      />
                    </div>

                    <div className="ap-field">
                      <label>Anything else we should know?</label>
                      <textarea
                        value={form.additional}
                        onChange={e => update('additional', e.target.value)}
                        placeholder="Constraints, deadlines, dealbreakers, exciting context — anything that would help us understand your situation."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUCCESS */}
              {step === 'success' && (
                <div className="ap-success">
                  <div className="ap-success-check">✓</div>
                  <h2 className="ap-success-h">
                    Application <span className="yk-italic">received.</span>
                  </h2>
                  <p className="ap-success-sub">
                    Thank you, <strong style={{ color: 'var(--gold)' }}>{form.full_name.split(' ')[0]}</strong>.
                    Your application is in front of us.
                  </p>

                  <div className="ap-success-next">
                    <h3>What happens next:</h3>
                    <ol>
                      <li><strong>Within 48 hours</strong> — We review your application carefully (no auto-replies).</li>
                      <li><strong>If it's a fit</strong> — We email you to schedule a 30-minute strategic intake call.</li>
                      <li><strong>If it's not a fit yet</strong> — We tell you why honestly and recommend next steps.</li>
                    </ol>
                  </div>

                  <p className="ap-success-note">
                    Either way, you'll hear from us. Keep an eye on <strong style={{ color: 'var(--cream)' }}>{form.email}</strong>.
                  </p>

                  <a href="/" className="yk-btn-ghost">
                    <span>Back to home</span>
                    <span className="yk-btn-arrow">→</span>
                  </a>
                </div>
              )}

              {/* Error */}
              {error && step !== 'success' && (
                <div className="ap-error">{error}</div>
              )}

              {/* Navigation */}
              {step !== 'success' && (
                <div className="ap-nav">
                  {typeof step === 'number' && step > 1 ? (
                    <button onClick={prev} className="ap-btn-back" disabled={submitting}>
                      ← Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step !== 4 ? (
                    <button onClick={next} className="ap-btn-next" disabled={submitting}>
                      Continue <span className="yk-btn-arrow">→</span>
                    </button>
                  ) : (
                    <button onClick={submit} className="ap-btn-submit" disabled={submitting}>
                      {submitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION →'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar info */}
            {step !== 'success' && (
              <div className="ap-sidebar">
                <div className="ap-sidebar-card">
                  <div className="ap-sidebar-h">WHY THE APPLICATION?</div>
                  <p>
                    Most agencies will take any client willing to pay. Yakini doesn't.
                    The application exists because misaligned partnerships waste both our time.
                  </p>
                </div>

                <div className="ap-sidebar-card">
                  <div className="ap-sidebar-h">WHAT WE'RE LOOKING FOR</div>
                  <ul>
                    <li>Decision-makers, not gatekeepers</li>
                    <li>Real businesses with real operations</li>
                    <li>Founders who own their infrastructure ambition</li>
                    <li>Industries that have been underserved</li>
                  </ul>
                </div>

                <div className="ap-sidebar-card">
                  <div className="ap-sidebar-h">DIRECT CONTACT</div>
                  <p>If you'd rather skip the form:</p>
                  <a href="mailto:hello@yakini.digital" className="ap-sidebar-email">hello@yakini.digital</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

// Field component
type FieldProps = {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  type?: string
}

function Field({ label, value, onChange, placeholder, type = 'text' }: FieldProps) {
  return (
    <div className="ap-field">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

const PAGE_CSS = `
  /* ═══ HEADER ═══ */
  .ap-header {
    background: linear-gradient(180deg, rgba(10, 9, 8, 0.20) 0%, rgba(10, 9, 8, 0.40) 100%), url('/yakini-apply-bg.jpg') center center / cover no-repeat;
    min-height: 600px;
    position: relative;
  }
  .ap-header::before {
    background: radial-gradient(ellipse at center,
      rgba(200, 168, 75, 0.15) 0%,
    rgba(74, 144, 217, 0.06) 40%,
      transparent 70%) !important;
  }

  /* ═══ FORM SECTION ═══ */
  .ap-form-section { background: var(--black); }
  .ap-form-wrapper {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 40px;
    align-items: start;
  }

  /* Progress */
  .ap-progress {
    grid-column: span 2;
    margin-bottom: 24px;
  }
  .ap-progress-inner {
    display: flex;
    gap: 0;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
    padding: 8px;
  }
  .ap-progress-step {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    transition: all 0.3s;
    border-bottom: 2px solid transparent;
  }
  .ap-progress-step.active {
    background: rgba(200, 168, 75, 0.08);
    border-bottom-color: var(--gold);
  }
  .ap-progress-step.complete .ap-progress-num {
    background: var(--gold);
    color: var(--navy-deep);
  }
  .ap-progress-num {
    width: 28px; height: 28px;
    background: var(--line-strong);
    color: var(--cream);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    transition: all 0.3s;
  }
  .ap-progress-step.active .ap-progress-num {
    background: var(--gold);
    color: var(--navy-deep);
  }
  .ap-progress-label {
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--muted);
  }
  .ap-progress-step.active .ap-progress-label,
  .ap-progress-step.complete .ap-progress-label {
    color: var(--cream);
  }

  /* Form card */
  .ap-form-card {
    padding: 48px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
  }

  .ap-step-meta {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--gold);
    margin-bottom: 16px;
    text-transform: uppercase;
  }
  .ap-step-h {
    font-family: var(--font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    line-height: 1.1;
    color: var(--cream);
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
  .ap-step-sub {
    font-size: 16px;
    line-height: 1.7;
    color: var(--muted);
    margin-bottom: 40px;
    max-width: 64ch;
  }

  /* Fields */
  .ap-fields {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .ap-field {
    display: flex;
    flex-direction: column;
  }
  .ap-field label {
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--gold);
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .ap-field input,
  .ap-field select,
  .ap-field textarea {
    background: var(--navy-deep);
    border: 1.5px solid var(--line-strong);
    color: var(--cream);
    padding: 14px 16px;
    font-size: 15px;
    font-family: var(--font-body);
    outline: none;
    transition: border-color 0.2s;
  }
  .ap-field input:focus,
  .ap-field select:focus,
  .ap-field textarea:focus {
    border-color: var(--gold);
  }
  .ap-field input::placeholder,
  .ap-field textarea::placeholder {
    color: rgba(255,255,255,0.3);
  }
  .ap-field textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.6;
    font-family: var(--font-body);
  }
  .ap-field select {
    appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, var(--gold) 50%),
      linear-gradient(135deg, var(--gold) 50%, transparent 50%);
    background-position: calc(100% - 20px) 50%, calc(100% - 14px) 50%;
    background-size: 6px 6px;
    background-repeat: no-repeat;
    padding-right: 40px;
  }
  .ap-field-hint {
    font-size: 12px;
    color: var(--muted);
    margin-top: 6px;
    font-style: italic;
    font-family: var(--font-display);
  }

  /* Error */
  .ap-error {
    margin-top: 24px;
    padding: 14px 18px;
    background: rgba(255, 56, 56, 0.08);
    border: 1px solid rgba(255, 56, 56, 0.4);
    color: rgba(255, 107, 107, 0.95);
    font-size: 14px;
    font-weight: 500;
  }

  /* Navigation */
  .ap-nav {
    margin-top: 40px;
    padding-top: 32px;
    border-top: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  .ap-btn-back {
    background: transparent;
    border: 1.5px solid var(--line-strong);
    color: var(--cream);
    padding: 14px 24px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ap-btn-back:hover:not(:disabled) {
    border-color: var(--gold);
    color: var(--gold);
  }
  .ap-btn-back:disabled { opacity: 0.5; cursor: not-allowed; }

  .ap-btn-next {
    background: var(--gold);
    color: var(--navy-deep);
    border: 1.5px solid var(--gold);
    padding: 14px 28px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.3s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .ap-btn-next:hover:not(:disabled) {
    background: var(--cream);
    border-color: var(--cream);
    transform: translateY(-2px);
  }
  .ap-btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
  .ap-btn-next .yk-btn-arrow { transition: transform 0.25s; }
  .ap-btn-next:hover:not(:disabled) .yk-btn-arrow { transform: translateX(4px); }

  .ap-btn-submit {
    background: var(--electric);
    color: var(--cream);
    border: none;
    padding: 16px 32px;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.3s;
    text-transform: uppercase;
  }
  .ap-btn-submit:hover:not(:disabled) {
    background: var(--gold);
    color: var(--navy-deep);
    box-shadow: 0 12px 30px rgba(74, 144, 217, 0.3);
    transform: translateY(-2px);
  }
  .ap-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Sidebar */
  .ap-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: sticky;
    top: 120px;
  }
  .ap-sidebar-card {
    padding: 28px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--line);
  }
  .ap-sidebar-h {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold);
    margin-bottom: 12px;
    text-transform: uppercase;
  }
  .ap-sidebar-card p {
    font-size: 13px;
    line-height: 1.7;
    color: var(--cream);
    margin-bottom: 12px;
  }
  .ap-sidebar-card ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ap-sidebar-card li {
    font-size: 13px;
    line-height: 1.6;
    color: var(--cream);
    padding-left: 18px;
    position: relative;
  }
  .ap-sidebar-card li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--gold);
  }
  .ap-sidebar-email {
    display: inline-block;
    margin-top: 8px;
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
    color: var(--gold);
  }
  .ap-sidebar-email:hover { color: var(--cream); }

  /* Success */
  .ap-success {
    text-align: center;
    padding: 40px 0;
  }
  .ap-success-check {
    width: 88px; height: 88px;
    border: 3px solid var(--gold);
    color: var(--gold);
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 44px;
    font-weight: 300;
    margin-bottom: 32px;
  }
  .ap-success-h {
    font-family: var(--font-display);
    font-size: clamp(40px, 6vw, 64px);
    font-weight: 500;
    color: var(--cream);
    line-height: 1;
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
  .ap-success-sub {
    font-size: 18px;
    color: var(--cream);
    margin-bottom: 40px;
  }
  .ap-success-next {
    text-align: left;
    max-width: 540px;
    margin: 0 auto 40px;
    padding: 32px;
    background: rgba(200, 168, 75, 0.04);
    border: 1px solid var(--gold);
  }
  .ap-success-next h3 {
    font-family: var(--font-display);
    font-size: 22px;
    font-style: italic;
    color: var(--gold);
    margin-bottom: 20px;
  }
  .ap-success-next ol {
    list-style: none;
    counter-reset: success-counter;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .ap-success-next li {
    counter-increment: success-counter;
    padding-left: 36px;
    position: relative;
    font-size: 15px;
    line-height: 1.7;
    color: var(--cream);
  }
  .ap-success-next li::before {
    content: counter(success-counter);
    position: absolute;
    left: 0; top: -2px;
    width: 24px; height: 24px;
    background: var(--gold);
    color: var(--navy-deep);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    border-radius: 50%;
  }
  .ap-success-note {
    color: var(--muted);
    font-size: 14px;
    margin-bottom: 32px;
    font-style: italic;
    font-family: var(--font-display);
  }

  @media (max-width: 1000px) {
    .ap-form-wrapper { grid-template-columns: 1fr; }
    .ap-sidebar { position: static; }
  }
  @media (max-width: 700px) {
    .ap-form-card { padding: 32px 24px; }
    .ap-progress-label { display: none; }
    .ap-progress-step { padding: 8px 12px; gap: 8px; justify-content: center; }
  }
`

/*
═══════════════════════════════════════════════════════════════════════════
SUPABASE MIGRATION (run once in Yakini Supabase SQL editor):

create table if not exists partnership_applications (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  phone text,
  role text,
  business_name text,
  business_website text,
  industry text,
  revenue_range text,
  location text,
  tier_interest text,
  timeline text,
  current_pain text,
  biggest_outcome text,
  referral_source text,
  why_yakini text,
  additional text,
  status text default 'new',
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  notes text
);

alter table partnership_applications enable row level security;

create policy "Anon insert applications"
  on partnership_applications for insert to anon
  with check (true);

create policy "Service read all"
  on partnership_applications for select to service_role
  using (true);
═══════════════════════════════════════════════════════════════════════════
*/
