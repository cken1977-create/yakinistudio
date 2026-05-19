'use client'

import { useState } from 'react'
import Link from 'next/link'

// In production this would resolve the token to a real lead.
// For the demo, we hardcode a believable customer the recipient sees.
const DEMO_CUSTOMER = {
  firstName: 'Marcus',
  phone: '(214) 555-0142',
  greeter: 'Tania',
}

export default function MobileIntakePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [photoCount, setPhotoCount] = useState(0)
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 1200)
  }

  if (submitted) {
    return (
      <div className="mobile-intake-shell">
        <div className="demo-banner">
          <span className="demo-banner-pulse"></span>
          <strong>DEMO PREVIEW</strong>
          <span>·</span>
          <span>Customer view after Tania&apos;s parking-lot capture.</span>
          <Link href="/" className="demo-banner-back">← Back to site</Link>
        </div>
        <div className="m-container m-success">
          <div className="m-success-icon">✓</div>
          <h1 className="m-success-title">All set, {DEMO_CUSTOMER.firstName}.</h1>
          <p className="m-success-text">
            Tania has your photos. She&apos;ll call you within 24 hours to walk
            through your insurance coverage and schedule pickup.
          </p>
          <div className="m-success-stat">
            <div className="m-success-stat-label">Your reference number</div>
            <div className="m-success-stat-num">L-2026-0142</div>
          </div>
          <p className="m-success-foot">
            Need us sooner? Call <a href="tel:2142452113">(214) 245-2113</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-intake-shell">
      <div className="demo-banner">
        <span className="demo-banner-pulse"></span>
        <strong>DEMO PREVIEW</strong>
        <span>·</span>
        <span>Customer view after Tania&apos;s parking-lot capture.</span>
        <Link href="/" className="demo-banner-back">← Back to site</Link>
      </div>

      <div className="m-container">
        {/* ── Personalized greeting ──────────────────────────────────── */}
        <div className="m-greeting">
          <div className="m-greeting-from">From Tania at Hail of a Day</div>
          <h1 className="m-greeting-title">
            Hey {DEMO_CUSTOMER.firstName} —<br />
            <span className="m-greeting-accent">let&apos;s get you fixed up.</span>
          </h1>
          <p className="m-greeting-sub">
            Takes about 60 seconds. Send me a few photos and a quick vehicle
            note, and I&apos;ll handle the rest from here.
          </p>
        </div>

        {/* ── Progress dots ─────────────────────────────────────────── */}
        <div className="m-progress">
          <div className={`m-progress-dot ${step >= 1 ? 'active' : ''}`}></div>
          <div className={`m-progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`m-progress-dot ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`m-progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`m-progress-dot ${step >= 3 ? 'active' : ''}`}></div>
        </div>

        {/* ── Step 1: Photos ────────────────────────────────────────── */}
        {step === 1 && (
          <div className="m-step">
            <div className="m-step-label">Step 1 of 3</div>
            <h2 className="m-step-title">Send the photos</h2>
            <p className="m-step-hint">
              Wide shots of the worst panels work best. Hood, roof, fenders.
            </p>

            <label className="m-upload-zone" htmlFor="m-photos">
              <div className="m-upload-icon">📷</div>
              <div className="m-upload-title">
                {photoCount > 0
                  ? `${photoCount} photo${photoCount > 1 ? 's' : ''} attached`
                  : 'Tap to take or upload photos'}
              </div>
              <div className="m-upload-hint">
                {photoCount > 0 ? 'Tap to add more' : 'JPG, PNG, HEIC — up to 20'}
              </div>
              <input
                type="file"
                id="m-photos"
                accept="image/*"
                multiple
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => setPhotoCount(e.target.files?.length ?? 0)}
              />
            </label>

            <button
              className="m-next-btn"
              disabled={photoCount === 0}
              onClick={() => setStep(2)}
            >
              {photoCount === 0 ? 'Add at least one photo' : 'Next →'}
            </button>
          </div>
        )}

        {/* ── Step 2: Vehicle ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="m-step">
            <div className="m-step-label">Step 2 of 3</div>
            <h2 className="m-step-title">What are you driving?</h2>
            <p className="m-step-hint">Just the basics — we&apos;ll get the rest on the call.</p>

            <div className="m-field">
              <label>Year</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="2022"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="m-field">
              <label>Make</label>
              <input
                type="text"
                placeholder="Chevrolet"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
            </div>
            <div className="m-field">
              <label>Model</label>
              <input
                type="text"
                placeholder="Tahoe"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>

            <button
              className="m-next-btn"
              disabled={!year || !make || !model}
              onClick={() => setStep(3)}
            >
              Next →
            </button>
            <button className="m-back-btn" onClick={() => setStep(1)}>
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 3: Confirm ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="m-step">
            <div className="m-step-label">Step 3 of 3</div>
            <h2 className="m-step-title">Look right?</h2>
            <p className="m-step-hint">
              Confirm and Tania will call you within 24 hours.
            </p>

            <div className="m-summary">
              <div className="m-summary-row">
                <div className="m-summary-label">Name</div>
                <div className="m-summary-value">{DEMO_CUSTOMER.firstName}</div>
              </div>
              <div className="m-summary-row">
                <div className="m-summary-label">Phone</div>
                <div className="m-summary-value">{DEMO_CUSTOMER.phone}</div>
              </div>
              <div className="m-summary-row">
                <div className="m-summary-label">Vehicle</div>
                <div className="m-summary-value">{year} {make} {model}</div>
              </div>
              <div className="m-summary-row">
                <div className="m-summary-label">Photos</div>
                <div className="m-summary-value">{photoCount} attached</div>
              </div>
            </div>

            <button
              className="m-next-btn"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Sending to Tania…' : 'Send to Tania →'}
            </button>
            <button className="m-back-btn" onClick={() => setStep(2)} disabled={submitting}>
              ← Back
            </button>
          </div>
        )}

        <div className="m-trust">
          <span>🛡️</span>
          <span>No spam. No obligation. We&apos;ll only contact you about your repair.</span>
        </div>
      </div>
    </div>
  )
            }
