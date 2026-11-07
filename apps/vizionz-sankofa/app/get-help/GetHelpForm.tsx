// VIZIONZ SANKOFA · /get-help · GetHelpForm
// Client component handling the intake form lifecycle.
// Four states: idle (form), submitting, success, error.

'use client'

import { useRef, useState, type FormEvent } from 'react'
import { submitIntakeRequest } from './actions'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { decideSupportFile, intakeFilePath, validateIntake } from '@/lib/programs/apply'

type HelpProgram = {
  slug: string
  name: string
  public_description: string | null
  who_we_serve: string | null
  eligibility_criteria: string | null
  duration_description: string | null
}

type FormState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; firstName: string; reference: string; programName: string | null; fileSaved: boolean }
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

export function GetHelpForm({
  program = null,
  programMissing = false,
}: {
  program?: HelpProgram | null
  programMissing?: boolean
}) {
  const [state, setState] = useState<FormState>({ kind: 'idle' })
  const [statusText, setStatusText] = useState<string | null>(null)
  const [supportFile, setSupportFile] = useState<File | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const requestId = useRef(crypto.randomUUID())
  const busy = useRef(false)

  // Form field state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [requestType, setRequestType] = useState('')
  const [details, setDetails] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    const problem = validateIntake({
      full_name: fullName,
      email: email,
      phone,
      request_type: requestType,
      details,
      consent_given: consentGiven,
    })
    if (problem) {
      setState({ kind: 'error', message: problem })
      return
    }
    if (supportFile) {
      const fileCheck = decideSupportFile(supportFile)
      if (!fileCheck.ok) {
        setState({ kind: 'error', message: fileCheck.reason })
        return
      }
    }
    busy.current = true
    setState({ kind: 'submitting' })
    setStatusText('Sending your request…')
    let intakeId = savedId
    let programName = program?.name ?? null
    if (!intakeId) {
      const result = await submitIntakeRequest({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        request_type: requestType,
        details: details.trim() || null,
        consent_given: consentGiven,
        program_slug: program?.slug ?? null,
        client_request_id: requestId.current,
      })
      if (!result.ok) {
        busy.current = false
        setStatusText(null)
        setState({ kind: 'error', message: result.error })
        return
      }
      intakeId = result.id
      setSavedId(result.id)
      programName = result.programName
    }
    let fileSaved = false
    if (supportFile) {
      const fileCheck = decideSupportFile(supportFile)
      if (!fileCheck.ok) {
        busy.current = false
        setStatusText(null)
        setState({ kind: 'error', message: `${fileCheck.reason} Your request was saved. Reference ${intakeId}. Your answers are still here.` })
        return
      }
      setStatusText(`Uploading ${supportFile.name}…`)
      const path = intakeFilePath(intakeId, supportFile.name, crypto.randomUUID())
      const supabase = createBrowserClient()
      const { error: uploadError } = await supabase.storage.from('vs-intake-files').upload(path, supportFile, {
        contentType: fileCheck.contentType,
        upsert: false,
      })
      if (uploadError) {
        busy.current = false
        setStatusText(null)
        setState({ kind: 'error', message: `Your request was saved. Reference ${intakeId}. The file was not stored (${uploadError.message}). Your answers are still here so you can try the file again.` })
        return
      }
      setStatusText('Saving the file with your request…')
      const { data: attached, error: attachError } = await supabase.rpc('vs_attach_intake_file', {
        p_intake: intakeId,
        p_path: path,
        p_name: supportFile.name,
        p_mime: fileCheck.contentType,
        p_size: supportFile.size,
      })
      const attachedOk = attached && typeof attached === 'object' && (attached as { ok?: boolean }).ok === true
      if (attachError || !attachedOk) {
        busy.current = false
        setStatusText(null)
        setState({ kind: 'error', message: `Your request was saved. Reference ${intakeId}. The file was not attached (${attachError?.message ?? 'the file record was refused'}). Your answers are still here.` })
        return
      }
      fileSaved = true
    }
    busy.current = false
    setStatusText(null)
    const firstName = fullName.trim().split(/\s+/)[0] || 'friend'
    setState({ kind: 'success', firstName, reference: intakeId, programName, fileSaved })
  }

  function resetForm() {
    setFullName('')
    setEmail('')
    setPhone('')
    setRequestType('')
    setDetails('')
    setConsentGiven(false)
    setSupportFile(null)
    setSavedId(null)
    requestId.current = crypto.randomUUID()
    setState({ kind: 'idle' })
  }

  if (state.kind === 'success') {
    return <SuccessCard firstName={state.firstName} reference={state.reference} programName={state.programName} fileSaved={state.fileSaved} onReset={resetForm} />
  }

  const disabled = busy.current || state.kind === 'submitting'

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      {program && (
        <section style={{ marginBottom: '28px', padding: '16px 18px', background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.1)', borderRadius: '2px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#CE1126', fontWeight: 600, marginBottom: '8px' }}>Applying for</div>
          <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '24px', margin: '0 0 8px' }}>{program.name}</h2>
          {program.public_description && <p style={{ margin: '0 0 8px', lineHeight: 1.5 }}>{program.public_description}</p>}
          {program.who_we_serve && <p style={{ margin: '0 0 8px', lineHeight: 1.5 }}><strong>Who we serve. </strong>{program.who_we_serve}</p>}
          {program.eligibility_criteria && <p style={{ margin: '0 0 8px', lineHeight: 1.5 }}><strong>Eligibility. </strong>{program.eligibility_criteria}</p>}
          {program.duration_description && <p style={{ margin: 0, lineHeight: 1.5 }}><strong>Duration. </strong>{program.duration_description}</p>}
          <p style={{ margin: '10px 0 0', fontSize: '13px', color: 'rgba(10,10,10,0.65)' }}>This is the same Get Help form. There is not a separate application for each program. Your request is saved for staff review with this program named on it.</p>
        </section>
      )}
      {programMissing && (
        <p role="alert" style={{ color: '#CE1126', marginTop: 0 }}>That program link is not valid. Nothing was saved. You can still send a general request below.</p>
      )}
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

      <Section title="Supporting document">
        <Field label="File" optional htmlFor="support_file">
          <input
            id="support_file"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            disabled={disabled}
            onChange={(e) => setSupportFile(e.target.files?.[0] ?? null)}
            style={inputStyle}
          />
        </Field>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(10,10,10,0.65)' }}>
          Optional. A JPG, PNG, or PDF up to 10 MB, stored privately with this request. Staff can open it when they review your request. It is not shown on the public site.
          {supportFile ? ` Selected: ${supportFile.name}.` : ''}
        </p>
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

      {statusText && (
        <p role="status" aria-live="polite" style={{ fontWeight: 600, marginBottom: '12px' }}>{statusText}</p>
      )}

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
  reference,
  programName,
  fileSaved,
  onReset,
}: {
  firstName: string
  reference: string
  programName: string | null
  fileSaved: boolean
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
        We&apos;ve received your request{programName ? ` for ${programName}` : ''}. Reference {reference}. Someone from Vizionz Sankofa will
        reach out within 48 hours by phone or email.
        {fileSaved ? ' Your file was stored with the request.' : ' No file was stored with this request.'}
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
