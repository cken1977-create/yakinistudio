'use client'

import { useState, useEffect } from 'react'

const SUPABASE_URL = 'https://mxshsmknfqxwltucgezl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c2hzbWtuZnF4d2x0dWNnZXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDM1NjIsImV4cCI6MjA5MzA3OTU2Mn0.cdx3T5CVFKq2sis-FOHau2V0Lx3CrsyoZmaAfM689v0'
const RESEND_API_KEY = 're_DdtMrt3n_F6B4vJQiepzrYpHwK6gkB93N'
const NOTIFY_EMAIL = 'hello@yakini.digital'

type FormData = {
  first_name: string; last_name: string; biz_name: string; phone: string
  email: string; location: string; referral: string; industry: string
  biz_desc: string; ideal_customer: string; years_in_biz: string
  has_website: string; existing_url: string; services: string[]
  other_services: string; primary_goal: string; success_vision: string
  budget: string; timeline: string; has_branding: string; competitors: string
  brand_feeling: string; digital_score: number | null; anything_else: string
  contact_pref: string
}

const EMPTY: FormData = {
  first_name: '', last_name: '', biz_name: '', phone: '', email: '',
  location: '', referral: '', industry: '', biz_desc: '', ideal_customer: '',
  years_in_biz: '', has_website: '', existing_url: '', services: [],
  other_services: '', primary_goal: '', success_vision: '', budget: '',
  timeline: '', has_branding: '', competitors: '', brand_feeling: '',
  digital_score: null, anything_else: '', contact_pref: '',
}

const SERVICE_GROUPS = [
  { label: 'Digital Services', items: ['New Website', 'Website Redesign', 'Client Portal / Dashboard', 'Online Booking / Scheduling', 'Contact Forms / Lead Capture', 'E-Commerce / Online Payments'] },
  { label: 'Marketing', items: ['Social Media Content', 'Google Business Profile', 'Email Marketing', 'Paid Ads (Google / Meta)', 'SEO / Local Search', 'Brand Identity / Logo'] },
  { label: 'AI & Automation', items: ['AI Chat / Lead Qualification', 'Automated Follow-Up / CRM', 'Document Automation', 'Reporting / Analytics'] },
]

const STEP_NAMES = ['About You', 'Your Business', 'Services', 'Goals', 'Final Details']

