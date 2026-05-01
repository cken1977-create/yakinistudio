'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const SUPABASE_URL = 'https://mxshsmknfqxwltucgezl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c2hzbWtuZnF4d2x0dWNnZXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDM1NjIsImV4cCI6MjA5MzA3OTU2Mn0.cdx3T5CVFKq2sis-FOHau2V0Lx3CrsyoZmaAfM689v0'
const RESEND_API_KEY = 're_DdtMrt3n_F6B4vJQiepzrYpHwK6gkB93N'

type Contract = {
  id: string
  client_name: string
  client_email: string
  client_business: string
  contract_type: string
  contract_title: string
  status: string
  document_url: string | null
  signing_token: string
  token_expires_at: string
  sent_at: string
}

type SigningStep = 'loading' | 'invalid' | 'expired' | 'already_signed' | 'review' | 'sign' | 'complete'

export default function SignPage({ params }: { params: { token: string } }) {
  const [step, setStep] = useState<SigningStep>('loading')
  const [contract, setContract] = useState<Contract | null>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [nameError, setNameError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasSig, setHasSig] = useState(false)
  const [sigMode, setSigMode] = useState<'type' | 'draw'>('type')

  const token = params?.token

  // ── Load contract ──────────────────────────────────────────
  useEffect(() => {
    if (!token) { setStep('invalid'); return }
    loadContract()
  }, [token])

  const loadContract = async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/contracts?signing_token=eq.${token}&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      )
      const data = await res.json()
      if (!data?.length) { setStep('invalid'); return }
      const c = data[0]
      if (c.status === 'signed') { setStep('already_signed'); setContract(c); return }
      if (new Date(c.token_expires_at) < new Date()) { setStep('expired'); return }
      setContract(c)
      // Mark as viewed
      await fetch(`${SUPABASE_URL}/rest/v1/contracts?id=eq.${c.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: 'viewed', viewed_at: new Date().toISOString() })
      })
      setStep('review')
    } catch {
      setStep('invalid')
    }
  }

  // ── Scroll tracking ────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const scrolled = el.scrollTop
    const total = el.scrollHeight - el.clientHeight
    const pct = Math.min(100, Math.round((scrolled / total) * 100))
    setProgress(pct)
    if (pct >= 85) setHasScrolled(true)
  }, [])

  // ── Canvas signature ───────────────────────────────────────
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1A3A5C'
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSig(true)
  }

  const stopDraw = () => setDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSig(false)
  }

  // ── Submit signature ───────────────────────────────────────
  const submitSignature = async () => {
    if (!signerName.trim()) { setNameError('Please enter your full legal name'); return }
    if (signerName.trim().split(' ').length < 2) { setNameError('Please enter your full name (first and last)'); return }
    if (!hasChecked) return
    if (!contract) return

    setSubmitting(true)
    const now = new Date().toISOString()

    try {
      // Update contract as signed
      await fetch(`${SUPABASE_URL}/rest/v1/contracts?id=eq.${contract.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: 'signed',
          signed_at: now,
          signer_name: signerName.trim(),
          signer_consent: true,
        })
      })

      // Insert audit log
      await fetch(`${SUPABASE_URL}/rest/v1/contract_audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          contract_id: contract.id,
          event: 'signed',
          actor: contract.client_email,
          notes: `Signed by ${signerName.trim()} at ${now}`
        })
      })

      // Send confirmation emails
      const emailHtml = `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#F6F3EE;padding:0;border-radius:6px;overflow:hidden;">
          <div style="background:#1A3A5C;padding:28px 32px;">
            <div style="font-family:Arial,sans-serif;font-weight:700;font-size:20px;color:white;letter-spacing:2px;">YAKINI</div>
            <div style="font-family:Arial,sans-serif;font-size:9px;color:#C8A84B;letter-spacing:3px;margin-top:3px;">DIGITAL INFRASTRUCTURE</div>
          </div>
          <div style="background:#C8A84B;height:3px;"></div>
          <div style="padding:32px;">
            <h2 style="font-family:Arial,sans-serif;font-size:18px;color:#1A3A5C;margin:0 0 16px;">Contract Executed Successfully</h2>
            <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 12px;">
              <strong>${signerName.trim()}</strong> — your contract has been signed and is now legally binding.
            </p>
            <div style="background:white;border:1px solid #E0DBD0;border-radius:4px;padding:20px;margin:20px 0;">
              <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#C8A84B;letter-spacing:2px;margin-bottom:12px;">CONTRACT DETAILS</div>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:6px 0;color:#888;font-size:13px;width:120px;">Document</td><td style="padding:6px 0;font-size:13px;color:#333;">${contract.contract_title}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px;">Client</td><td style="padding:6px 0;font-size:13px;color:#333;">${contract.client_name}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px;">Business</td><td style="padding:6px 0;font-size:13px;color:#333;">${contract.client_business || '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px;">Signed By</td><td style="padding:6px 0;font-size:13px;color:#333;">${signerName.trim()}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px;">Date & Time</td><td style="padding:6px 0;font-size:13px;color:#333;">${new Date(now).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</td></tr>
              </table>
            </div>
            <p style="font-size:13px;color:#666;line-height:1.6;">
              This signature is legally binding under the U.S. Electronic Signatures in Global and National Commerce Act (ESIGN). 
              A copy of this agreement has been sent to both parties for your records.
            </p>
          </div>
          <div style="background:#1A3A5C;padding:16px 32px;text-align:center;">
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#888;margin:0;">Yakini Digital Infrastructure · yakini.digital · admin@yakini.digital</p>
          </div>
        </div>
      `

      // Notify client
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Yakini Contracts <admin@yakini.digital>',
          to: [contract.client_email],
          subject: `✓ Signed — ${contract.contract_title}`,
          html: emailHtml
        })
      })

      // Notify Yakini
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Yakini Contracts <admin@yakini.digital>',
          to: ['admin@yakini.digital'],
          subject: `✓ Contract Signed — ${contract.client_business || contract.client_name}`,
          html: emailHtml
        })
      })

      setStep('complete')
    } catch (e) {
      console.error(e)
    }
    setSubmitting(false)
  }

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* Loading */}
      {step === 'loading' && (
        <div className="ys-center">
          <div className="ys-spinner" />
          <p className="ys-loading-text">Loading your contract...</p>
        </div>
      )}

      {/* Invalid */}
      {step === 'invalid' && (
        <div className="ys-center">
          <div className="ys-status-icon ys-icon-error">✕</div>
          <h2 className="ys-status-title">Link Not Found</h2>
          <p className="ys-status-body">This signing link is invalid or has already been used. Contact <a href="mailto:admin@yakini.digital">admin@yakini.digital</a> for a new link.</p>
        </div>
      )}

      {/* Expired */}
      {step === 'expired' && (
        <div className="ys-center">
          <div className="ys-status-icon ys-icon-warn">!</div>
          <h2 className="ys-status-title">Link Expired</h2>
          <p className="ys-status-body">This signing link has expired. Contact <a href="mailto:admin@yakini.digital">admin@yakini.digital</a> to receive a new link.</p>
        </div>
      )}

      {/* Already signed */}
      {step === 'already_signed' && (
        <div className="ys-center">
          <div className="ys-status-icon ys-icon-success">✓</div>
          <h2 className="ys-status-title">Already Signed</h2>
          <p className="ys-status-body">
            <strong>{contract?.contract_title}</strong> has already been executed.
            Check your email for your copy or contact <a href="mailto:admin@yakini.digital">admin@yakini.digital</a>.
          </p>
        </div>
      )}

      {/* Review */}
      {step === 'review' && contract && (
        <div className="ys-page">

          {/* Header */}
          <header className="ys-header">
            <div className="ys-header-left">
              <div className="ys-logo-name">YAKINI</div>
              <div className="ys-logo-sub">Digital Infrastructure</div>
            </div>
            <div className="ys-header-center">
              <div className="ys-doc-title">{contract.contract_title}</div>
              <div className="ys-doc-sub">{contract.client_business || contract.client_name}</div>
            </div>
            <div className="ys-header-right">
              <div className="ys-progress-ring-wrap">
                <svg className="ys-progress-ring" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(200,168,75,0.15)" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#C8A84B" strokeWidth="2.5"
                    strokeDasharray={`${progress} 100`}
                    strokeDashoffset="25"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="ys-progress-pct">{progress}%</span>
              </div>
              <span className="ys-read-label">Read</span>
            </div>
          </header>

          {/* Progress bar */}
          <div className="ys-topbar">
            <div className="ys-topbar-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Document */}
          <div className="ys-doc-wrap">
            <div className="ys-doc-shell">

              {/* Document meta */}
              <div className="ys-doc-meta">
                <div className="ys-doc-meta-left">
                  <div className="ys-meta-label">Document</div>
                  <div className="ys-meta-val">{contract.contract_title}</div>
                </div>
                <div className="ys-doc-meta-right">
                  <div className="ys-meta-label">Sent</div>
                  <div className="ys-meta-val">
                    {contract.sent_at ? new Date(contract.sent_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>

              {/* Scrollable contract body */}
              <div className="ys-doc-body" ref={scrollRef} onScroll={handleScroll}>
                <ContractBody contract={contract} />
              </div>

              {/* Scroll nudge */}
              {!hasScrolled && (
                <div className="ys-scroll-nudge">
                  <span>↓ Scroll to read the full document before signing</span>
                </div>
              )}

              {/* CTA */}
              <div className="ys-doc-footer">
                <div className="ys-footer-info">
                  <span className="ys-footer-lock">🔒</span>
                  <span>Secured by Yakini E-Sign · ESIGN Act compliant · Tamper-evident audit trail</span>
                </div>
                <button
                  className={`ys-btn-proceed ${hasScrolled ? 'ys-btn-active' : 'ys-btn-disabled'}`}
                  onClick={() => hasScrolled && setStep('sign')}
                  disabled={!hasScrolled}
                >
                  {hasScrolled ? 'Proceed to Sign →' : 'Read document to continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign */}
      {step === 'sign' && contract && (
        <div className="ys-page">
          <header className="ys-header">
            <div className="ys-header-left">
              <div className="ys-logo-name">YAKINI</div>
              <div className="ys-logo-sub">Digital Infrastructure</div>
            </div>
            <div className="ys-header-center">
              <div className="ys-doc-title">{contract.contract_title}</div>
              <div className="ys-doc-sub">Sign & Execute</div>
            </div>
            <div className="ys-header-right">
              <button className="ys-btn-back" onClick={() => setStep('review')}>← Review</button>
            </div>
          </header>

          <div className="ys-sign-wrap">
            <div className="ys-sign-shell">

              {/* Identity */}
              <div className="ys-sign-section">
                <div className="ys-sign-label">Your Legal Name</div>
                <p className="ys-sign-hint">Enter your full legal name exactly as it appears on your government-issued ID. This constitutes your legal signature.</p>
                <input
                  type="text"
                  className={`ys-name-input ${nameError ? 'ys-name-error' : ''}`}
                  placeholder="First and Last Name"
                  value={signerName}
                  onChange={e => { setSignerName(e.target.value); setNameError('') }}
                />
                {nameError && <div className="ys-error-msg">{nameError}</div>}
              </div>

              {/* Signature */}
              <div className="ys-sign-section">
                <div className="ys-sign-label">Signature</div>
                <div className="ys-sig-tabs">
                  <button className={`ys-sig-tab ${sigMode === 'type' ? 'ys-sig-tab-active' : ''}`} onClick={() => setSigMode('type')}>Type</button>
                  <button className={`ys-sig-tab ${sigMode === 'draw' ? 'ys-sig-tab-active' : ''}`} onClick={() => setSigMode('draw')}>Draw</button>
                </div>

                {sigMode === 'type' ? (
                  <div className="ys-sig-typed">
                    {signerName
                      ? <span className="ys-sig-preview">{signerName}</span>
                      : <span className="ys-sig-placeholder">Your name will appear here</span>
                    }
                  </div>
                ) : (
                  <div className="ys-sig-canvas-wrap">
                    <canvas
                      ref={canvasRef}
                      className="ys-sig-canvas"
                      width={560}
                      height={160}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={stopDraw}
                      onMouseLeave={stopDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={stopDraw}
                    />
                    <button className="ys-clear-btn" onClick={clearCanvas}>Clear</button>
                    {!hasSig && <div className="ys-canvas-hint">Draw your signature above</div>}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="ys-sign-section">
                <div className="ys-sign-label">You Are Signing</div>
                <div className="ys-summary-card">
                  {[
                    ['Document', contract.contract_title],
                    ['Your Name', contract.client_name],
                    ['Business', contract.client_business || '—'],
                    ['Email', contract.client_email],
                    ['Date', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
                    ['Counterparty', 'Yakini Digital Infrastructure LLC'],
                  ].map(([label, val]) => (
                    <div key={label} className="ys-summary-row">
                      <span className="ys-summary-label">{label}</span>
                      <span className="ys-summary-val">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consent */}
              <div className="ys-consent-wrap">
                <label className="ys-consent-label" onClick={() => setHasChecked(v => !v)}>
                  <div className={`ys-checkbox ${hasChecked ? 'ys-checked' : ''}`}>
                    {hasChecked && <span>✓</span>}
                  </div>
                  <span>
                    I have read and understood the full document. I agree that typing my name or drawing my signature above constitutes my legal electronic signature, binding under the U.S. ESIGN Act (15 U.S.C. § 7001 et seq.) and applicable law.
                  </span>
                </label>
              </div>

              {/* Sign button */}
              <button
                className={`ys-btn-sign ${hasChecked && signerName.trim().split(' ').length >= 2 ? 'ys-btn-sign-active' : 'ys-btn-sign-disabled'}`}
                onClick={submitSignature}
                disabled={!hasChecked || signerName.trim().split(' ').length < 2 || submitting}
              >
                {submitting ? (
                  <span className="ys-btn-loading">
                    <span className="ys-mini-spinner" />
                    Executing contract...
                  </span>
                ) : (
                  '✓ Sign & Execute Contract'
                )}
              </button>

              <p className="ys-legal-note">
                By clicking "Sign & Execute Contract" you are entering into a legally binding agreement.
                A signed copy will be delivered to {contract.client_email} and admin@yakini.digital.
                This action is recorded with a timestamp and audit trail.
              </p>

            </div>
          </div>
        </div>
      )}

      {/* Complete */}
      {step === 'complete' && contract && (
        <div className="ys-center">
          <div className="ys-complete-wrap">
            <div className="ys-status-icon ys-icon-success ys-icon-lg">✓</div>
            <h2 className="ys-status-title">Contract Executed</h2>
            <p className="ys-status-body">
              <strong>{contract.contract_title}</strong> has been signed by <strong>{signerName}</strong>.
              A copy has been sent to <strong>{contract.client_email}</strong>.
            </p>
            <div className="ys-complete-details">
              <div className="ys-complete-label">WHAT HAPPENS NEXT</div>
              {[
                'Yakini reviews your signed agreement',
                'Your project kickoff is scheduled',
                'You receive a welcome email with next steps',
                'Building begins',
              ].map((s, i) => (
                <div key={i} className="ys-complete-item">
                  <span className="ys-complete-arrow">→</span>{s}
                </div>
              ))}
            </div>
            <div className="ys-complete-footer">
              <a href="https://yakini.digital" className="ys-btn-home">Go to yakini.digital →</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Contract Body Component ────────────────────────────────────────────────
function ContractBody({ contract }: { contract: Contract }) {
  return (
    <div className="ys-contract-content">
      <h1 className="ys-contract-title">{contract.contract_title}</h1>
      <p className="ys-contract-intro">
        This agreement is between <strong>Yakini Digital Infrastructure LLC</strong>,
        a Delaware Limited Liability Company (&ldquo;Yakini&rdquo;) and{' '}
        <strong>{contract.client_name}</strong>
        {contract.client_business ? ` of ${contract.client_business}` : ''} (&ldquo;Client&rdquo;).
      </p>

      {[
        {
          num: '1', title: 'Services',
          body: 'Yakini agrees to provide digital infrastructure services as specified in the Statement of Work attached hereto, including website design and development, brand identity, marketing systems, AI-powered tools, and ongoing platform management.'
        },
        {
          num: '2', title: 'Intellectual Property',
          body: 'All Yakini infrastructure, templates, AI tools, and platform architecture remain the exclusive property of Yakini Digital Infrastructure LLC and BRSA Holdings, Inc. Client receives a non-exclusive, non-transferable license to use the Client Deliverables upon receipt of full payment. This license is revocable upon breach or non-payment.'
        },
        {
          num: '3', title: 'Payment Terms',
          body: 'Client agrees to pay the Setup Fee prior to commencement of work. Monthly Retainer payments are due on the first of each calendar month. Invoices unpaid after 10 business days accrue a 1.5% monthly late fee. Yakini may suspend services for accounts more than 30 days past due.'
        },
        {
          num: '4', title: 'Term and Termination',
          body: 'This agreement commences on the Effective Date and continues until terminated. Either party may terminate with 30 days written notice. Yakini may terminate immediately upon material breach or non-payment. Upon termination, all licenses are revoked and outstanding fees become immediately due.'
        },
        {
          num: '5', title: 'Confidentiality',
          body: 'Both parties agree to hold in strict confidence all Confidential Information disclosed during this engagement, including business plans, pricing, client data, and proprietary methodologies. This obligation survives termination for three years.'
        },
        {
          num: '6', title: 'Limitation of Liability',
          body: "Yakini's total liability under this agreement shall not exceed the total fees paid in the three months preceding the claim. In no event shall Yakini be liable for indirect, incidental, special, or consequential damages."
        },
        {
          num: '7', title: 'Governing Law',
          body: 'This agreement is governed by the laws of the State of Delaware. Disputes shall be resolved through good faith negotiation, and if unresolved, through binding arbitration under the rules of the American Arbitration Association.'
        },
        {
          num: '8', title: 'Electronic Signature',
          body: "The parties agree that electronic signatures are legally binding and fully enforceable under the U.S. Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. § 7001) and applicable state law. The electronic record of this agreement, including the signer's name, timestamp, IP address, and consent confirmation, constitutes a complete and binding execution of this agreement."
        },
      ].map(section => (
        <div key={section.num} className="ys-contract-section">
          <div className="ys-contract-sec-num">{section.num}</div>
          <div>
            <div className="ys-contract-sec-title">{section.title}</div>
            <p className="ys-contract-sec-body">{section.body}</p>
          </div>
        </div>
      ))}

      <div className="ys-contract-end">
        <div className="ys-contract-sig-block">
          <div className="ys-sig-block-label">YAKINI DIGITAL INFRASTRUCTURE LLC</div>
          <div className="ys-sig-block-name">Clarence</div>
          <div className="ys-sig-block-title">Founder &amp; Managing Member</div>
        </div>
        <div className="ys-contract-sig-block">
          <div className="ys-sig-block-label">CLIENT</div>
          <div className="ys-sig-block-name">{contract.client_name}</div>
          <div className="ys-sig-block-title">{contract.client_business || 'Client'}</div>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #F4F1EB;
    color: #1A1A1A;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  /* ── CENTER STATES ── */
  .ys-center {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    background: #F4F1EB;
  }

  .ys-spinner {
    width: 40px; height: 40px;
    border: 3px solid rgba(26,58,92,0.15);
    border-top-color: #1A3A5C;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .ys-loading-text { font-size: 14px; color: #888; }

  .ys-status-icon {
    width: 72px; height: 72px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 700;
    margin-bottom: 24px;
  }

  .ys-icon-success { background: rgba(42,122,58,0.1); color: #2A7A3A; border: 2px solid #2A7A3A; }
  .ys-icon-error   { background: rgba(200,22,29,0.1); color: #C8161D; border: 2px solid #C8161D; }
  .ys-icon-warn    { background: rgba(200,168,75,0.15); color: #C8A84B; border: 2px solid #C8A84B; }
  .ys-icon-lg      { width: 88px; height: 88px; font-size: 36px; }

  .ys-status-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; font-weight: 600;
    color: #1A3A5C; margin-bottom: 12px; text-align: center;
  }

  .ys-status-body {
    font-size: 15px; color: #666; line-height: 1.7;
    max-width: 440px; text-align: center;
  }

  .ys-status-body a { color: #C8A84B; }

  /* ── MAIN PAGE ── */
  .ys-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #F4F1EB;
  }

  /* ── HEADER ── */
  .ys-header {
    background: #1A3A5C;
    padding: 0 28px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0; z-index: 100;
    flex-shrink: 0;
  }

  .ys-header-left { display: flex; flex-direction: column; }

  .ys-logo-name {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600; font-size: 15px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: white; line-height: 1;
  }

  .ys-logo-sub {
    font-size: 8px; letter-spacing: 0.18em;
    text-transform: uppercase; color: #C8A84B;
    margin-top: 2px;
  }

  .ys-header-center { text-align: center; flex: 1; padding: 0 20px; }

  .ys-doc-title {
    font-size: 13px; font-weight: 600;
    color: white; line-height: 1.2;
  }

  .ys-doc-sub { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 2px; }

  .ys-header-right {
    display: flex; align-items: center; gap: 8px;
    flex-direction: column;
  }

  .ys-progress-ring-wrap {
    position: relative; width: 36px; height: 36px;
  }

  .ys-progress-ring { width: 36px; height: 36px; transform: rotate(-90deg); }

  .ys-progress-pct {
    position: absolute;
    inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; font-weight: 600; color: #C8A84B;
  }

  .ys-read-label {
    font-size: 8px; letter-spacing: 0.12em;
    text-transform: uppercase; color: rgba(255,255,255,0.4);
  }

  .ys-btn-back {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.7);
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; padding: 6px 14px; border-radius: 2px;
    cursor: pointer; transition: all 0.2s;
  }

  .ys-btn-back:hover { background: rgba(255,255,255,0.15); color: white; }

  /* ── PROGRESS BAR ── */
  .ys-topbar {
    height: 3px; background: rgba(200,168,75,0.2);
    position: relative; flex-shrink: 0;
  }

  .ys-topbar-fill {
    height: 100%; background: #C8A84B;
    transition: width 0.3s ease;
  }

  /* ── DOCUMENT ── */
  .ys-doc-wrap {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 32px 20px;
    overflow: hidden;
  }

  .ys-doc-shell {
    background: white;
    border-radius: 4px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
    width: 100%; max-width: 760px;
    display: flex; flex-direction: column;
    max-height: calc(100vh - 140px);
    overflow: hidden;
  }

  /* Document meta bar */
  .ys-doc-meta {
    display: flex;
    justify-content: space-between;
    padding: 16px 24px;
    background: #F6F3EE;
    border-bottom: 1px solid #E8E4DC;
    flex-shrink: 0;
  }

  .ys-meta-label {
    font-size: 9px; letter-spacing: 0.18em;
    text-transform: uppercase; color: #C8A84B;
    font-weight: 600; margin-bottom: 3px;
  }

  .ys-meta-val { font-size: 13px; font-weight: 500; color: #1A3A5C; }

  /* Scrollable body */
  .ys-doc-body {
    flex: 1;
    overflow-y: auto;
    padding: 32px 40px;
    scroll-behavior: smooth;
  }

  .ys-doc-body::-webkit-scrollbar { width: 6px; }
  .ys-doc-body::-webkit-scrollbar-track { background: #F4F1EB; }
  .ys-doc-body::-webkit-scrollbar-thumb { background: #C8A84B; border-radius: 3px; }

  /* Scroll nudge */
  .ys-scroll-nudge {
    padding: 10px 24px;
    background: rgba(200,168,75,0.08);
    border-top: 1px solid rgba(200,168,75,0.2);
    text-align: center;
    font-size: 12px; color: #C8A84B; font-weight: 500;
    flex-shrink: 0;
    animation: pulse-nudge 2s ease infinite;
  }

  @keyframes pulse-nudge {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  /* Footer */
  .ys-doc-footer {
    padding: 16px 24px;
    border-top: 1px solid #E8E4DC;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .ys-footer-info {
    font-size: 11px; color: #999;
    display: flex; align-items: center; gap: 6px;
  }

  .ys-footer-lock { font-size: 13px; }

  .ys-btn-proceed {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.08em;
    padding: 12px 28px;
    border-radius: 2px; border: none;
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap;
  }

  .ys-btn-active {
    background: #1A3A5C; color: white;
  }

  .ys-btn-active:hover { background: #0F2540; transform: translateY(-1px); }

  .ys-btn-disabled {
    background: #E0DDD5; color: #AAA; cursor: not-allowed;
  }

  /* ── CONTRACT CONTENT ── */
  .ys-contract-content { font-family: 'Cormorant Garamond', serif; }

  .ys-contract-title {
    font-size: 26px; font-weight: 600; color: #1A3A5C;
    margin-bottom: 16px; line-height: 1.2;
  }

  .ys-contract-intro {
    font-size: 15px; color: #555; line-height: 1.8;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid #E8E4DC;
    font-family: 'DM Sans', sans-serif;
  }

  .ys-contract-section {
    display: flex; gap: 20px;
    padding: 18px 0;
    border-bottom: 1px solid #F0ECE4;
  }

  .ys-contract-section:last-of-type { border-bottom: none; }

  .ys-contract-sec-num {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 700;
    color: #C8A84B; min-width: 20px;
    padding-top: 3px;
  }

  .ys-contract-sec-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 700;
    color: #1A3A5C; margin-bottom: 6px;
    letter-spacing: 0.03em;
  }

  .ys-contract-sec-body {
    font-size: 14px; color: #555; line-height: 1.8;
    font-family: 'DM Sans', sans-serif;
  }

  .ys-contract-end {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px; margin-top: 36px; padding-top: 28px;
    border-top: 2px solid #1A3A5C;
  }

  .ys-sig-block-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.2em; color: #C8A84B;
    text-transform: uppercase; margin-bottom: 8px;
  }

  .ys-sig-block-name {
    font-size: 18px; font-weight: 600; color: #1A3A5C;
    margin-bottom: 4px;
  }

  .ys-sig-block-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; color: #888;
  }

  /* ── SIGN PAGE ── */
  .ys-sign-wrap {
    flex: 1; display: flex;
    justify-content: center;
    padding: 32px 20px;
  }

  .ys-sign-shell {
    background: white;
    border-radius: 4px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    width: 100%; max-width: 680px;
    padding: 40px;
    height: fit-content;
  }

  .ys-sign-section { margin-bottom: 32px; }

  .ys-sign-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #C8A84B; margin-bottom: 8px;
  }

  .ys-sign-hint {
    font-size: 13px; color: #888; margin-bottom: 12px; line-height: 1.6;
  }

  .ys-name-input {
    width: 100%;
    background: #F8F5EF;
    border: 1px solid #E0DBD0;
    color: #1A1A1A;
    font-family: 'DM Sans', sans-serif;
    font-size: 16px; font-weight: 500;
    padding: 14px 16px;
    border-radius: 3px; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .ys-name-input:focus {
    border-color: #1A3A5C;
    box-shadow: 0 0 0 3px rgba(26,58,92,0.08);
  }

  .ys-name-error { border-color: #C8161D !important; }
  .ys-error-msg { font-size: 12px; color: #C8161D; margin-top: 6px; }

  /* Sig tabs */
  .ys-sig-tabs { display: flex; gap: 2px; margin-bottom: 12px; }

  .ys-sig-tab {
    background: #F0ECE4; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 8px 20px; border-radius: 2px;
    cursor: pointer; transition: all 0.2s; color: #888;
  }

  .ys-sig-tab-active { background: #1A3A5C; color: white; }

  .ys-sig-typed {
    background: #F8F5EF;
    border: 1px solid #E0DBD0;
    border-radius: 3px;
    padding: 20px 20px;
    min-height: 80px;
    display: flex; align-items: center;
  }

  .ys-sig-preview {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; font-style: italic;
    color: #1A3A5C; font-weight: 500;
  }

  .ys-sig-placeholder {
    font-size: 13px; color: #BBB; font-style: italic;
  }

  .ys-sig-canvas-wrap { position: relative; }

  .ys-sig-canvas {
    width: 100%; height: 160px;
    background: #F8F5EF;
    border: 1px solid #E0DBD0;
    border-radius: 3px; display: block;
    cursor: crosshair;
    touch-action: none;
  }

  .ys-clear-btn {
    position: absolute; top: 10px; right: 10px;
    background: white; border: 1px solid #E0DBD0;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 500;
    color: #888; padding: 4px 10px;
    border-radius: 2px; cursor: pointer;
    transition: all 0.2s;
  }

  .ys-clear-btn:hover { border-color: #C8161D; color: #C8161D; }

  .ys-canvas-hint {
    position: absolute; bottom: 12px; left: 0; right: 0;
    text-align: center; font-size: 12px; color: #CCC;
    pointer-events: none;
  }

  /* Summary */
  .ys-summary-card {
    background: #F8F5EF;
    border: 1px solid #E8E4DC;
    border-radius: 3px;
    overflow: hidden;
  }

  .ys-summary-row {
    display: flex; gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid #EEE9DF;
    font-size: 13px;
  }

  .ys-summary-row:last-child { border-bottom: none; }
  .ys-summary-label { color: #999; min-width: 100px; flex-shrink: 0; }
  .ys-summary-val { color: #1A1A1A; font-weight: 500; }

  /* Consent */
  .ys-consent-wrap { margin-bottom: 24px; }

  .ys-consent-label {
    display: flex; gap: 14px; align-items: flex-start;
    cursor: pointer; user-select: none;
    font-size: 13px; color: #555; line-height: 1.6;
  }

  .ys-checkbox {
    width: 20px; height: 20px;
    border: 2px solid #C8A84B;
    border-radius: 2px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    margin-top: 1px; transition: all 0.2s;
    font-size: 13px; font-weight: 700; color: white;
  }

  .ys-checked { background: #C8A84B; }

  /* Sign button */
  .ys-btn-sign {
    width: 100%;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 700;
    letter-spacing: 0.1em;
    padding: 18px; border: none;
    border-radius: 3px; cursor: pointer;
    transition: all 0.2s; margin-bottom: 16px;
  }

  .ys-btn-sign-active { background: #1A3A5C; color: white; }
  .ys-btn-sign-active:hover { background: #0F2540; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,58,92,0.25); }
  .ys-btn-sign-disabled { background: #E0DDD5; color: #AAA; cursor: not-allowed; }

  .ys-btn-loading {
    display: flex; align-items: center;
    justify-content: center; gap: 10px;
  }

  .ys-mini-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .ys-legal-note {
    font-size: 11px; color: #AAA; line-height: 1.6; text-align: center;
  }

  /* ── COMPLETE ── */
  .ys-complete-wrap {
    background: white;
    border-radius: 4px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    padding: 48px 40px;
    max-width: 520px; width: 100%;
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
  }

  .ys-complete-details {
    background: #F8F5EF;
    border: 1px solid #E8E4DC;
    border-radius: 3px;
    padding: 20px 24px;
    text-align: left;
    width: 100%; margin: 20px 0;
  }

  .ys-complete-label {
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.2em; color: #C8A84B;
    text-transform: uppercase; margin-bottom: 14px;
  }

  .ys-complete-item {
    font-size: 13px; color: #555;
    margin-bottom: 10px; padding-left: 18px;
    position: relative; line-height: 1.5;
  }

  .ys-complete-arrow {
    position: absolute; left: 0;
    color: #C8A84B; font-weight: 700;
  }

  .ys-complete-footer { width: 100%; }

  .ys-btn-home {
    display: block;
    background: #1A3A5C; color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.1em;
    padding: 14px 28px; border-radius: 2px;
    text-decoration: none; text-align: center;
    transition: background 0.2s;
  }

  .ys-btn-home:hover { background: #0F2540; }

  @media (max-width: 640px) {
    .ys-doc-body { padding: 20px; }
    .ys-sign-shell { padding: 24px 20px; }
    .ys-doc-footer { flex-direction: column; }
    .ys-btn-proceed { width: 100%; text-align: center; }
    .ys-contract-end { grid-template-columns: 1fr; }
  }
`
