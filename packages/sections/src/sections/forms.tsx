import type { FormField, SectionOf } from '@yakini/site-schema'
import { Txt, firstForm, formatPhone, type RenderContext } from '../context'
import { Heading } from './heading'

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
  const fid = (f: string) => `${s.id}-${f}`
  const wide = s.variant === 'with-details'
  const b = ctx.doc.business
  return (
    <section className={`ys-s ys-form ys-${s.type.replace('_', '-')} ys-v-${s.variant}`} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className={`ys-wrap ${wide ? 'ys-form-grid' : 'ys-narrow'}`}>
        <div className="ys-section-head">
          <Heading first={first} id={`${s.id}-h`}><Txt>{p.heading}</Txt></Heading>
          {p.intro ? <p className="ys-lead"><Txt>{p.intro}</Txt></p> : null}
          {wide && (b.phone || b.email) ? (
            <ul className="ys-contact-points">
              {b.phone ? <li><span className="ys-label">Call</span><a href={`tel:${b.phone}`}>{formatPhone(b.phone)}</a></li> : null}
              {b.email ? <li><span className="ys-label">Email</span><a href={`mailto:${b.email}`}>{b.email}</a></li> : null}
            </ul>
          ) : null}
        </div>
        <form className="ys-form-body" method="post" action={action ?? undefined} aria-describedby={`${s.id}-consent`}>
          {p.fields.map((f) => {
            const spec = FIELDS[f]
            const req = isRequired(f, p.fields)
            return (
              <div key={f} className={`ys-field${spec.type === 'textarea' ? ' ys-field-wide' : ''}`}>
                <label htmlFor={fid(f)}>{spec.label}{req ? null : <span className="ys-optional"> (optional)</span>}</label>
                {spec.type === 'textarea'
                  ? <textarea id={fid(f)} name={f} rows={5} maxLength={2000} required={req} disabled={!action} />
                  : <input id={fid(f)} name={f} type={spec.type} autoComplete={spec.autoComplete} inputMode={spec.inputMode}
                      required={req} disabled={!action} maxLength={spec.type === 'number' ? undefined : 200}
                      min={spec.type === 'number' ? 1 : undefined} max={spec.type === 'number' ? 10000 : undefined} />}
              </div>
            )
          })}
          {action ? (
            // Honeypot for bots (spec 14.4). Hidden from people and assistive tech.
            <div className="ys-hp" aria-hidden="true">
              <label htmlFor={fid('website')}>Leave this empty</label>
              <input id={fid('website')} name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
          ) : null}
          <p className="ys-consent" id={`${s.id}-consent`}><Txt>{p.consentText}</Txt></p>
          <button type="submit" className="ys-btn ys-btn-primary" disabled={!action}>{p.submitLabel}</button>
          {!action && ctx.mode === 'draft' ? <p className="ys-form-note" role="note">Forms start working once your site is published.</p> : null}
        </form>
      </div>
    </section>
  )
}

export const ContactFormSection = FormSection
export const CateringRequestSection = FormSection

/**
 * Booking (spec 7.2). Portal booking arrives in Phase 6; until then the button takes the visitor
 * to the site's contact form, or to the phone when there is no form.
 */
export function BookingSection({ ctx, s, first }: { ctx: RenderContext; s: SectionOf<'booking'>; first: boolean }) {
  const form = firstForm(ctx.doc)
  const phone = ctx.doc.business.phone
  const href = form
    ? `${form.page.id === ctx.page.id ? '' : ctx.hrefForPage(form.page)}#${form.sectionId}`
    : phone ? `tel:${phone}` : null
  return (
    <section className={`ys-s ys-booking ys-v-${s.variant}`} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap">
        <div className="ys-booking-card">
          <div>
            <Heading first={first} id={`${s.id}-h`}><Txt>{s.props.heading}</Txt></Heading>
            {s.props.body ? <p><Txt>{s.props.body}</Txt></p> : null}
          </div>
          {href ? <a className="ys-btn ys-btn-primary" href={href}>{s.props.buttonLabel || (s.props.mode === 'link' ? 'Book now' : 'Request a time')}</a> : null}
        </div>
      </div>
    </section>
  )
}
