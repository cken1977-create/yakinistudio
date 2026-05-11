// VIZIONZ SANKOFA · /get-help · GetHelpForm
// Client component handling the intake form lifecycle.
// Four states: idle (form), submitting, success, error.

'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { submitIntakeRequest } from './actions'

type FormState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; firstName: string }
  | { kind: 'error'; message: string }

const REQUEST_TYPES: { value: string; label: string }[] = [
  { value: 'food_assistance', label: 'Food assistance' },
  { value: 'family_support', label: 'Family support' },
  {
    value: 'refugee_immigrant_services',
    label: 'Refugee & immigrant services',
  },
  { value: 'education', label: 'Education support' },
  { value: 'housing', label: 'Housing' },
  { value: 'other', label: 'Other' },
]

export function GetHelpForm() {
  const [state, setState] = useState<FormState>({ kind: 'idle' })
  const [isPending, startTransition] = useTransition()

  // Form field state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [requestType, setRequestType] = useState('')
  const [details, setDetails] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!consentGiven) {
      setState({
        kind: 'error',
        message:
          'Please check the consent box so we can reach out about your request.',
      })
      return
    }

    setState({ kind: 'submitting' })

    startTransition(async () => {
      const result = await submitIntakeRequest({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        request_type: requestType,
        details: details.trim() || null,
        consent_given: consentGiven,
      })

      if (!result.ok) {
        setState({
          kind: 'error',
          message:
            result.error ??
            'Something went wrong submitting your request. Please try again or call us directly.',
        })
        return
      }

      const firstName = fullName.trim().split(/\s+/)[0] || 'friend'
      setState({ kind: 'success', firstName })
    })
  }

  function resetForm() {
    setFullName('')
    setEmail('')
    setPhone('')
    setRequestType('')
    setDetails('')
    setConsentGiven(false)
    setState({ kind: 'idle' })
  }

  if (state.kind === 'success') {
    return <SuccessCard firstName={state.firstName} onReset={resetForm} />
  }

  const disabled = isPending || state.kind === 'submitting'

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Section title="About you">
        <Field label="Full name" required htmlFor="full_name">
          <input
            id="full_name"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={disabled}
            style={inputStyle}
          />
        </Field>

        <Field label="Email" required htmlFor="email">
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled}
            style={inputStyle}
          />
        </Field>

        <Field label="Phone" optional htmlFor="phone">
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={disabled}
            placeholder="(505) 555-1234"
            style={inputStyle}
          />
        </Field>
      </Section>

      <Section title="What you need">
        <Field label="What can we help with?" required htmlFor="request_type">
          <select
            id="request_type"
            required
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            disabled={disabled}
            style={{
              ...inputStyle,
              appearance: 'auto',
              cursor: 'pointer',
            }}
          >
            <option value="" disabled>
              Select an area of support…
            </option>
            {REQUEST_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tell us more" optional htmlFor="details">
          <textarea
            id="details"
            rows={5}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            disabled={disabled}
            placeholder="Anything we should know — what you're going through, what kind of help you're hoping for, when you'd like to hear back. The more we know, the better we can show up."
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '120px',
              fontFamily: 'inherit',
            }}
          />
        </Field>
      </Section>

      <Section title="Consent">
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: disabled ? 'wait' : 'pointer',
            padding: '14px 16px',
            background: '#FFFFFF',
            border: `1px solid ${
              consentGiven ? '#007A33' : 'rgba(10, 10, 10, 0.15)'
            }`,
            borderRadius: '2px',
            transition: 'border-color 0.15s ease',
          }}
        >
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            disabled={disabled}
            style={{
              marginTop: '3px',
              accentColor: '#007A33',
              cursor: disabled ? 'wait' : 'pointer',
            }}
            required
          />
          <span
            style={{
              fontSize: '14px',
              lineHeight: 1.55,
              color: '#0A0A0A',
            }}
          >
            I consent to Vizionz Sankofa contacting me about my request and
            storing what I&apos;ve shared securely. I can ask to have my
            information removed at any time.
          </span>
        </label>
      </Section>

      {state.kind === 'error' && (
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(206, 17, 38, 0.08)',
            borderLeft: '3px solid #CE1126',
            fontSize: '14px',
            color: '#0A0A0A',
            marginBottom: '20px',
          }}
        >
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled}
        style={{
          width: '100%',
          padding: '18px 32px',
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#FFFFFF',
          background: '#0A2548',
          border: 'none',
          borderRadius: '2px',
          cursor: disabled ? 'wait' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'opacity 0.15s ease',
        }}
      >
        {state.kind === 'submitting' ? 'Sending your request…' : 'Send request'}
      </button>
    </form>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: '32px' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.55)',
          marginBottom: '16px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </section>
  )
}

function Field({
  label,
  required,
  optional,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: '#0A0A0A',
          marginBottom: '6px',
        }}
      >
        {label}
        {required && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#CE1126',
            }}
          >
            Required
          </span>
        )}
        {optional && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(10, 10, 10, 0.4)',
            }}
          >
            Optional
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

function SuccessCard({
  firstName,
  onReset,
}: {
  firstName: string
  onReset: () => void
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 122, 51, 0.3)',
        borderLeft: '4px solid #007A33',
        borderRadius: '2px',
        padding: '32px 28px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#007A33',
          marginBottom: '12px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        Request received
      </div>

      <h2
        style={{
          fontSize: '24px',
          lineHeight: 1.25,
          fontWeight: 600,
          color: '#0A0A0A',
          marginBottom: '14px',
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        Thank you, {firstName}.
      </h2>

      <p
        style={{
          fontSize: '15px',
          lineHeight: 1.65,
          color: 'rgba(10, 10, 10, 0.7)',
          marginBottom: '20px',
        }}
      >
        We&apos;ve received your request. Someone from Vizionz Sankofa will
        reach out within 48 hours by phone or email. If your situation
        changes before then, you can submit another request and we&apos;ll
        bring it together.
      </p>

      <button
        type="button"
        onClick={onReset}
        style={{
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#CE1126',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        Submit another request →
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: '15px',
  color: '#0A0A0A',
  background: '#FFFFFF',
  border: '1px solid rgba(10, 10, 10, 0.2)',
  borderRadius: '2px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}
