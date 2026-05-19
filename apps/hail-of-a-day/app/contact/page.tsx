'use client'

import { useState } from 'react'
import { config } from '@/config/brand'

const { contactPage, contact } = config

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rentalCoverage, setRentalCoverage] = useState<'yes' | 'no' | 'unsure'>('yes')
  const [photoCount, setPhotoCount] = useState(0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      zip: formData.get('zip'),
      year: formData.get('year'),
      make: formData.get('make'),
      model: formData.get('model'),
      mileage: formData.get('mileage'),
      vin: formData.get('vin'),
      carrier: formData.get('carrier'),
      policy: formData.get('policy'),
      rentalCoverage,
      notes: formData.get('notes'),
      photoCount,
    }

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        alert('Something went wrong. Please call us directly at ' + contact.phone)
      }
    } catch (err) {
      alert('Something went wrong. Please call us directly at ' + contact.phone)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section className="intake">
        <div className="container" style={{ maxWidth: 720, textAlign: 'center', padding: '120px 24px' }}>
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
            Claim received
          </div>
          <h1 className="display section-title" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            We&apos;ve got it from here.
          </h1>
          <p className="section-lead" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            A real person from Hail of a Day will call you within 24 hours to walk through your coverage and schedule pickup. If you need us sooner, call <a href={`tel:${contact.phone.replace(/\D/g, '')}`} style={{ color: 'var(--signal)', fontWeight: 700 }}>{contact.phone}</a>.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="intake">
      <div className="container">
        <div className="intake-wrap">
          <div className="intake-aside">
            <div className="section-eyebrow">Start Your Claim</div>
            <h1 className="display section-title">
              Two minutes. <span className="accent">That&apos;s it.</span>
            </h1>
            <p className="section-lead">{contactPage.formIntro}</p>

            <div className="intake-stats">
              <h4>What happens next</h4>
              <p>
                A real person from Hail of a Day calls you within 24 hours, walks
                you through your coverage, schedules pickup, and gets your claim
                filed. No call centers. No bots.
              </p>
            </div>

            <div className="intake-stats" style={{ marginTop: 20, borderLeftColor: 'var(--teal-bright)' }}>
              <h4 style={{ color: 'var(--teal-bright)' }}>Prefer to call?</h4>
              <p>
                <a href={`tel:${contact.phone.replace(/\D/g, '')}`} style={{ color: 'var(--chrome-bright)', fontWeight: 700, fontSize: '1.15rem' }}>
                  {contact.phone}
                </a>
                <br />
                <span style={{ fontSize: '0.85rem' }}>{contact.hours}</span>
              </p>
            </div>
          </div>

          <form className="intake-form" onSubmit={handleSubmit}>
            {/* ── Photos ─────────────────────────────────────────────── */}
            <div className="form-section">
              <div className="form-section-label">Your damage</div>
              <div className="form-section-hint">
                Photos are the first thing we look at. Upload as many as you&apos;ve got.
              </div>
              <label className="upload-zone" htmlFor="photoInput">
                <div className="upload-icon">⬆</div>
                <div className="upload-title">
                  {photoCount > 0
                    ? `${photoCount} photo${photoCount > 1 ? 's' : ''} ready to send`
                    : 'Tap to upload photos'}
                </div>
                <div className="upload-hint">JPG, PNG, HEIC · Up to 20 photos</div>
                <input
                  type="file"
                  id="photoInput"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => setPhotoCount(e.target.files?.length ?? 0)}
                />
              </label>
            </div>

            {/* ── About you ──────────────────────────────────────────── */}
            <div className="form-section">
              <div className="form-section-label">About you</div>
              <div className="form-row">
                <div className="field">
                  <label>Full name</label>
                  <input type="text" name="name" placeholder="First and last" required />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input type="tel" name="phone" placeholder="(214) 555-0100" required />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Email</label>
                  <input type="email" name="email" placeholder="you@email.com" required />
                </div>
                <div className="field">
                  <label>Pickup ZIP</label>
                  <input type="text" name="zip" placeholder="75201" required />
                </div>
              </div>
            </div>

            {/* ── Vehicle ────────────────────────────────────────────── */}
            <div className="form-section">
              <div className="form-section-label">Your vehicle</div>
              <div className="form-row three">
                <div className="field">
                  <label>Year</label>
                  <input type="text" name="year" placeholder="2022" />
                </div>
                <div className="field">
                  <label>Make</label>
                  <input type="text" name="make" placeholder="Toyota" />
                </div>
                <div className="field">
                  <label>Model</label>
                  <input type="text" name="model" placeholder="Camry" />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Mileage</label>
                  <input type="text" name="mileage" placeholder="35,000" />
                </div>
                <div className="field">
                  <label>
                    VIN <span className="optional">(optional)</span>
                  </label>
                  <input type="text" name="vin" placeholder="17-digit VIN" />
                </div>
              </div>
            </div>

            {/* ── Insurance ──────────────────────────────────────────── */}
            <div className="form-section">
              <div className="form-section-label">Insurance &amp; rental</div>
              <div className="form-row">
                <div className="field">
                  <label>Insurance carrier</label>
                  <input
                    type="text"
                    name="carrier"
                    placeholder="State Farm, Allstate, GEICO…"
                  />
                </div>
                <div className="field">
                  <label>
                    Policy number <span className="optional">(optional)</span>
                  </label>
                  <input type="text" name="policy" placeholder="Policy #" />
                </div>
              </div>
              <div className="field">
                <label>Do you have rental car coverage?</label>
                <div className="radio-group">
                  {(['yes', 'no', 'unsure'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`radio-pill ${rentalCoverage === opt ? 'active' : ''}`}
                      onClick={() => setRentalCoverage(opt)}
                    >
                      {opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : 'Not sure'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Notes ──────────────────────────────────────────────── */}
            <div className="form-section">
              <div className="form-section-label">Anything else?</div>
              <div className="field">
                <textarea
                  name="notes"
                  placeholder="When did the hail hit? Where's the worst damage? Any timing constraints?"
                />
              </div>
            </div>

            <button type="submit" className="form-submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit my claim →'}
            </button>
            <p className="consent">
              By submitting, you agree we may contact you about your claim by
              phone, text, or email. No spam, ever.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
                                                 }
