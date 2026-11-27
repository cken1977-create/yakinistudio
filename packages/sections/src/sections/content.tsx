import { plainText, type SectionOf, type SectionType } from '@yakini/site-schema'
import { DAY_NAMES, DAY_ORDER, DraftHint, Img, Link, RichTextView, HeadTxt, Txt, timeRange, type RenderContext, showEmpty } from '../context'
import { Heading } from './heading'
import { Icon } from './icons'

type P<T extends SectionType> = { ctx: RenderContext; s: SectionOf<T>; first: boolean }

const wrap = (s: { id: string; type: string; variant: string }, extra = '') => ({
  id: s.id,
  className: `ys-s ys-${s.type.replace('_', '-')} ys-v-${s.variant}${extra ? ` ${extra}` : ''}`,
  'aria-labelledby': `${s.id}-h`,
})

/**
 * Up to two facts for the cinematic hero's floating badges, taken only from the business's own
 * details (never invented): what it offers (its first services list) and where it is.
 */
export function heroFacts(doc: RenderContext['doc']): string[] {
  const out: string[] = []
  const services = doc.pages.flatMap((p) => p.sections).find((x) => x.type === 'services' && !x.hidden && x.props.items.length > 0)
  if (services && services.type === 'services') {
    const titles = services.props.items.map((i) => i.title.trim()).filter((t) => t && !t.includes('[[')).slice(0, 3)
    if (titles.length) out.push(titles.join(' · '))
  }
  const a = doc.business.address
  if (a?.city) out.push(a.region ? `${a.city}, ${a.region}` : a.city)
  return out.slice(0, 2)
}

/**
 * Cinematic hero (design v2, plan D1 step 4): a full-bleed photo framed 4:5 on a phone and 16:9 on
 * a desktop around the photo's focal point, a layered scrim, the display headline with its accent
 * phrase, a glowing primary and a ghost CTA, and up to two fact badges. With no photo it becomes a
 * typographic hero: a large ghosted initial and a glow on the surface, never a flat panel.
 */