export default function IntakePage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const set = (key: keyof FormData, val: string | string[] | number | null) =>
    setForm(f => ({ ...f, [key]: val }))

  const toggleService = (svc: string) => {
    const curr = form.services
    set('services', curr.includes(svc) ? curr.filter(s => s !== svc) : [...curr, svc])
  }

  const validate = (s: number) => {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!form.first_name.trim()) e.first_name = 'Required'
      if (!form.last_name.trim()) e.last_name = 'Required'
      if (!form.biz_name.trim()) e.biz_name = 'Required'
      if (!form.phone.trim()) e.phone = 'Required'
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    }
    if (s === 1) {
      if (!form.industry) e.industry = 'Required'
      if (!form.biz_desc.trim()) e.biz_desc = 'Required'
    }
    if (s === 3) {
      if (!form.primary_goal) e.primary_goal = 'Select a goal'
      if (!form.budget) e.budget = 'Select a budget'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate(step)) { setStep(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) } }
  const back = () => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const submit = async () => {
    if (!validate(step)) return
    setSubmitting(true)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/client_intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ ...form, status: 'new' }),
      })
    } catch (e) { console.error('Supabase:', e) }
    try {
      const svcs = form.services.length ? form.services.join(', ') : 'None selected'
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Yakini Intake <hello@yakini.digital>',
          to: [NOTIFY_EMAIL],
          subject: `New Intake: ${form.biz_name} — ${form.first_name} ${form.last_name}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;background:#0A0A0A;color:#F8F5EF;padding:32px;border-radius:8px;"><h1 style="color:#C8A84B;font-size:22px;border-bottom:2px solid #C8A84B;padding-bottom:12px;margin-bottom:20px;">New Client Intake — Yakini</h1><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:7px 0;color:#999;font-size:13px;width:130px;">Name</td><td style="padding:7px 0;font-size:14px;">${form.first_name} ${form.last_name}</td></tr><tr><td style="padding:7px 0;color:#999;font-size:13px;">Business</td><td style="padding:7px 0;font-size:14px;color:#C8A84B;font-weight:bold;">${form.biz_name}</td></tr><tr><td style="padding:7px 0;color:#999;font-size:13px;">Phone</td><td style="padding:7px 0;font-size:14px;">${form.phone}</td></tr><tr><td style="padding:7px 0;color:#999;font-size:13px;">Email</td><td style="padding:7px 0;font-size:14px;">${form.email}</td></tr><tr><td style="padding:7px 0;color:#999;font-size:13px;">Location</td><td style="padding:7px 0;font-size:14px;">${form.location||'—'}</td></tr><tr><td style="padding:7px 0;color:#999;font-size:13px;">Industry</td><td style="padding:7px 0;font-size:14px;">${form.industry}</td></tr><tr><td style="padding:7px 0;color:#999;font-size:13px;">Budget</td><td style="padding:7px 0;font-size:14px;">${form.budget}</td></tr><tr><td style="padding:7px 0;color:#999;font-size:13px;">Timeline</td><td style="padding:7px 0;font-size:14px;">${form.timeline||'—'}</td></tr><tr><td style="padding:7px 0;color:#999;font-size:13px;">Goal</td><td style="padding:7px 0;font-size:14px;">${form.primary_goal}</td></tr></table><div style="background:#161616;border:1px solid #2A2A2A;border-radius:6px;padding:14px;margin:16px 0;"><p style="color:#C8A84B;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px;">Services</p><p style="font-size:14px;margin:0;">${svcs}</p></div><div style="background:#161616;border:1px solid #2A2A2A;border-radius:6px;padding:14px;margin:16px 0;"><p style="color:#C8A84B;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px;">Description</p><p style="font-size:14px;color:#999;margin:0;">${form.biz_desc}</p></div>${form.anything_else?`<div style="background:#161616;border:1px solid #2A2A2A;border-radius:6px;padding:14px;"><p style="color:#C8A84B;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px;">Notes</p><p style="font-size:14px;color:#999;margin:0;">${form.anything_else}</p></div>`:''}<p style="color:#444;font-size:12px;text-align:center;margin-top:24px;">Yakini Digital Infrastructure · yakini.digital</p></div>`,
        }),
      })
    } catch (e) { console.error('Resend:', e) }
    setSubmitting(false)
    setDone(true)
  }

  if (!mounted) return null

  if (done) return (
    <>
      <style>{globalStyles}</style>
      <div className="yi-page">
        <div className="yi-wrap">
          <div className="yi-done">
            <div className="yi-check">✓</div>
            <h2 className="yi-done-title">You&apos;re in the system.</h2>
            <p className="yi-done-sub">We&apos;ve received your intake and we&apos;re reviewing it now. Expect a call or message from Yakini within <strong style={{ color: '#C8A84B' }}>24–48 hours</strong>.</p>
            <div className="yi-next-steps">
              <div className="yi-section-label">What Happens Next</div>
              {['Yakini reviews your intake in full', 'We prepare a project scope and recommendation', 'First call — we walk you through the plan', 'You approve. We build. You grow.'].map((s, i) => (
                <div key={i} className="yi-next-item"><span className="yi-arrow">→</span>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{globalStyles}</style>
      <div className="yi-page">
        <div className="yi-wrap yi-fadein">

          {/* Header */}
          <div className="yi-header">
            <div className="yi-logo">
              <div className="yi-logo-name">Yakini</div>
              <div className="yi-logo-sub">Digital Infrastructure</div>
            </div>
            <div className="yi-badge">New Client Intake</div>
          </div>

          {/* Intro — step 0 only */}
          {step === 0 && (
            <div className="yi-intro">
              <div className="yi-section-label">Yakini — Client Onboarding</div>
              <h1 className="yi-hero">
                Let&apos;s build something<br />
                <em className="yi-hero-em">that works.</em>
              </h1>
              <p className="yi-hero-sub">Before we scope your project, we need to understand your business, your goals, and what success looks like. This takes about 5–8 minutes.</p>
            </div>
          )}

          {/* Progress bar */}
          <div className="yi-progress">
            {STEP_NAMES.map((_, i) => (
              <div key={i} className={`yi-seg ${i === step ? 'yi-seg-active' : i < step ? 'yi-seg-done' : ''}`} />
            ))}
          </div>
          <div className="yi-progress-label">
            Step <strong style={{ color: '#C8A84B' }}>{step + 1}</strong> of {STEP_NAMES.length} — {STEP_NAMES[step]}
          </div>

          {/* ── STEP 0 ── */}
          {step === 0 && (
            <div className="yi-step">
              <div className="yi-step-title">About You</div>
              <div className="yi-step-desc">Tell us who you are and how to reach you.</div>
              <div className="yi-row">
                <Field label="First Name" req value={form.first_name} onChange={v => set('first_name', v)} placeholder="First name" error={errors.first_name} />
                <Field label="Last Name" req value={form.last_name} onChange={v => set('last_name', v)} placeholder="Last name" error={errors.last_name} />
              </div>
              <Field label="Business Name" req value={form.biz_name} onChange={v => set('biz_name', v)} placeholder="Your business or brand name" error={errors.biz_name} />
              <div className="yi-row">
                <Field label="Phone Number" req type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="(713) 000-0000" error={errors.phone} />
                <Field label="Email Address" req type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@yourbusiness.com" error={errors.email} />
              </div>
              <Field label="City & State" value={form.location} onChange={v => set('location', v)} placeholder="Houston, TX" />
              <Select label="How did you hear about Yakini?" value={form.referral} onChange={v => set('referral', v)}
                options={['Referred by someone I know', 'Social media', 'Google search', 'Word of mouth', 'Other']} />
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="yi-step">
              <div className="yi-step-title">Your Business</div>
              <div className="yi-step-desc">Help us understand what you do and who you serve.</div>
              <Select label="What industry are you in?" req value={form.industry} onChange={v => set('industry', v)} error={errors.industry}
                options={['Legal Services / Advocacy', 'Towing / Roadside Services', 'Real Estate', 'Food & Beverage', 'Energy / Oilfield Services', 'Health & Wellness', 'Nonprofit / Community Organization', 'Retail / E-Commerce', 'Construction / Trades', 'Professional Services', 'Other']} />
              <Textarea label="Describe your business in your own words" req value={form.biz_desc} onChange={v => set('biz_desc', v)} placeholder="What do you do? Who do you help? What problem do you solve?" error={errors.biz_desc} />
              <Textarea label="Who is your ideal customer?" value={form.ideal_customer} onChange={v => set('ideal_customer', v)} placeholder="Age, location, situation — any details help." height={90} />
              <Select label="How long have you been in business?" value={form.years_in_biz} onChange={v => set('years_in_biz', v)}
                options={['Just starting out (less than 6 months)', '6 months – 1 year', '1–3 years', '3–5 years', '5+ years']} />
              <div className="yi-field">
                <label className="yi-label">Do you currently have a website?</label>
                <RadioGroup value={form.has_website} onChange={v => set('has_website', v)} options={[
                  { val: 'yes', title: 'Yes', desc: 'I have an existing site I want to replace or improve' },
                  { val: 'no', title: 'No', desc: 'Starting fresh — I need a brand new site' },
                ]} />
              </div>
              {form.has_website === 'yes' && (
                <Field label="Current Website URL" type="url" value={form.existing_url} onChange={v => set('existing_url', v)} placeholder="https://yourbusiness.com" />
              )}
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="yi-step">
              <div className="yi-step-title">What Do You Need?</div>
              <div className="yi-step-desc">Select everything that applies. We&apos;ll scope accordingly.</div>
              {SERVICE_GROUPS.map(group => (
                <div key={group.label} style={{ marginBottom: 28 }}>
                  <div className="yi-section-label" style={{ marginBottom: 14 }}>{group.label}</div>
                  <div className="yi-check-grid">
                    {group.items.map(svc => (
                      <div key={svc} className={`yi-check-item ${form.services.includes(svc) ? 'yi-check-selected' : ''}`} onClick={() => toggleService(svc)}>
                        <input type="checkbox" checked={form.services.includes(svc)} onChange={() => toggleService(svc)} className="yi-checkbox" />
                        <span className="yi-check-label">{svc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Textarea label="Anything else not listed?" value={form.other_services} onChange={v => set('other_services', v)} placeholder="Describe any other needs..." height={80} />
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="yi-step">
              <div className="yi-step-title">Goals & Investment</div>
              <div className="yi-step-desc">What does success look like and what are you working with?</div>
              <div className="yi-field">
                <label className="yi-label">Your #1 goal <span className="yi-req">*</span></label>
                <RadioGroup value={form.primary_goal} onChange={v => set('primary_goal', v)} options={[
                  { val: 'leads', title: 'Generate more leads & clients', desc: 'I need people to find me and contact me' },
                  { val: 'credibility', title: 'Build credibility & look professional', desc: 'I need a presence that earns trust instantly' },
                  { val: 'automate', title: 'Automate my operations', desc: 'I need systems that save me time' },
                  { val: 'launch', title: 'Launch something new', desc: 'Starting from zero — need everything built' },
                  { val: 'all', title: 'All of the above', desc: "I need the full picture — let's build it right" },
                ]} error={errors.primary_goal} />
              </div>
              <div className="yi-divider" />
              <Textarea label="What does success look like 90 days after launch?" value={form.success_vision} onChange={v => set('success_vision', v)} placeholder="More calls? Revenue target? Google rankings? Be specific." />
              <div className="yi-field">
                <label className="yi-label">Monthly budget <span className="yi-req">*</span></label>
                <RadioGroup value={form.budget} onChange={v => set('budget', v)} options={[
                  { val: 'under500', title: 'Under $500/month', desc: 'Getting started, testing the waters' },
                  { val: '500-1000', title: '$500 – $1,000/month', desc: 'Serious about growth, investing in the foundation' },
                  { val: '1000-2500', title: '$1,000 – $2,500/month', desc: 'Full-service digital presence and marketing' },
                  { val: '2500plus', title: '$2,500+/month', desc: 'Enterprise-level build with ongoing management' },
                  { val: 'discuss', title: "Let's discuss", desc: 'I want to understand options before committing' },
                ]} error={errors.budget} />
              </div>
              <Select label="How soon do you need to launch?" value={form.timeline} onChange={v => set('timeline', v)}
                options={['ASAP — I needed this yesterday', 'Within 2 weeks', 'Within 30 days', '1–2 months', 'No hard deadline — I want it done right']} />
            </div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <div className="yi-step">
              <div className="yi-step-title">Final Details</div>
              <div className="yi-step-desc">Last section. Anything that helps us hit the ground running.</div>
              <div className="yi-field">
                <label className="yi-label">Do you have existing branding?</label>
                <RadioGroup value={form.has_branding} onChange={v => set('has_branding', v)} options={[
                  { val: 'yes_full', title: 'Yes — full brand kit', desc: 'Logo, colors, and fonts ready to go' },
                  { val: 'yes_partial', title: 'Partial — I have some pieces', desc: 'Logo maybe, but colors/fonts need work' },
                  { val: 'no', title: 'No — starting from scratch', desc: 'Branding needed as part of this project' },
                ]} />
              </div>
              <Textarea label="Competitors or brands you admire?" value={form.competitors} onChange={v => set('competitors', v)} placeholder="Names, websites, or describe what they do well." height={80} />
              <Field label="What should people feel when they land on your site?" value={form.brand_feeling} onChange={v => set('brand_feeling', v)} placeholder="Trust, power, urgency, warmth, expertise..." />
              <div className="yi-field">
                <label className="yi-label">Rate your current digital presence</label>
                <div className="yi-scale">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} type="button" onClick={() => set('digital_score', n)}
                      className={`yi-scale-btn ${form.digital_score === n ? 'yi-scale-active' : ''}`}>{n}</button>
                  ))}
                </div>
                <div className="yi-scale-labels"><span>1 — Nonexistent</span><span>10 — Fully dialed in</span></div>
              </div>
              <Textarea label="Anything else we should know?" value={form.anything_else} onChange={v => set('anything_else', v)} placeholder="Past bad experiences, concerns, big opportunities — anything goes." height={100} />
              <Select label="Best way to reach you?" value={form.contact_pref} onChange={v => set('contact_pref', v)}
                options={['Phone call', 'Text message', 'Email', 'Video call (Zoom / Google Meet)', 'Any — I\'m flexible']} />
            </div>
          )}

          {/* Nav */}
          <div className="yi-nav">
            {step > 0 ? <button type="button" className="yi-btn-back" onClick={back}>← Back</button> : <div />}
            {step < 4
              ? <button type="button" className="yi-btn-next" onClick={next}>Continue →</button>
              : <button type="button" className="yi-btn-next" onClick={submit} disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Intake →'}
                </button>
            }
          </div>

        </div>
      </div>
    </>
  )
}

// ── Sub-components ──────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text', error, req }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; type?: string; error?: string; req?: boolean
}) {
  return (
    <div className="yi-field">
      <label className="yi-label">{label} {req && <span className="yi-req">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`yi-input ${error ? 'yi-input-error' : ''}`} />
      {error && <div className="yi-error">{error}</div>}
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, error, req, height = 110 }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; error?: string; req?: boolean; height?: number
}) {
  return (
    <div className="yi-field">
      <label className="yi-label">{label} {req && <span className="yi-req">*</span>}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`yi-input ${error ? 'yi-input-error' : ''}`} style={{ height, resize: 'vertical', lineHeight: 1.6 }} />
      {error && <div className="yi-error">{error}</div>}
    </div>
  )
}

function Select({ label, value, onChange, options, error, req }: {
  label: string; value: string; onChange: (v: string) => void
  options: string[]; error?: string; req?: boolean
}) {
  return (
    <div className="yi-field">
      <label className="yi-label">{label} {req && <span className="yi-req">*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={`yi-input yi-select ${error ? 'yi-input-error' : ''}`}>
        <option value="">Select one</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <div className="yi-error">{error}</div>}
    </div>
  )
}

function RadioGroup({ value, onChange, options, error }: {
  value: string; onChange: (v: string) => void
  options: { val: string; title: string; desc: string }[]; error?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map(o => (
        <div key={o.val} onClick={() => onChange(o.val)} className={`yi-radio ${value === o.val ? 'yi-radio-selected' : ''}`}>
          <input type="radio" checked={value === o.val} onChange={() => onChange(o.val)} className="yi-radio-input" />
          <div>
            <div className="yi-radio-title">{o.title}</div>
            <div className="yi-radio-desc">{o.desc}</div>
          </div>
        </div>
      ))}
      {error && <div className="yi-error" style={{ marginTop: 4 }}>{error}</div>}
    </div>
  )
}

