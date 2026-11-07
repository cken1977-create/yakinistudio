// ═════════════════════════════════════════════════════════════════════════
// NEWSLETTER — Email signup strip
// ═════════════════════════════════════════════════════════════════════════
// Light gray-shadow ground, bordered top and bottom, sits between
// CTABands and Footer as a quiet final invitation. Two-column layout:
// left has headline and body copy, right has email input + button.
//
// On submit: posts to /api/lead with kind='newsletter'. The address is
// saved on the staff request list. No email is sent from this form.
//
// Mobile: stacks vertically with form below text.
// ═════════════════════════════════════════════════════════════════════════

'use client'

import { useState, FormEvent } from 'react'
import type { BrandConfig } from '@yakini/config'
import { savedMessage, type WebsiteSaveResult } from '@/lib/contact/public-message'
import { VS_RED, VS_INK } from './TriColorRule'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function Newsletter({ config }: { config: BrandConfig }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [notice, setNotice] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || status === 'sending') return
    setStatus('sending')
    setNotice('Saving your email…')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'newsletter', email: email.trim() }),
      })
      const body = await res.json().catch(() => null) as WebsiteSaveResult | null
      if (!res.ok || !body?.ok || !body.saved || body.emailSent) {
        setStatus('error')
        setNotice(body && 'error' in body && body.error ? body.error : 'We could not save this. Nothing was sent.')
        return
      }
      setStatus('sent')
      setNotice(savedMessage(body, 'newsletter'))
      setEmail('')
    } catch {
      setStatus('error')
      setNotice(`We could not save this. Nothing was sent. You can email ${config.contact.email}.`)
    }
  }

  return (
    <>
      <style>{`
        .vs-newsletter {
          padding: 4rem 0;
          background: #F2F2F2;
          border-block: 1px solid #E5E5E5;
        }
        .vs-newsletter-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 2.5rem;
        }
        .vs-newsletter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .vs-newsletter-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.875rem;
          font-weight: 500;
          line-height: 1.15;
          letter-spacing: -0.012em;
          color: ${VS_INK};
          margin: 0 0 0.5rem;
        }
        .vs-newsletter-body {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1rem;
          color: #4A4A4A;
          line-height: 1.55;
          margin: 0;
        }

        .vs-newsletter-form {
          display: flex;
          gap: 0.75rem;
        }
        .vs-newsletter-input {
          flex: 1;
          padding: 0.875rem 1rem;
          border: 1px solid #BFBFBF;
          background: #FFFFFF;
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1rem;
          border-radius: 2px;
          color: ${VS_INK};
          transition: border-color 200ms ease, box-shadow 200ms ease;
          outline: none;
        }
        .vs-newsletter-input:focus {
          border-color: ${VS_RED};
          box-shadow: 0 0 0 3px rgba(206, 17, 38, 0.12);
        }
        .vs-newsletter-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .vs-newsletter-button {
          padding: 0.875rem 1.5rem;
          background: ${VS_RED};
          color: #FFFFFF;
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.8125rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          transition: all 200ms ease;
          white-space: nowrap;
          box-shadow: 0 2px 10px rgba(206, 17, 38, 0.22);
        }
        .vs-newsletter-button:hover:not(:disabled) {
          background: #A20D1E;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(206, 17, 38, 0.32);
        }
        .vs-newsletter-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .vs-newsletter-status {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.9375rem;
          margin-top: 0.75rem;
          line-height: 1.5;
        }
        .vs-newsletter-status.error {
          color: #A20D1E;
        }

        .vs-newsletter-confirmation {
          padding: 1.25rem 1.5rem;
          background: #FFFFFF;
          border-left: 4px solid #007A33;
          border-radius: 2px;
        }
        .vs-newsletter-confirmation-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: ${VS_INK};
          margin: 0 0 0.25rem;
        }
        .vs-newsletter-confirmation-body {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 0.9375rem;
          color: #4A4A4A;
          margin: 0;
          line-height: 1.55;
        }

        @media (max-width: 800px) {
          .vs-newsletter { padding: 3rem 0; }
          .vs-newsletter-inner { padding: 0 1.5rem; }
          .vs-newsletter-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
        @media (max-width: 500px) {
          .vs-newsletter-form {
            flex-direction: column;
          }
        }
      `}</style>

      <section className="vs-newsletter" aria-label="Newsletter signup">
        <div className="vs-newsletter-inner">
          <div className="vs-newsletter-grid">
            <div>
              <h3 className="vs-newsletter-headline">Stay in the Know</h3>
              <p className="vs-newsletter-body">
                Monthly updates on programs, food distributions, events, and how the coalition is growing.
              </p>
            </div>

            {status === 'sent' ? (
              <div className="vs-newsletter-confirmation" role="status">
                <p className="vs-newsletter-confirmation-headline">Saved.</p>
                <p className="vs-newsletter-confirmation-body">{notice}</p>
              </div>
            ) : (
              <form className="vs-newsletter-form" onSubmit={submit}>
                <input
                  type="email"
                  className="vs-newsletter-input"
                  placeholder="your@email.com"
                  aria-label="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={status === 'sending'}
                />
                <button
                  type="submit"
                  className="vs-newsletter-button"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? 'Saving…' : 'Save email'}
                </button>
              </form>
            )}

            {status === 'sending' && <p className="vs-newsletter-status" role="status">{notice}</p>}
            {status === 'error' && (
              <p className="vs-newsletter-status error" role="alert">{notice}</p>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
