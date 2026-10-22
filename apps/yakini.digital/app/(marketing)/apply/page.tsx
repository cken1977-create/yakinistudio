'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SiteShell } from '@/components/SiteShell'
import { OFFER_CHOICES, OFFER_GROUPS, START_URL, startUrl } from '@/lib/pricing'

// ═════════════════════════════════════════════════════════════════════════
// BOOK A CALL: custom-build intake (/apply, kept so ?tier=partner links keep working).
// Saves through /api/apply and notifies admin@yakini.digital.
// Plan buyers are pointed to the portal sign-up (START_URL) instead.
// ═════════════════════════════════════════════════════════════════════════

const BUILD_TYPES = [
  'A lead engine (calls, leads and follow-up)',
  'A payment or accounting system',
  'A custom portal or workflow',
  'Something else',
  'Not sure yet, help me decide',
]

const TIMELINES = [
  'As soon as possible',
  'Within 30 days',
  'Within 60–90 days',
  'Later this year',
  'Just exploring',
]

type Step = 1 | 2 | 3 | 'success'

export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyForm />
    </Suspense>
  )
}

function ApplyForm() {
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    // Step 1: You
    full_name: '',
    email: '',
    phone: '',
    business_name: '',
    business_website: '',
    // Step 2: The build
    industry: '',
    build_type: '',
    tier_interest: '',
    timeline: '',
    current_pain: '',
    biggest_outcome: '',
    // Step 3: Optional
    role: '',
    location: '',
    referral_source: '',
    additional: '',
  })

  const update = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v })

  // Preselect the plan / Partner choice from ?tier= (e.g. /apply?tier=partner).
  const searchParams = useSearchParams()
  const tierParam = searchParams.get('tier') ?? ''
  const presetTier = OFFER_CHOICES.some(choice => choice.val === tierParam) ? tierParam : ''
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null)
  if (appliedPreset !== presetTier) {
    setAppliedPreset(presetTier)
    if (presetTier) setForm(current => ({ ...current, tier_interest: current.tier_interest || presetTier }))
  }
  const planPicked = ['operate', 'grow', 'founding'].includes(form.tier_interest)

  const validateStep = (s: number): boolean => {
    setError('')
    if (s === 1) {
      if (!form.full_name.trim()) return setErr('Please add your name.')
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setErr('Please add an email we can reach you at.')
      if (!form.business_name.trim()) return setErr('Please add your business name.')
    }
    if (s === 2) {
      if (!form.industry.trim()) return setErr('Tell us in a few words what your business does.')
      if (!form.build_type) return setErr('Pick what you would like built, or “Not sure yet”.')
      if (form.current_pain.trim().length < 15) return setErr('Tell us a little more about what it should do (a sentence or two is plenty).')
    }
    return true
  }

  const setErr = (msg: string): false => {
    setError(msg)
    return false
  }

  const next = () => {
    if (!validateStep(step as number)) return
    if (typeof step === 'number' && step < 3) setStep((step + 1) as Step)
  }

  const prev = () => {
    if (typeof step === 'number' && step > 1) setStep((step - 1) as Step)
  }

  const submit = async () => {
    if (!validateStep(1) || !validateStep(2)) return
    setSubmitting(true)
    setError('')
    try {
      const { build_type, ...rest } = form
      const submission = {
        ...rest,
        tier_interest: form.tier_interest || 'partner',
        current_pain: `What to build: ${build_type}\n\n${form.current_pain}`,
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <SiteShell>
      <style>{PAGE_CSS}</style>

      <header className="yk-page-header ap-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>BOOK A CALL · CUSTOM BUILDS</span>
          </div>
          <h1 className="yk-page-h1">
            Tell us what
            <br />
            <span className="yk-gold yk-italic">you want built.</span>
          </h1>
          <p className="yk-page-sub">
            A few quick questions, about three minutes. A real person at Yakini reads every one and gets back to you to set up a call.
            Every custom build is quoted in writing before anything starts.
          </p>
          <p className="ap-plan-note">
            Looking for the Yakini portal? You don&apos;t need a call. <a href={START_URL}>Start your setup →</a>
          </p>
        </div>
      </header>

      <section className="yk-section ap-form-section">
        <div className="yk-section-inner">
          <div className="ap-form-wrapper">

            {step !== 'success' && (
              <div className="ap-progress">
                <div className="ap-progress-inner">
                  {[1, 2, 3].map(s => (
                    <div
                      key={s}
                      className={`ap-progress-step ${
                        step === s ? 'active' : ''
                      } ${typeof step === 'number' && s < step ? 'complete' : ''}`}
                    >
                      <div className="ap-progress-num">{s}</div>
                      <div className="ap-progress-label">
                        {s === 1 && 'You'}
                        {s === 2 && 'The build'}
                        {s === 3 && 'Anything else'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="ap-form-card">

              {step === 1 && (
                <div className="ap-step">
                  <div className="ap-step-meta">STEP 1 OF 3</div>
                  <h2 className="ap-step-h">Nice to <span className="yk-italic">meet you.</span></h2>
                  <p className="ap-step-sub">Who should we talk to, and how do we reach you?</p>

                  <div className="ap-fields">
                    <Field label="Your name *" value={form.full_name} onChange={v => update('full_name', v)} placeholder="First and last name" />
                    <Field label="Email *" type="email" value={form.email} onChange={v => update('email', v)} placeholder="you@business.com" />
                    <Field label="Mobile (optional)" type="tel" value={form.phone} onChange={v => update('phone', v)} placeholder="(555) 123-4567" />
                    <Field label="Business name *" value={form.business_name} onChange={v => update('business_name', v)} placeholder="Your business" />
                    <Field label="Website (if you have one)" value={form.business_website} onChange={v => update('business_website', v)} placeholder="https://example.com" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="ap-step">
                  <div className="ap-step-meta">STEP 2 OF 3</div>
                  <h2 className="ap-step-h">Tell us about <span className="yk-italic">the build.</span></h2>
                  <p className="ap-step-sub">Plain words are perfect. We&apos;ll ask the detailed questions on the call.</p>

                  <div className="ap-fields">
                    <Field label="What does your business do? *" value={form.industry} onChange={v => update('industry', v)} placeholder="e.g. Home services, a law office, a clinic, a nonprofit…" />

                    <div className="ap-field">
                      <label>What would you like built? *</label>
                      <select value={form.build_type} onChange={e => update('build_type', e.target.value)}>
                        <option value="">Choose one…</option>
                        {BUILD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="ap-field">
                      <label>What should it do? *</label>
                      <textarea
                        value={form.current_pain}
                        onChange={e => update('current_pain', e.target.value)}
                        placeholder="What's getting in the way today, and what should the new system take care of?"
                        rows={5}
                      />
                    </div>

                    <div className="ap-field">
                      <label>What would a great result look like?</label>
                      <textarea
                        value={form.biggest_outcome}
                        onChange={e => update('biggest_outcome', e.target.value)}
                        placeholder="If this worked perfectly, what would be different six months from now?"
                        rows={4}
                      />
                    </div>

                    <div className="ap-field">
                      <label>When would you like to start?</label>
                      <select value={form.timeline} onChange={e => update('timeline', e.target.value)}>
                        <option value="">Choose one…</option>
                        {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="ap-field">
                      <label>Also interested in</label>
                      <select value={form.tier_interest} onChange={e => update('tier_interest', e.target.value)}>
                        <option value="">Just the custom build</option>
                        {OFFER_GROUPS.map(group => (
                          <optgroup key={group.id} label={group.label}>
                            {OFFER_CHOICES.filter(choice => choice.group === group.id).map(choice => (
                              <option key={choice.val} value={choice.val}>{choice.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {planPicked ? (
                        <span className="ap-field-hint">
                          Plans don&apos;t need a call. You can <a href={startUrl(form.tier_interest)} className="yk-gold">start your setup here</a>, or send this and we&apos;ll talk it through.
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="ap-step">
                  <div className="ap-step-meta">STEP 3 OF 3</div>
                  <h2 className="ap-step-h">Anything <span className="yk-italic">else?</span></h2>
                  <p className="ap-step-sub">All optional. Skip straight to send if you like.</p>

                  <div className="ap-fields">
                    <Field label="Your role" value={form.role} onChange={v => update('role', v)} placeholder="Owner, manager, director…" />
                    <Field label="Where are you based?" value={form.location} onChange={v => update('location', v)} placeholder="City, State" />
                    <Field label="How did you hear about Yakini?" value={form.referral_source} onChange={v => update('referral_source', v)} placeholder="A friend, search, social…" />
                    <div className="ap-field">
                      <label>Anything else we should know?</label>
                      <textarea
                        value={form.additional}
                        onChange={e => update('additional', e.target.value)}
                        placeholder="Deadlines, tools you use today, the best time to call…"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="ap-success">
                  <div className="ap-success-check">✓</div>
                  <h2 className="ap-success-h">
                    Thank you, <span className="yk-italic">{form.full_name.split(' ')[0]}.</span>
                  </h2>
                  <p className="ap-success-sub">
                    We have your details. A real person at Yakini will read them and get back to you.
                  </p>

                  <div className="ap-success-next">
                    <h3>What happens next:</h3>
                    <ol>
                      <li><strong>We read it</strong>: a person, not an auto-reply.</li>
                      <li><strong>We reach out</strong> to set up a call at a time that suits you.</li>
                      <li><strong>You get a written scope and quote</strong> before anything starts.</li>
                    </ol>
                  </div>

                  <p className="ap-success-note">
                    Keep an eye on <strong style={{ color: 'var(--cream)' }}>{form.email}</strong>.
                  </p>

                  <Link href="/custom-builds" className="yk-btn-ghost">
                    <span>Back to custom builds</span>
                    <span className="yk-btn-arrow">→</span>
                  </Link>
                </div>
              )}

              {error && step !== 'success' && (
                <div className="ap-error">{error}</div>
              )}

              {step !== 'success' && (
                <div className="ap-nav">
                  {typeof step === 'number' && step > 1 ? (
                    <button onClick={prev} className="ap-btn-back" disabled={submitting}>
                      ← Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step !== 3 ? (
                    <button onClick={next} className="ap-btn-next" disabled={submitting}>
                      Continue <span className="yk-btn-arrow">→</span>
                    </button>
                  ) : (
                    <button onClick={submit} className="ap-btn-submit" disabled={submitting}>
                      {submitting ? 'Sending…' : 'Send →'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {step !== 'success' && (
              <div className="ap-sidebar">
                <div className="ap-sidebar-card">
                  <div className="ap-sidebar-h">WHAT TO EXPECT</div>
                  <ul>
                    <li>A real person reads every message</li>
                    <li>A call at a time that suits you</li>
                    <li>A written scope and quote before anything starts</li>
                    <li>We stay on after launch to run it with you</li>
                  </ul>
                </div>

                <div className="ap-sidebar-card">
                  <div className="ap-sidebar-h">WANT THE PORTAL?</div>
                  <p>Plans start with a guided setup, no call needed.</p>
                  <a href={START_URL} className="ap-sidebar-email">Start your setup →</a>
                </div>

                <div className="ap-sidebar-card">
                  <div className="ap-sidebar-h">PREFER EMAIL?</div>
                  <p>Write to us directly:</p>
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
  .ap-plan-note { margin-top: 22px; font-size: 15px; color: rgba(244,241,235,0.7); }
  .ap-plan-note a { color: var(--gold); border-bottom: 1px solid rgba(200,168,75,0.4); }
  /* ═══ HEADER ═══ */
  .ap-header {
    background: linear-gradient(180deg, rgba(10, 9, 8, 0.55) 0%, rgba(10, 9, 8, 0.85) 100%), url('/yakini-office-bg.jpg') center center / cover no-repeat;
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
    .ap-form-wrapper > * { min-width: 0; }
    /* span 2 in a one-column grid adds a phantom column and pushes the page wider than the phone */
    .ap-progress { grid-column: auto; }
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