// ── Global styles ────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  .yi-page {
    background: #0A0A0A;
    color: #F8F5EF;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  .yi-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 10%, rgba(200,168,75,0.06) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(200,168,75,0.04) 0%, transparent 45%);
    pointer-events: none;
    z-index: 0;
  }

  .yi-wrap {
    position: relative;
    z-index: 1;
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 24px 80px;
  }

  @keyframes yi-fadein {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .yi-fadein { animation: yi-fadein 0.5s ease forwards; }

  .yi-step {
    animation: yi-fadein 0.35s ease forwards;
  }

  /* Header */
  .yi-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 56px;
  }

  .yi-logo-name {
    font-weight: 600;
    font-size: 18px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #F8F5EF;
  }

  .yi-logo-sub {
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #C8A84B;
    margin-top: 3px;
  }

  .yi-badge {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #555;
    border: 1px solid #2A2A2A;
    padding: 6px 14px;
    border-radius: 2px;
  }

  /* Intro */
  .yi-intro { margin-bottom: 52px; }

  .yi-hero {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 6vw, 52px);
    font-weight: 600;
    line-height: 1.1;
    color: #F8F5EF;
    margin-bottom: 20px;
    margin-top: 0;
  }

  .yi-hero-em {
    font-style: italic;
    color: #C8A84B;
  }

  .yi-hero-sub {
    font-size: 15px;
    line-height: 1.7;
    color: #888;
    max-width: 560px;
    margin: 0;
  }

  /* Progress */
  .yi-progress {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }

  .yi-seg {
    height: 2px;
    flex: 1;
    border-radius: 2px;
    background: #2A2A2A;
    transition: background 0.4s ease;
  }

  .yi-seg-active { background: #C8A84B; }
  .yi-seg-done { background: rgba(200,168,75,0.4); }

  .yi-progress-label {
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 36px;
  }

  /* Step */
  .yi-step-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 30px;
    font-weight: 600;
    color: #F8F5EF;
    margin-bottom: 6px;
  }

  .yi-step-desc {
    font-size: 14px;
    color: #555;
    margin-bottom: 36px;
    line-height: 1.6;
  }

  /* Section label */
  .yi-section-label {
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #C8A84B;
    margin-bottom: 20px;
    font-weight: 500;
  }

  /* Fields */
  .yi-field { margin-bottom: 28px; }

  .yi-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 520px) {
    .yi-row { grid-template-columns: 1fr; }
    .yi-check-grid { grid-template-columns: 1fr !important; }
  }

  .yi-label {
    display: block;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 10px;
    font-weight: 500;
  }

  .yi-req { color: #C8A84B; margin-left: 3px; }

  .yi-input {
    width: 100%;
    background: #161616;
    border: 1px solid #2A2A2A;
    color: #F8F5EF;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    padding: 14px 16px;
    border-radius: 3px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  .yi-input:focus {
    border-color: #C8A84B;
    box-shadow: 0 0 0 3px rgba(200,168,75,0.12);
  }

  .yi-input::placeholder { color: #444; }
  .yi-input-error { border-color: #E05555 !important; }
  .yi-error { font-size: 12px; color: #E05555; margin-top: 6px; }

  .yi-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
    cursor: pointer;
  }

  .yi-select option { background: #111; }

  /* Radio */
  .yi-radio {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: #161616;
    border: 1px solid #2A2A2A;
    padding: 16px 18px;
    border-radius: 3px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    user-select: none;
  }

  .yi-radio:hover { border-color: #C8A84B; }

  .yi-radio-selected {
    border-color: #C8A84B;
    background: rgba(200,168,75,0.1);
  }

  .yi-radio-input {
    width: 16px; height: 16px;
    flex-shrink: 0;
    margin-top: 2px;
    accent-color: #C8A84B;
    cursor: pointer;
  }

  .yi-radio-title { font-size: 14px; font-weight: 500; color: #F8F5EF; margin-bottom: 2px; }
  .yi-radio-desc { font-size: 12px; color: #888; line-height: 1.5; }

  /* Checkboxes */
  .yi-check-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .yi-check-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #161616;
    border: 1px solid #2A2A2A;
    padding: 13px 14px;
    border-radius: 3px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    user-select: none;
  }

  .yi-check-item:hover { border-color: #C8A84B; }

  .yi-check-selected {
    border-color: #C8A84B;
    background: rgba(200,168,75,0.1);
  }

  .yi-checkbox { width: 16px; height: 16px; accent-color: #C8A84B; flex-shrink: 0; cursor: pointer; }
  .yi-check-label { font-size: 13px; color: #F8F5EF; line-height: 1.4; }

  /* Scale */
  .yi-scale { display: flex; gap: 8px; flex-wrap: wrap; }

  .yi-scale-btn {
    width: 44px; height: 44px;
    background: #161616;
    border: 1px solid #2A2A2A;
    border-radius: 3px;
    color: #666;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .yi-scale-btn:hover { border-color: #C8A84B; color: #F8F5EF; }

  .yi-scale-active {
    background: #C8A84B !important;
    border-color: #C8A84B !important;
    color: #0A0A0A !important;
    font-weight: 600 !important;
  }

  .yi-scale-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 11px;
    color: #555;
    letter-spacing: 0.05em;
  }

  /* Divider */
  .yi-divider { height: 1px; background: #2A2A2A; margin: 32px 0; }

  /* Nav */
  .yi-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 48px;
    gap: 16px;
  }

  .yi-btn-back {
    background: transparent;
    border: 1px solid #2A2A2A;
    color: #666;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 14px 28px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .yi-btn-back:hover { border-color: #888; color: #F8F5EF; }

  .yi-btn-next {
    background: #C8A84B;
    border: none;
    color: #0A0A0A;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 14px 36px;
    border-radius: 2px;
    cursor: pointer;
    margin-left: auto;
    transition: all 0.2s;
  }

  .yi-btn-next:hover { background: #E2C97A; transform: translateY(-1px); }
  .yi-btn-next:active { transform: translateY(0); }
  .yi-btn-next:disabled { cursor: not-allowed; }

  /* Done screen */
  .yi-done { text-align: center; padding: 60px 0; }

  .yi-check {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: rgba(200,168,75,0.12);
    border: 2px solid #C8A84B;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 32px;
    font-size: 28px;
    color: #C8A84B;
    animation: yi-fadein 0.5s ease forwards;
  }

  .yi-done-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(32px, 5vw, 44px);
    font-weight: 600;
    margin-bottom: 16px;
    color: #F8F5EF;
  }

  .yi-done-sub {
    font-size: 15px;
    color: #888;
    line-height: 1.7;
    max-width: 480px;
    margin: 0 auto 12px;
  }

  .yi-next-steps {
    background: #161616;
    border: 1px solid #2A2A2A;
    border-radius: 4px;
    padding: 28px;
    max-width: 480px;
    margin: 40px auto 0;
    text-align: left;
  }

  .yi-next-item {
    font-size: 14px;
    color: #888;
    margin-bottom: 12px;
    padding-left: 22px;
    position: relative;
    line-height: 1.6;
  }

  .yi-arrow {
    position: absolute;
    left: 0;
    color: #C8A84B;
    font-size: 12px;
  }
`