function CinematicHero({ ctx, s, first }: P<'hero'>) {
  const p = s.props
  const img = p.image && ctx.image(p.image.assetId) ? p.image : undefined
  const facts = heroFacts(ctx.doc)
  const initial = ctx.doc.business.name.trim().charAt(0).toUpperCase()
  return (
    <section {...wrap(s, img ? 'has-img' : 'no-img')}>
      {img ? (
        <div className="ys-cine-media">
          <Img ctx={ctx} image={img} className="ys-cine-img" sizes="100vw" priority={first} />
        </div>
      ) : <span className="ys-cine-initial" aria-hidden="true">{initial}</span>}
      <div className="ys-cine-scrim" aria-hidden="true" />
      <div className="ys-wrap ys-cine-inner">
        <div className="ys-hero-copy ys-cine-copy">
          {p.eyebrow ? <p className="ys-eyebrow"><Txt>{p.eyebrow}</Txt></p> : null}
          <Heading first={first} id={`${s.id}-h`} className="ys-display ys-cine-headline"><HeadTxt>{p.headline}</HeadTxt></Heading>
          {p.subhead ? <p className="ys-lead"><Txt>{p.subhead}</Txt></p> : null}
          {p.primaryCta || p.secondaryCta ? (
            <div className="ys-actions">
              {p.primaryCta ? <Link ctx={ctx} to={p.primaryCta.target} className="ys-btn ys-btn-primary">{p.primaryCta.label}</Link> : null}
              {p.secondaryCta ? <Link ctx={ctx} to={p.secondaryCta.target} className="ys-btn ys-btn-ghost">{p.secondaryCta.label}</Link> : null}
            </div>
          ) : null}
        </div>
        {facts.length ? (
          <ul className="ys-cine-facts" aria-label="At a glance">
            {facts.map((f) => <li key={f} className="ys-cine-fact">{f}</li>)}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export function HeroSection({ ctx, s, first }: P<'hero'>) {
  if (s.variant === 'cinematic') return <CinematicHero ctx={ctx} s={s} first={first} />
  const p = s.props
  const img = p.image && ctx.image(p.image.assetId) ? p.image : undefined
  const variant = s.variant === 'fullbleed' && !img ? 'minimal' : s.variant
  return (
    <section {...wrap({ ...s, variant }, img ? 'has-img' : 'no-img')}>
      {variant === 'fullbleed' && img ? <Img ctx={ctx} image={img} className="ys-hero-bg" sizes="100vw" priority={first} /> : null}
      <div className="ys-wrap ys-hero-inner">
        <div className="ys-hero-copy">
          {p.eyebrow ? <p className="ys-eyebrow"><Txt>{p.eyebrow}</Txt></p> : null}
          <Heading first={first} id={`${s.id}-h`} className="ys-display"><HeadTxt>{p.headline}</HeadTxt></Heading>
          {p.subhead ? <p className="ys-lead"><Txt>{p.subhead}</Txt></p> : null}
          {p.primaryCta || p.secondaryCta ? (
            <div className="ys-actions">
              {p.primaryCta ? <Link ctx={ctx} to={p.primaryCta.target} className="ys-btn ys-btn-primary">{p.primaryCta.label}</Link> : null}
              {p.secondaryCta ? <Link ctx={ctx} to={p.secondaryCta.target} className="ys-btn ys-btn-ghost">{p.secondaryCta.label}</Link> : null}
            </div>
          ) : null}
        </div>
        {variant === 'split' ? (
          <div className="ys-hero-media">
            {img ? <Img ctx={ctx} image={img} className="ys-cover" sizes="(min-width: 900px) 50vw, 100vw" priority={first} /> : <div className="ys-hero-panel" aria-hidden="true" />}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function AboutSection({ ctx, s, first }: P<'about'>) {
  const img = s.variant !== 'text-only' && s.props.image && ctx.image(s.props.image.assetId) ? s.props.image : undefined
  return (
    <section {...wrap(s, img ? 'has-img' : 'no-img')}>
      <div className="ys-wrap ys-about-grid">
        <div className="ys-prose">
          <Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading>
          {s.props.body.length ? <RichTextView ctx={ctx} value={s.props.body} /> : <DraftHint ctx={ctx}>Tell your story here</DraftHint>}
        </div>
        {img ? <div className="ys-about-media"><Img ctx={ctx} image={img} className="ys-cover" sizes="(min-width: 900px) 45vw, 100vw" /></div> : null}
      </div>
    </section>
  )
}

export function ServicesSection({ ctx, s, first }: P<'services'>) {
  const items = s.props.items
  if (!items.length && !showEmpty(ctx)) return null
  return (
    <section {...wrap(s)}>
      <div className="ys-wrap">
        <div className="ys-section-head">
          <Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading>
          {s.props.intro ? <p className="ys-lead"><Txt>{s.props.intro}</Txt></p> : null}
        </div>
        {items.length ? (
          <ul className="ys-services-list">
            {items.map((it, i) => (
              <li key={i} className="ys-service">
                {it.icon ? <span className="ys-service-icon"><Icon name={it.icon} /></span> : null}
                <div>
                  <h3 className="ys-h3"><Txt>{it.title}</Txt>{it.price ? <span className="ys-price"><Txt>{it.price}</Txt></span> : null}</h3>
                  {it.body ? <p><Txt>{it.body}</Txt></p> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : <DraftHint ctx={ctx}>Add the services you offer</DraftHint>}
      </div>
    </section>
  )
}

const TAG_LABELS = { veg: 'Vegetarian', spicy: 'Spicy', gf: 'Gluten-free' } as const

export function MenuSection({ ctx, s, first }: P<'menu'>) {
  const cats = s.props.categories.filter((c) => c.items.length > 0 || showEmpty(ctx))
  if (!cats.length && !showEmpty(ctx)) return null
  return (
    <section {...wrap(s)}>
      <div className="ys-wrap">
        <div className="ys-section-head">
          <Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading>
          {s.props.intro ? <p className="ys-lead"><Txt>{s.props.intro}</Txt></p> : null}
        </div>
        {cats.length ? cats.map((cat, ci) => (
          <div key={ci} className="ys-menu-cat">
            <h3 className="ys-menu-cat-name"><Txt>{cat.name}</Txt></h3>
            {cat.items.length ? (
              <ul className="ys-menu-items">
                {cat.items.map((it, ii) => {
                  const img = s.variant === 'cards' && it.image && ctx.image(it.image.assetId) ? it.image : undefined
                  return (
                    <li key={ii} className={`ys-menu-item${img ? ' has-img' : ''}`}>
                      {img ? <Img ctx={ctx} image={img} className="ys-menu-img" sizes="(min-width: 900px) 30vw, 100vw" /> : null}
                      <div className="ys-menu-body">
                        <p className="ys-menu-line">
                          <span className="ys-menu-name"><Txt>{it.name}</Txt></span>
                          {it.price ? <span className="ys-price"><Txt>{it.price}</Txt></span> : null}
                        </p>
                        {it.description ? <p className="ys-menu-desc"><Txt>{it.description}</Txt></p> : null}
                        {it.tags?.length ? (
                          <ul className="ys-tags" aria-label="Dietary notes">
                            {it.tags.map((t) => <li key={t}>{TAG_LABELS[t]}</li>)}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : <DraftHint ctx={ctx}>Add items to this part of the menu</DraftHint>}
          </div>
        )) : <DraftHint ctx={ctx}>Add your menu: dishes, short descriptions and prices</DraftHint>}
        {s.props.note && cats.length ? <p className="ys-note"><Txt>{s.props.note}</Txt></p> : null}
      </div>
    </section>
  )
}

export function ScheduleSection({ ctx, s, first }: P<'schedule'>) {
  const stops = [...s.props.stops].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.start.localeCompare(b.start))
  if (!stops.length && !showEmpty(ctx)) return null
  const off = ctx.today && ctx.today.kind === 'off'
  return (
    <section {...wrap(s)}>
      <div className="ys-wrap">
        <div className="ys-section-head">
          <Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading>
          {s.props.intro ? <p className="ys-lead"><Txt>{s.props.intro}</Txt></p> : null}
          {off ? <p className="ys-today-flag" role="status">{ctx.today!.headline}</p> : null}
        </div>
        {!stops.length ? <DraftHint ctx={ctx}>Add your weekly stops: day, times and place</DraftHint> : s.variant === 'week' ? (
          <ol className="ys-week">
            {DAY_ORDER.map((d) => {
              const today = stops.filter((x) => x.day === d)
              return (
                <li key={d} className={today.length ? 'is-on' : 'is-off'}>
                  <p className="ys-week-day">{DAY_NAMES[d]}</p>
                  {today.length ? today.map((x, i) => (
                    <p key={i} className="ys-week-stop">
                      <strong><Txt>{x.place}</Txt></strong>
                      <span>{timeRange(x.start, x.end)}</span>
                      {x.address ? <span className="ys-muted"><Txt>{x.address}</Txt></span> : null}
                    </p>
                  )) : <p className="ys-muted">No stop</p>}
                </li>
              )
            })}
          </ol>
        ) : (
          <ul className="ys-stops">
            {stops.map((x, i) => (
              <li key={i}>
                <p className="ys-stop-when"><strong>{DAY_NAMES[x.day]}</strong> {timeRange(x.start, x.end)}</p>
                <p className="ys-stop-where"><Txt>{x.place}</Txt>{x.address ? <span className="ys-muted">, <Txt>{x.address}</Txt></span> : null}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function GallerySection({ ctx, s, first }: P<'gallery'>) {
  const images = s.props.images.filter((im) => ctx.image(im.assetId))
  if (!images.length && !showEmpty(ctx)) return null
  return (
    <section {...wrap(s)}>
      <div className="ys-wrap">
        {s.props.heading ? <div className="ys-section-head"><Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading></div> : <span id={`${s.id}-h`} className="ys-sr">Photos</span>}
        {images.length ? (
          <ul className="ys-gallery-grid">
            {images.map((im, i) => <li key={i}><Img ctx={ctx} image={im} className={s.variant === 'grid' ? 'ys-cover' : undefined} sizes="(min-width: 900px) 33vw, 50vw" /></li>)}
          </ul>
        ) : <DraftHint ctx={ctx}>Add photos of your food and your place</DraftHint>}
      </div>
    </section>
  )
}

export function TestimonialsSection({ ctx, s, first }: P<'testimonials'>) {
  const items = s.props.items
  if (!items.length && !showEmpty(ctx)) return null
  const shown = s.variant === 'single' ? items.slice(0, 1) : items
  return (
    <section {...wrap(s)}>
      <div className="ys-wrap">
        {s.props.heading ? <div className="ys-section-head"><Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading></div> : <span id={`${s.id}-h`} className="ys-sr">Reviews</span>}
        {shown.length ? (
          <ul className="ys-quotes">
            {shown.map((q, i) => (
              <li key={i}>
                <figure className="ys-quote">
                  <blockquote><p><Txt>{q.quote}</Txt></p></blockquote>
                  <figcaption><Txt>{q.name}</Txt>{q.source ? <span className="ys-muted">, <Txt>{q.source}</Txt></span> : null}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        ) : <DraftHint ctx={ctx}>Add a few kind words from real customers (only ones they agreed to share)</DraftHint>}
      </div>
    </section>
  )
}

export function FaqSection({ ctx, s, first }: P<'faq'>) {
  const items = s.props.items
  if (!items.length && !showEmpty(ctx)) return null
  return (
    <section {...wrap(s)}>
      <div className="ys-wrap ys-narrow">
        {s.props.heading ? <div className="ys-section-head"><Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading></div> : <span id={`${s.id}-h`} className="ys-sr">Questions</span>}
        {items.length ? items.map((it, i) => (
          <details key={i} className="ys-faq-item">
            <summary><Txt>{it.q}</Txt></summary>
            <div className="ys-prose"><RichTextView ctx={ctx} value={it.a} /></div>
          </details>
        )) : <DraftHint ctx={ctx}>Add the questions people ask you most</DraftHint>}
      </div>
    </section>
  )
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')
}

export function TeamSection({ ctx, s, first }: P<'team'>) {
  const members = s.props.members
  if (!members.length && !showEmpty(ctx)) return null
  return (
    <section {...wrap(s)}>
      <div className="ys-wrap">
        {s.props.heading ? <div className="ys-section-head"><Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading></div> : <span id={`${s.id}-h`} className="ys-sr">Team</span>}
        {members.length ? (
          <ul className="ys-team-grid">
            {members.map((m, i) => (
              <li key={i} className="ys-person">
                {m.photo && ctx.image(m.photo.assetId)
                  ? <Img ctx={ctx} image={m.photo} className="ys-avatar" sizes="160px" />
                  : <span className="ys-avatar ys-avatar-initials" aria-hidden="true">{initials(m.name)}</span>}
                <p className="ys-person-name"><Txt>{m.name}</Txt></p>
                {m.role ? <p className="ys-muted"><Txt>{m.role}</Txt></p> : null}
                {m.bio ? <p className="ys-person-bio"><Txt>{m.bio}</Txt></p> : null}
              </li>
            ))}
          </ul>
        ) : <DraftHint ctx={ctx}>Introduce the people behind the food</DraftHint>}
      </div>
    </section>
  )
}

export function CtaBandSection({ ctx, s, first }: P<'cta_band'>) {
  return (
    <section {...wrap(s)}>
      <div className="ys-wrap ys-cta-inner">
        <div>
          <Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.headline}</HeadTxt></Heading>
          {s.props.body ? <p><Txt>{s.props.body}</Txt></p> : null}
        </div>
        <Link ctx={ctx} to={s.props.cta.target} className={`ys-btn ${s.variant === 'solid' ? 'ys-btn-on-primary' : 'ys-btn-primary'}`}>{s.props.cta.label}</Link>
      </div>
    </section>
  )
}

/**
 * Today (spec 7.2/11.5). Its content comes from the site's active Today update, never from the
 * SiteDoc. Phase 1 has no updates yet, so it shows its empty text or nothing.
 */
export function TodaySection({ ctx, s }: P<'today'>) {
  const t = ctx.today
  if (!t) {
    if (s.props.emptyBehavior === 'hide' || !s.props.emptyText) {
      if (!showEmpty(ctx)) return null
      // While editing the section stays findable (and clickable in the editor); the live site shows nothing.
      return (
        <section className={`ys-s ys-today ys-v-${s.variant} is-empty`} id={s.id} aria-label={plainText(s.props.heading || 'Today')}>
          <div className="ys-wrap"><p className="ys-hint">Your Today update shows here when you post one. Until then this section is hidden on your site.</p></div>
        </section>
      )
    }
    return (
      <section className={`ys-s ys-today ys-v-${s.variant} is-empty`} id={s.id} aria-label={plainText(s.props.heading || 'Today')}>
        <div className="ys-wrap"><p className="ys-today-text"><Txt>{s.props.emptyText}</Txt></p></div>
      </section>
    )
  }
  return (
    <section className={`ys-s ys-today ys-v-${s.variant}`} id={s.id} aria-label={plainText(s.props.heading || 'Today')}>
      <div className="ys-wrap">
        <p className="ys-today-label">{plainText(s.props.heading || 'Today')}</p>
        <p className="ys-today-headline">{t.headline}</p>
        {t.lines.map((l, i) => <p key={i} className="ys-today-text">{l}</p>)}
      </div>
    </section>
  )
}
