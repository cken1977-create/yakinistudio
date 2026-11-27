import type { FormField, SectionOf } from '@yakini/site-schema'
import { HeadTxt, Txt, formatPhone, type RenderContext } from '../context'
import { Heading } from './heading'

/** The form a booking section posts (spec 11.3: request mode until portal booking, Phase 6). */
export const BOOKING_FORM_KEY = 'booking-request'
/** Honeypot field name (spec 11.3). People never see it; a bot that fills it is refused. */
export const HONEYPOT_FIELD = 'company_website'

type FieldSpec = { label: string; type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea'; autoComplete?: string; inputMode?: 'tel' | 'email' | 'numeric' }

/** Labels and input types for the allowed field set (spec 7.2). */
const FIELDS: Record<FormField, FieldSpec> = {
  name: { label: 'Your name', type: 'text', autoComplete: 'name' },
  email: { label: 'Email', type: 'email', autoComplete: 'email', inputMode: 'email' },
  phone: { label: 'Phone', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
  message: { label: 'Message', type: 'textarea' },
  event_date: { label: 'Event date', type: 'date' },
  guest_count: { label: 'Number of guests', type: 'number', inputMode: 'numeric' },
  service: { label: 'What are you interested in?', type: 'text' },
}

/** Name is required; with both email and phone, either one will do, so neither is required. */
function isRequired(field: FormField, fields: readonly FormField[]): boolean {
  if (field === 'name') return true
  if (field === 'email') return !fields.includes('phone')
  if (field === 'phone') return !fields.includes('email')
  return false
}

function FormSection({ ctx, s, first }: { ctx: RenderContext; s: SectionOf<'contact_form'> | SectionOf<'catering_request'>; first: boolean }) {
  const p = s.props
  const action = ctx.formAction(p.formKey)
  const wide = s.variant === 'with-details'
  const b = ctx.doc.business
  return (
    <section className={`ys-s ys-form ys-${s.type.replace('_', '-')} ys-v-${s.variant}`} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className={`ys-wrap ${wide ? 'ys-form-grid' : 'ys-narrow'}`}>
        <div className="ys-section-head">
          <Heading first={first} id={`${s.id}-h`}><HeadTxt>{p.heading}</HeadTxt></Heading>
          {p.intro ? <p className="ys-lead"><Txt>{p.intro}</Txt></p> : null}
          {wide && (b.phone || b.email) ? (
            <ul className="ys-contact-points">
              {b.phone ? <li><span className="ys-label">Call</span><a href={`tel:${b.phone}`}>{formatPhone(b.phone)}</a></li> : null}
              {b.email ? <li><span className="ys-label">Email</span><a href={`mailto:${b.email}`}>{b.email}</a></li> : null}
            </ul>
          ) : null}
        </div>
        <FormBody ctx={ctx} idBase={s.id} action={action} fields={p.fields} consent={p.consentText} submitLabel={p.submitLabel} />
      </div>
    </section>
  )
}

/** The fields, hidden spam checks and button of every site form. Works with JavaScript off. */
function FormBody({ ctx, idBase, action, fields, consent, submitLabel, labels = {} }: {
  ctx: RenderContext; idBase: string; action: string | null; fields: readonly FormField[]; consent: string; submitLabel: string
  labels?: Partial<Record<FormField, string>>
}) {
  const fid = (f: string) => `${idBase}-${f}`
  return (
    <form className="ys-form-body" method="post" action={action ?? undefined} aria-describedby={`${idBase}-consent`}>
      {fields.map((f) => {
        const spec = FIELDS[f]
        const req = isRequired(f, fields)
        return (
          <div key={f} className={`ys-field${spec.type === 'textarea' ? ' ys-field-wide' : ''}`}>
            <label htmlFor={fid(f)}>{labels[f] ?? spec.label}{req ? null : <span className="ys-optional"> (optional)</span>}</label>
            {spec.type === 'textarea'
              ? <textarea id={fid(f)} name={f} rows={5} maxLength={2000} required={req} disabled={!action} />
              : <input id={fid(f)} name={f} type={spec.type} autoComplete={spec.autoComplete} inputMode={spec.inputMode}
                  required={req} disabled={!action} maxLength={spec.type === 'number' ? undefined : 200}
                  min={spec.type === 'number' ? 1 : undefined} max={spec.type === 'number' ? 10000 : undefined} />}
          </div>
        )
      })}
      {action ? (
        <>
          {/* Honeypot for bots (spec 11.3). Hidden from people and assistive tech. */}
          <div className="ys-hp" aria-hidden="true">
            <label htmlFor={fid(HONEYPOT_FIELD)}>Leave this empty</label>
            <input id={fid(HONEYPOT_FIELD)} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
          </div>
          {ctx.formStamp ? <input type="hidden" name="ts" value={ctx.formStamp} /> : null}
        </>
      ) : null}
      <p className="ys-consent" id={`${idBase}-consent`}><Txt>{consent}</Txt></p>
      <button type="submit" className="ys-btn ys-btn-primary" disabled={!action}>{submitLabel}</button>
      {!action && ctx.mode === 'draft' ? <p className="ys-form-note" role="note">Forms start working once your site is published.</p> : null}
    </form>
  )
}

export const ContactFormSection = FormSection
export const CateringRequestSection = FormSection

/**
 * Booking (spec 7.2, 11.3). Until portal booking arrives (Phase 6) a booking section is a short
 * booking-request form that lands with the site's other messages.
 */
const BOOKING_FIELDS: readonly FormField[] = ['name', 'email', 'phone', 'event_date', 'message']

export function BookingSection({ ctx, s, first }: { ctx: RenderContext; s: SectionOf<'booking'>; first: boolean }) {
  const action = ctx.formAction(BOOKING_FORM_KEY)
  return (
    <section className={`ys-s ys-form ys-booking ys-v-${s.variant}`} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap ys-narrow">
        <div className="ys-section-head">
          <Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading>
          {s.props.body ? <p className="ys-lead"><Txt>{s.props.body}</Txt></p> : null}
        </div>
        <FormBody ctx={ctx} idBase={s.id} action={action} fields={BOOKING_FIELDS}
          labels={{ event_date: 'Preferred date', message: 'Anything we should know?' }}
          consent="We’ll get back to you to confirm a time."
          submitLabel={s.props.buttonLabel || 'Request a time'} />
      </div>
    </section>
  )
}
