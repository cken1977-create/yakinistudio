'use client'

import { useState } from 'react'

const SUPABASE_URL = 'https://mxshsmknfqxwltucgezl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c2hzbWtuZnF4d2x0dWNnZXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDM1NjIsImV4cCI6MjA5MzA3OTU2Mn0.cdx3T5CVFKq2sis-FOHau2V0Lx3CrsyoZmaAfM689v0'
const RESEND_API_KEY = 're_DdtMrt3n_F6B4vJQiepzrYpHwK6gkB93N'
const NOTIFY_EMAIL = 'hello@yakini.digital'

type FormData = {
  first_name: string
  last_name: string
  biz_name: string
  phone: string
  email: string
  location: string
  referral: string
  industry: string
  biz_desc: string
  ideal_customer: string
  years_in_biz: string
  has_website: string
  existing_url: string
  services: string[]
  other_services: string
  primary_goal: string
  success_vision: string
  budget: string
  timeline: string
  has_branding: string
  competitors: string
  brand_feeling: string
  digital_score: number | null
  anything_else: string
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

const SERVICES = [
  ['New Website', 'Website Redesign', 'Client Portal / Dashboard', 'Online Booking / Scheduling', 'Contact Forms / Lead Capture', 'E-Commerce / Online Payments'],
  ['Social Media Content', 'Google Business Profile', 'Email Marketing', 'Paid Ads (Google / Meta)', 'SEO / Local Search', 'Brand Identity / Logo'],
  ['AI Chat / Lead Qualification', 'Automated Follow-Up / CRM', 'Document Automation', 'Reporting / Analytics'],
]

const SERVICE_LABELS = ['Digital Services', 'Marketing', 'AI & Automation']

export default function IntakePage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

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
      if (!form.primary_goal) e.primary_goal = 'Required'
      if (!form.budget) e.budget = 'Required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate(step)) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const submit = async () => {
    if (!validate(step)) return
    setSubmitting(true)
    const data = { ...form, status: 'new' }

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/client_intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(data),
      })
    } catch (e) { console.error('Supabase error:', e) }

    try {
      const services = form.services.length ? form.services.join(', ') : 'None selected'
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Yakini Intake <hello@yakini.digital>',
          to: [NOTIFY_EMAIL],
          subject: `New Intake: ${form.biz_name} — ${form.first_name} ${form.last_name}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;background:#0A0A0A;color:#F8F5EF;padding:32px;border-radius:8px;">
              <h1 style="color:#C8A84B;font-size:22px;border-bottom:2px solid #C8A84B;padding-bottom:12px;margin-bottom:20px;">New Client Intake — Yakini</h1>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:7px 0;color:#999;font-size:13px;width:130px;">Name</td><td style="padding:7px 0;font-size:14px;">${form.first_name} ${form.last_name}</td></tr>
                <tr><td style="padding:7px 0;color:#999;font-size:13px;">Business</td><td style="padding:7px 0;font-size:14px;color:#C8A84B;font-weight:bold;">${form.biz_name}</td></tr>
                <tr><td style="padding:7px 0;color:#999;font-size:13px;">Phone</td><td style="padding:7px 0;font-size:14px;">${form.phone}</td></tr>
                <tr><td style="padding:7px 0;color:#999;font-size:13px;">Email</td><td style="padding:7px 0;font-size:14px;">${form.email}</td></tr>
                <tr><td style="padding:7px 0;color:#999;font-size:13px;">Location</td><td style="padding:7px 0;font-size:14px;">${form.location || '—'}</td></tr>
                <tr><td style="padding:7px 0;color:#999;font-size:13px;">Industry</td><td style="padding:7px 0;font-size:14px;">${form.industry}</td></tr>
                <tr><td style="padding:7px 0;color:#999;font-size:13px;">Budget</td><td style="padding:7px 0;font-size:14px;">${form.budget}</td></tr>
                <tr><td style="padding:7px 0;color:#999;font-size:13px;">Timeline</td><td style="padding:7px 0;font-size:14px;">${form.timeline || '—'}</td></tr>
                <tr><td style="padding:7px 0;color:#999;font-size:13px;">Goal</td><td style="padding:7px 0;font-size:14px;">${form.primary_goal}</td></tr>
                <tr><td style="padding:7px 0;color:#999;font-size:13px;">Contact Pref</td><td style="padding:7px 0;font-size:14px;">${form.contact_pref || '—'}</td></tr>
              </table>
              <div style="background:#161616;border:1px solid #2A2A2A;border-radius:6px;padding:14px;margin:16px 0;">
                <p style="color:#C8A84B;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px;">Services</p>
                <p style="font-size:14px;margin:0;">${services}</p>
              </div>
              <div style="background:#161616;border:1px solid #2A2A2A;border-radius:6px;padding:14px;margin:16px 0;">
                <p style="color:#C8A84B;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px;">Description</p>
                <p style="font-size:14px;color:#999;margin:0;">${form.biz_desc}</p>
              </div>
              ${form.anything_else ? `<div style="background:#161616;border:1px solid #2A2A2A;border-radius:6px;padding:14px;"><p style="color:#C8A84B;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px;">Notes</p><p style="font-size:14px;color:#999;margin:0;">${form.anything_else}</p></div>` : ''}
              <p style="color:#444;font-size:12px;text-align:center;margin-top:24px;">Yakini Digital Infrastructure · yakini.digital</p>
            </div>`,
        }),
      })
    } catch (e) { console.error('Resend error:', e) }

    setSubmitting(false)
    setDone(true)
  }

  const field = (key: keyof FormData, label: string, placeholder: string, type = 'text') => (
    <div style={{ marginBottom: 24 }}>
      <label style={styles.label}>{label} {['first_name','last_name','biz_name','phone','email','industry','biz_desc','primary_goal','budget'].includes(key) && <span style={{ color: '#C8A84B' }}>*</span>}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        style={{ ...styles.input, ...(errors[key] ? styles.inputError : {}) }}
      />
      {errors[key] && <div style={styles.error}>{errors[key]}</div>}
    </div>
  )

  const textarea = (key: keyof FormData, label: string, placeholder: string, height = 110) => (
    <div style={{ marginBottom: 24 }}>
      <label style={styles.label}>{label} {['biz_desc'].includes(key) && <span style={{ color: '#C8A84B' }}>*</span>}</label>
      <textarea
        value={form[key] as string}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        style={{ ...styles.input, height, resize: 'vertical' as const, lineHeight: 1.6 }}
      />
      {errors[key] && <div style={styles.error}>{errors[key]}</div>}
    </div>
  )

  const select = (key: keyof FormData, label: string, options: string[], req = false) => (
    <div style={{ marginBottom: 24 }}>
      <label style={styles.label}>{label} {req && <span style={{ color: '#C8A84B' }}>*</span>}</label>
      <select
        value={form[key] as string}
        onChange={e => set(key, e.target.value)}
        style={{ ...styles.input, ...(errors[key] ? styles.inputError : {}), cursor: 'pointer' }}
      >
        <option value=''>Select one</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors[key] && <div style={styles.error}>{errors[key]}</div>}
    </div>
  )

  const radioGroup = (key: keyof FormData, options: { val: string; title: string; desc: string }[]) => (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
      {options.map(o => (
        <div
          key={o.val}
          onClick={() => set(key, o.val)}
          style={{
            ...styles.radioItem,
            ...(form[key] === o.val ? styles.radioSelected : {}),
            cursor: 'pointer',
          }}
        >
          <input type='radio' checked={form[key] === o.val} onChange={() => set(key, o.val)} style={{ accentColor: '#C8A84B', marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#F8F5EF', marginBottom: 2 }}>{o.title}</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{o.desc}</div>
          </div>
        </div>
      ))}
      {errors[key] && <div style={styles.error}>{errors[key]}</div>}
    </div>
  )

  if (done) return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(200,168,75,0.12)', border: '2px solid #C8A84B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', fontSize: 28 }}>✓</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 42, fontWeight: 600, marginBottom: 16 }}>You&apos;re in the system.</h2>
          <p style={{ fontSize: 15, color: '#888', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 12px' }}>We&apos;ve received your intake and we&apos;re reviewing it now. Expect a call or message from Yakini within <strong style={{ color: '#C8A84B' }}>24–48 hours</strong>.</p>
          <div style={{ background: '#161616', border: '1px solid #2A2A2A', borderRadius: 4, padding: 28, maxWidth: 480, margin: '40px auto 0', textAlign: 'left' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#C8A84B', marginBottom: 16 }}>What Happens Next</div>
            {['Yakini reviews your intake in full', 'We prepare a project scope and recommendation', 'First call — we walk you through the plan', 'You approve. We build. You grow.'].map((s, i) => (
              <div key={i} style={{ fontSize: 14, color: '#888', marginBottom: 10, paddingLeft: 20, position: 'relative' as const }}>
                <span style={{ position: 'absolute' as const, left: 0, color: '#C8A84B' }}>→</span>{s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const steps = ['About You', 'Your Business', 'Services', 'Goals', 'Final Details']

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 56 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 18, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Yakini</div>
            <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#C8A84B', marginTop: 2 }}>Digital Infrastructure</div>
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#666', border: '1px solid #2A2A2A', padding: '6px 14px', borderRadius: 2 }}>New Client Intake</div>
        </div>

        {/* Intro */}
        {step === 0 && (
          <div style={{ marginBottom: 52 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#C8A84B', marginBottom: 16 }}>Yakini — Client Onboarding</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 600, lineHeight: 1.1, marginBottom: 20 }}>
              Let&apos;s build something <em style={{ fontStyle: 'italic', color: '#C8A84B' }}>that works.</em>
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#888', maxWidth: 560 }}>Before we scope your project, we need to understand your business, your goals, and what success looks like. This takes about 5–8 minutes.</p>
          </div>
        )}

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ height: 2, flex: 1, borderRadius: 2, background: i === step ? '#C8A84B' : i < step ? 'rgba(200,168,75,0.4)' : '#2A2A2A', transition: 'background 0.4s' }} />
          ))}
        </div>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#555', marginBottom: 32 }}>
          Step <strong style={{ color: '#C8A84B' }}>{step + 1}</strong> of {steps.length} — {steps[step]}
        </div>

        {/* ── STEP 0: About You ── */}
        {step === 0 && (
          <div>
            <div style={styles.stepTitle}>About You</div>
            <div style={styles.stepDesc}>Tell us who you are and how to reach you.</div>
            <div style={styles.row}>
              {field('first_name', 'First Name', 'First name')}
              {field('last_name', 'Last Name', 'Last name')}
            </div>
            {field('biz_name', 'Business Name', 'Your business or brand name')}
            <div style={styles.row}>
              {field('phone', 'Phone Number', '(713) 000-0000', 'tel')}
              {field('email', 'Email Address', 'you@yourbusiness.com', 'email')}
            </div>
            {field('location', 'City & State', 'Houston, TX')}
            {select('referral', 'How did you hear about Yakini?', ['Referred by someone I know', 'Social media', 'Google search', 'Word of mouth', 'Other'])}
          </div>
        )}

        {/* ── STEP 1: Your Business ── */}
        {step === 1 && (
          <div>
            <div style={styles.stepTitle}>Your Business</div>
            <div style={styles.stepDesc}>Help us understand what you do and who you serve.</div>
            {select('industry', 'What industry are you in?', ['Legal Services / Advocacy', 'Towing / Roadside Services', 'Real Estate', 'Food & Beverage', 'Energy / Oilfield Services', 'Health & Wellness', 'Nonprofit / Community Organization', 'Retail / E-Commerce', 'Construction / Trades', 'Professional Services', 'Other'], true)}
            {textarea('biz_desc', 'Describe your business in your own words', 'What do you do? Who do you help? What problem do you solve?')}
            {textarea('ideal_customer', 'Who is your ideal customer?', 'Age, location, situation — any details help.', 90)}
            {select('years_in_biz', 'How long have you been in business?', ['Just starting out (less than 6 months)', '6 months – 1 year', '1–3 years', '3–5 years', '5+ years'])}
            <div style={{ marginBottom: 24 }}>
              <label style={styles.label}>Do you currently have a website?</label>
              {radioGroup('has_website', [
                { val: 'yes', title: 'Yes', desc: 'I have an existing site I want to replace or improve' },
                { val: 'no', title: 'No', desc: 'Starting fresh — I need a brand new site' },
              ])}
            </div>
            {form.has_website === 'yes' && field('existing_url', 'Current Website URL', 'https://yourbusiness.com', 'url')}
          </div>
        )}

        {/* ── STEP 2: Services ── */}
        {step === 2 && (
          <div>
            <div style={styles.stepTitle}>What Do You Need?</div>
            <div style={styles.stepDesc}>Select everything that applies.</div>
            {SERVICES.map((group, gi) => (
              <div key={gi} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#C8A84B', marginBottom: 14, fontWeight: 500 }}>{SERVICE_LABELS[gi]}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {group.map(svc => (
                    <div
                      key={svc}
                      onClick={() => toggleService(svc)}
                      style={{
                        ...styles.checkItem,
                        ...(form.services.includes(svc) ? styles.checkSelected : {}),
                        cursor: 'pointer',
                      }}
                    >
                      <input type='checkbox' checked={form.services.includes(svc)} onChange={() => toggleService(svc)} style={{ accentColor: '#C8A84B', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#F8F5EF' }}>{svc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {textarea('other_services', 'Anything else not listed?', 'Describe any other needs...', 80)}
          </div>
        )}

        {/* ── STEP 3: Goals ── */}
        {step === 3 && (
          <div>
            <div style={styles.stepTitle}>Goals & Investment</div>
            <div style={styles.stepDesc}>What does success look like and what are you working with?</div>
            <div style={{ marginBottom: 24 }}>
              <label style={styles.label}>Your #1 goal <span style={{ color: '#C8A84B' }}>*</span></label>
              {radioGroup('primary_goal', [
                { val: 'leads', title: 'Generate more leads & clients', desc: 'I need people to find me and contact me' },
                { val: 'credibility', title: 'Build credibility & look professional', desc: 'I need a presence that earns trust instantly' },
                { val: 'automate', title: 'Automate my operations', desc: 'I need systems that save me time' },
                { val: 'launch', title: 'Launch something new', desc: 'Starting from zero — need everything built' },
                { val: 'all', title: 'All of the above', desc: 'I need the full picture — let\'s build it right' },
              ])}
            </div>
            <div style={{ height: 1, background: '#2A2A2A', margin: '28px 0' }} />
            {textarea('success_vision', 'What does success look like 90 days after launch?', 'More calls? Revenue target? Google rankings? Be specific.')}
            <div style={{ marginBottom: 24 }}>
              <label style={styles.label}>Monthly budget <span style={{ color: '#C8A84B' }}>*</span></label>
              {radioGroup('budget', [
                { val: 'under500', title: 'Under $500/month', desc: 'Getting started, testing the waters' },
                { val: '500-1000', title: '$500 – $1,000/month', desc: 'Serious about growth' },
                { val: '1000-2500', title: '$1,000 – $2,500/month', desc: 'Full-service digital presence' },
                { val: '2500plus', title: '$2,500+/month', desc: 'Enterprise-level build' },
                { val: 'discuss', title: "Let's discuss", desc: 'I want to understand options first' },
              ])}
            </div>
            {select('timeline', 'How soon do you need to launch?', ['ASAP — I needed this yesterday', 'Within 2 weeks', 'Within 30 days', '1–2 months', 'No hard deadline — I want it done right'])}
          </div>
        )}

        {/* ── STEP 4: Final Details ── */}
        {step === 4 && (
          <div>
            <div style={styles.stepTitle}>Final Details</div>
            <div style={styles.stepDesc}>Last section. Anything that helps us hit the ground running.</div>
            <div style={{ marginBottom: 24 }}>
              <label style={styles.label}>Do you have existing branding?</label>
              {radioGroup('has_branding', [
                { val: 'yes_full', title: 'Yes — full brand kit', desc: 'Logo, colors, and fonts ready to go' },
                { val: 'yes_partial', title: 'Partial — I have some pieces', desc: 'Logo maybe, but needs work' },
                { val: 'no', title: 'No — starting from scratch', desc: 'Branding needed as part of this project' },
              ])}
            </div>
            {textarea('competitors', 'Competitors or brands you admire?', 'Names, websites, or describe what they do well.', 80)}
            {field('brand_feeling', 'What should people feel when they land on your site?', 'Trust, power, urgency, warmth, expertise...')}
            <div style={{ marginBottom: 24 }}>
              <label style={styles.label}>Rate your current digital presence</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    type='button'
                    onClick={() => set('digital_score', n)}
                    style={{
                      width: 44, height: 44,
                      background: form.digital_score === n ? '#C8A84B' : '#161616',
                      border: `1px solid ${form.digital_score === n ? '#C8A84B' : '#2A2A2A'}`,
                      borderRadius: 3,
                      color: form.digital_score === n ? '#0A0A0A' : '#888',
                      fontFamily: 'inherit',
                      fontSize: 14,
                      fontWeight: form.digital_score === n ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >{n}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#555' }}>
                <span>1 — Nonexistent</span><span>10 — Fully dialed in</span>
              </div>
            </div>
            {textarea('anything_else', 'Anything else we should know?', 'Past bad experiences, concerns, big opportunities — anything goes.', 100)}
            {select('contact_pref', 'Best way to reach you?', ['Phone call', 'Text message', 'Email', 'Video call (Zoom / Google Meet)', 'Any — I\'m flexible'])}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 48, gap: 16 }}>
          {step > 0 ? (
            <button onClick={back} style={styles.btnBack}>← Back</button>
          ) : <div />}
          {step < 4 ? (
            <button onClick={next} style={styles.btnNext}>Continue →</button>
          ) : (
            <button onClick={submit} disabled={submitting} style={{ ...styles.btnNext, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit Intake →'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

const styles = {
  page: {
    background: '#0A0A0A',
    color: '#F8F5EF',
    fontFamily: "'DM Sans', sans-serif",
    minHeight: '100vh',
  } as React.CSSProperties,
  wrap: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '48px 24px 80px',
  } as React.CSSProperties,
  stepTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: 28,
    fontWeight: 600,
    color: '#F8F5EF',
    marginBottom: 6,
  } as React.CSSProperties,
  stepDesc: {
    fontSize: 14,
    color: '#555',
    marginBottom: 32,
    lineHeight: 1.6,
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 11,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: '#888',
    marginBottom: 10,
    fontWeight: 500,
  } as React.CSSProperties,
  input: {
    width: '100%',
    background: '#161616',
    border: '1px solid #2A2A2A',
    color: '#F8F5EF',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    padding: '14px 16px',
    borderRadius: 3,
    outline: 'none',
  } as React.CSSProperties,
  inputError: {
    borderColor: '#E05555',
  } as React.CSSProperties,
  error: {
    fontSize: 12,
    color: '#E05555',
    marginTop: 6,
  } as React.CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 0,
  } as React.CSSProperties,
  radioItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    background: '#161616',
    border: '1px solid #2A2A2A',
    padding: '14px 16px',
    borderRadius: 3,
    transition: 'border-color 0.2s, background 0.2s',
  } as React.CSSProperties,
  radioSelected: {
    borderColor: '#C8A84B',
    background: 'rgba(200,168,75,0.1)',
  } as React.CSSProperties,
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#161616',
    border: '1px solid #2A2A2A',
    padding: '12px 14px',
    borderRadius: 3,
    transition: 'border-color 0.2s, background 0.2s',
  } as React.CSSProperties,
  checkSelected: {
    borderColor: '#C8A84B',
    background: 'rgba(200,168,75,0.1)',
  } as React.CSSProperties,
  btnBack: {
    background: 'transparent',
    border: '1px solid #2A2A2A',
    color: '#888',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    padding: '14px 28px',
    borderRadius: 2,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnNext: {
    background: '#C8A84B',
    border: 'none',
    color: '#0A0A0A',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    padding: '14px 36px',
    borderRadius: 2,
    cursor: 'pointer',
    marginLeft: 'auto',
  } as React.CSSProperties,
                      }
