import type { Business, SectionOf } from '@yakini/site-schema'
import { DAY_NAMES, DAY_ORDER, DraftHint, HeadTxt, Txt, formatPhone, timeRange, type RenderContext } from '../context'
import { Heading } from './heading'

type Address = NonNullable<Business['address']>

/** Plain directions link (no map embed, R2). */
export function mapsUrl(a: Address): string {
  const q = [a.line1, a.line2, a.city, a.region, a.postal].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function HoursLocationSection({ ctx, s, first }: { ctx: RenderContext; s: SectionOf<'hours_location'>; first: boolean }) {
  const b = ctx.doc.business
  const hours = b.hours ?? []
  const closedToday = ctx.today && (ctx.today.kind === 'closed' || ctx.today.kind === 'off')
  const directions = s.props.directionsUrl ?? (b.address ? mapsUrl(b.address) : null)
  const hasAnything = hours.length > 0 || b.address || b.phone || b.serviceArea
  if (!hasAnything && ctx.mode !== 'draft') return null
  return (
    <section className={`ys-s ys-hours ys-v-${s.variant}`} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap ys-hours-grid">
        <div className="ys-hours-copy">
          <Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading>
          {closedToday ? <p className="ys-today-flag" role="status">{ctx.today!.headline}</p> : null}
          {hours.length > 0 ? (
            <table className="ys-hours-table">
              <caption className="ys-sr">Opening hours</caption>
              <tbody>
                {DAY_ORDER.map((d) => {
                  const h = hours.filter((x) => x.day === d)
                  if (h.length === 0) return null
                  return (
                    <tr key={d}>
                      <th scope="row">{DAY_NAMES[d]}</th>
                      <td>{h.map((x) => ('closed' in x ? 'Closed' : timeRange(x.open, x.close))).join(', ')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : <DraftHint ctx={ctx}>Add your opening hours</DraftHint>}
          {s.props.note ? <p className="ys-note"><Txt>{s.props.note}</Txt></p> : null}
        </div>
        <div className="ys-hours-place">
          {b.address ? (
            <address>
              <span className="ys-label">Address</span>
              {b.address.line1}{b.address.line2 ? `, ${b.address.line2}` : ''}<br />
              {b.address.city}, {b.address.region} {b.address.postal}
            </address>
          ) : b.serviceArea ? (
            <p><span className="ys-label">Where we serve</span>{b.serviceArea}</p>
          ) : <DraftHint ctx={ctx}>Add your address or the area you serve</DraftHint>}
          {b.phone ? <p><span className="ys-label">Phone</span><a href={`tel:${b.phone}`}>{formatPhone(b.phone)}</a></p> : null}
          {directions ? <a className="ys-btn ys-btn-outline" href={directions} rel="noopener noreferrer">Get directions</a> : null}
        </div>
      </div>
    </section>
  )
}
