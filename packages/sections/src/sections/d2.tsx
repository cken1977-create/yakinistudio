import { plainText, type RichText, type SectionOf, type SectionType } from '@yakini/site-schema'
import { DraftHint, HeadTxt, Img, Link, RichTextView, Txt, showEmpty, type RenderContext } from '../context'
import { Heading } from './heading'

/**
 * Premium section library (design D2, DESIGN_UPGRADE_PLAN.md D2). Server components only, no
 * client JavaScript; every layout and motion is CSS (variants/d2.css) and reads fully with
 * JavaScript and animation off. Stats and testimonials render only what the owner entered.
 */
type P<T extends SectionType> = { ctx: RenderContext; s: SectionOf<T>; first: boolean }

const cls = (s: { type: string; variant: string }, extra = '') => `ys-s ys-${s.type.replace('_', '-')} ys-v-${s.variant}${extra ? ` ${extra}` : ''}`
const two = (n: number) => String(n + 1).padStart(2, '0')

function SectionHead({ ctx, s, first, heading, fallback }: { ctx: RenderContext; s: { id: string }; first: boolean; heading?: string; fallback: string }) {
  void ctx
  return heading
    ? <div className="ys-section-head"><Heading first={first} id={`${s.id}-h`}><HeadTxt>{heading}</HeadTxt></Heading></div>
    : <span id={`${s.id}-h`} className="ys-sr">{fallback}</span>
}

// ---------------------------------------------------------------- hero

/** Asymmetric 7/5 split; the photo overlaps the next section; an oversized "01" behind the copy. */
export function EditorialSplitHero({ ctx, s, first }: P<'hero'>) {
  const p = s.props
  const img = p.image && ctx.image(p.image.assetId) ? p.image : undefined
  return (
    <section className={cls(s, img ? 'has-img' : 'no-img')} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap ys-ed-grid">
        <div className="ys-hero-copy ys-ed-copy">
          <span className="ys-ed-number" aria-hidden="true">01</span>
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
        {img ? <div className="ys-ed-media"><Img ctx={ctx} image={img} className="ys-cover" sizes="(min-width: 900px) 42vw, 100vw" priority={first} /></div> : null}
      </div>
    </section>
  )
}

/** Three photos stacked at angles (CSS only); copy beside them. */
export function CollageHero({ ctx, s, first }: P<'hero'>) {
  const p = s.props
  const imgs = [p.image, ...(p.images ?? [])].filter((im): im is NonNullable<typeof im> => Boolean(im && ctx.image(im.assetId))).slice(0, 3)
  return (
    <section className={cls(s, imgs.length ? 'has-img' : 'no-img')} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap ys-collage-grid">
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
        {imgs.length ? (
          <ul className={`ys-collage ys-collage-${imgs.length}`}>
            {imgs.map((im, i) => <li key={i} className="ys-collage-item"><Img ctx={ctx} image={im} className="ys-cover" sizes="(min-width: 900px) 30vw, 60vw" priority={first && i === 0} /></li>)}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- about: chapters

/** Splits a story at its h3 headings into chapters ("01 · How it started"). */
export function chaptersOf(body: RichText): { title: string | null; blocks: RichText }[] {
  const out: { title: string | null; blocks: RichText }[] = []
  for (const block of body) {
    if (block.type === 'h3') { out.push({ title: block.children.map((c) => c.text).join(''), blocks: [] }); continue }
    if (!out.length) out.push({ title: null, blocks: [] })
    out[out.length - 1].blocks.push(block)
  }
  return out.filter((c) => c.title || c.blocks.length)
}

export function ChaptersAbout({ ctx, s, first }: P<'about'>) {
  const img = s.props.image && ctx.image(s.props.image.assetId) ? s.props.image : undefined
  const chapters = chaptersOf(s.props.body)
  return (
    <section className={cls(s, img ? 'has-img' : 'no-img')} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap">
        <div className="ys-section-head"><Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading></div>
        {chapters.length ? (
          <ol className="ys-chapters">
            {chapters.map((c, i) => (
              <li key={i} className={`ys-chapter${i % 2 ? ' is-flip' : ''}`}>
                <div className="ys-prose">
                  <p className="ys-label ys-chapter-label">{two(i)}{c.title ? <> · <Txt>{c.title}</Txt></> : null}</p>
                  <RichTextView ctx={ctx} value={c.blocks} />
                </div>
                {i === 0 && img ? <div className="ys-chapter-media"><Img ctx={ctx} image={img} className="ys-cover" sizes="(min-width: 900px) 45vw, 100vw" /></div> : null}
              </li>
            ))}
          </ol>
        ) : <DraftHint ctx={ctx}>Tell your story here</DraftHint>}
        {s.props.pullQuote ? <blockquote className="ys-pullquote"><p><Txt>{s.props.pullQuote}</Txt></p></blockquote> : null}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- menu: editorial

const TAGS: Record<string, string> = { veg: 'Vegetarian', spicy: 'Spicy', gf: 'Gluten free' }

export function EditorialMenu({ ctx, s, first }: P<'menu'>) {
  const cats = s.props.categories.filter((c) => c.items.length > 0 || showEmpty(ctx))
  if (!cats.length && !showEmpty(ctx)) return null
  return (
    <section className={cls(s)} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap">
        <div className="ys-section-head">
          <Heading first={first} id={`${s.id}-h`}><HeadTxt>{s.props.heading}</HeadTxt></Heading>
          {s.props.intro ? <p className="ys-lead"><Txt>{s.props.intro}</Txt></p> : null}
        </div>
        {cats.length ? cats.map((cat, ci) => {
          const featured = cat.items.find((it) => it.image && ctx.image(it.image.assetId))
          const rest = cat.items.filter((it) => it !== featured)
          return (
            <div key={ci} className={`ys-ed-menu-cat${featured ? ' has-feature' : ''}`}>
              <h3 className="ys-menu-cat-name"><Txt>{cat.name}</Txt></h3>
              {featured ? (
                <figure className="ys-ed-feature">
                  <Img ctx={ctx} image={featured.image!} className="ys-cover" sizes="(min-width: 900px) 40vw, 100vw" />
                  <figcaption>
                    <span className="ys-label">Featured</span>
                    <span className="ys-menu-line"><span className="ys-menu-name"><Txt>{featured.name}</Txt></span>{featured.price ? <span className="ys-price"><Txt>{featured.price}</Txt></span> : null}</span>
                    {featured.description ? <span className="ys-menu-desc"><Txt>{featured.description}</Txt></span> : null}
                  </figcaption>
                </figure>
              ) : null}
              {rest.length ? (
                <ul className="ys-ed-menu-items">
                  {rest.map((it, ii) => (
                    <li key={ii} className="ys-ed-menu-item">
                      <p className="ys-ed-line">
                        <span className="ys-menu-name"><Txt>{it.name}</Txt></span>
                        <span className="ys-ed-leader" aria-hidden="true" />
                        {it.price ? <span className="ys-price"><Txt>{it.price}</Txt></span> : null}
                      </p>
                      {it.description ? <p className="ys-menu-desc"><Txt>{it.description}</Txt></p> : null}
                      {it.tags?.length ? <ul className="ys-ed-tags" aria-label="Dietary notes">{it.tags.map((t) => <li key={t}>{TAGS[t]}</li>)}</ul> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {!cat.items.length ? <DraftHint ctx={ctx}>Add items to this part of the menu</DraftHint> : null}
            </div>
          )
        }) : <DraftHint ctx={ctx}>Add your menu: dishes, short descriptions and prices</DraftHint>}
        {s.props.note && cats.length ? <p className="ys-note"><Txt>{s.props.note}</Txt></p> : null}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- gallery: mosaic + filmstrip

/** Bento grid: two large and four small photos (more continue in the grid). */
export function MosaicGallery({ ctx, s, first }: P<'gallery'>) {
  const images = s.props.images.filter((im) => ctx.image(im.assetId))
  if (!images.length && !showEmpty(ctx)) return null
  return (
    <section className={cls(s)} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap">
        <SectionHead ctx={ctx} s={s} first={first} heading={s.props.heading} fallback="Photos" />
        {images.length ? (
          <ul className="ys-mosaic">
            {images.map((im, i) => <li key={i} className={i < 2 ? 'is-big' : undefined}><Img ctx={ctx} image={im} className="ys-cover" sizes={i < 2 ? '(min-width: 900px) 50vw, 100vw' : '(min-width: 900px) 25vw, 50vw'} /></li>)}
          </ul>
        ) : <DraftHint ctx={ctx}>Add photos of your food and your place</DraftHint>}
      </div>
    </section>
  )
}

/**
 * Horizontal scroll-snap strip with a peek of the next photo. The strip is a focusable, labelled
 * region, so it scrolls with the arrow keys and screen readers announce it; each photo is a list
 * item with its alt text and "n of total" position.
 */
export function FilmstripGallery({ ctx, s, first }: P<'gallery'>) {
  const images = s.props.images.filter((im) => ctx.image(im.assetId))
  if (!images.length && !showEmpty(ctx)) return null
  // Its own name, distinct from the section's, so a screen reader lists "<heading>, photo strip".
  const label = `${s.props.heading ? plainText(s.props.heading) : 'Photos'}, photo strip`
  return (
    <section className={cls(s)} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap">
        <SectionHead ctx={ctx} s={s} first={first} heading={s.props.heading} fallback="Photos" />
      </div>
      {images.length ? (
        <div className="ys-filmstrip" role="region" tabIndex={0} aria-label={label}>
          <ul className="ys-film-track">
            {images.map((im, i) => (
              <li key={i} className="ys-film-frame" aria-label={`Photo ${i + 1} of ${images.length}`}>
                <Img ctx={ctx} image={im} className="ys-cover" sizes="(min-width: 900px) 38vw, 82vw" />
              </li>
            ))}
          </ul>
        </div>
      ) : <div className="ys-wrap"><DraftHint ctx={ctx}>Add photos of your food and your place</DraftHint></div>}
    </section>
  )
}

// ---------------------------------------------------------------- testimonials: big quote

export function BigQuoteTestimonials({ ctx, s, first }: P<'testimonials'>) {
  const q = s.props.items[0]
  if (!q && !showEmpty(ctx)) return null
  return (
    <section className={cls(s)} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap">
        <SectionHead ctx={ctx} s={s} first={first} heading={s.props.heading} fallback="What a customer said" />
        {q ? (
          <figure className="ys-bigquote">
            <blockquote><p><Txt>{q.quote}</Txt></p></blockquote>
            <figcaption className="ys-label"><Txt>{q.name}</Txt>{q.source ? <> · <Txt>{q.source}</Txt></> : null}</figcaption>
          </figure>
        ) : <DraftHint ctx={ctx}>Add a few kind words from real customers (only ones they agreed to share)</DraftHint>}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- cta band: image

export function ImageCtaBand({ ctx, s, first }: P<'cta_band'>) {
  const img = s.props.image && ctx.image(s.props.image.assetId) ? s.props.image : undefined
  return (
    <section className={cls(s, img ? 'has-img' : 'no-img')} id={s.id} aria-labelledby={`${s.id}-h`}>
      {img ? <div className="ys-cta-media"><Img ctx={ctx} image={img} className="ys-cover" sizes="100vw" /></div> : null}
      <div className="ys-cta-scrim" aria-hidden="true" />
      <div className="ys-wrap ys-cta-image-inner">
        <Heading first={first} id={`${s.id}-h`} className="ys-display ys-cta-headline"><HeadTxt>{s.props.headline}</HeadTxt></Heading>
        {s.props.body ? <p className="ys-lead"><Txt>{s.props.body}</Txt></p> : null}
        <Link ctx={ctx} to={s.props.cta.target} className="ys-btn ys-btn-primary">{s.props.cta.label}</Link>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- new types

/**
 * Ticker: a marquee of short phrases. The real list is read once by screen readers; the moving
 * copy is a decorative duplicate (aria-hidden). With motion off it's a static, wrapping list.
 */
export function TickerSection({ ctx, s }: { ctx: RenderContext; s: SectionOf<'ticker'> }) {
  void ctx
  const items = s.props.items.filter((t) => t.trim())
  if (items.length < 3) return null
  const row = (hidden: boolean) => (
    <ul className="ys-ticker-row" aria-hidden={hidden || undefined}>
      {items.map((t, i) => <li key={i} className="ys-ticker-item">{t}</li>)}
    </ul>
  )
  return (
    <section className={cls(s)} id={s.id} aria-label={s.props.label || 'What we do'}>
      <div className="ys-ticker-track">{row(false)}{row(true)}</div>
    </section>
  )
}

export function StatsSection({ ctx, s, first }: P<'stats'>) {
  const items = s.props.items.filter((x) => x.value.trim() && x.label.trim())
  if (items.length < 2 && !showEmpty(ctx)) return null
  return (
    <section className={cls(s)} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap">
        <SectionHead ctx={ctx} s={s} first={first} heading={s.props.heading} fallback="By the numbers" />
        {items.length >= 2 ? (
          <dl className="ys-stats">
            {items.map((x, i) => (
              <div key={i} className="ys-stat">
                <dt className="ys-label"><Txt>{x.label}</Txt></dt>
                <dd className="ys-stat-value"><Txt>{x.value}</Txt></dd>
              </div>
            ))}
          </dl>
        ) : <DraftHint ctx={ctx}>Add 2 to 4 numbers you can stand behind, like years in business</DraftHint>}
      </div>
    </section>
  )
}

export function FeatureRowsSection({ ctx, s, first }: P<'feature_rows'>) {
  const items = s.props.items
  if (items.length < 1 && !showEmpty(ctx)) return null
  return (
    <section className={cls(s)} id={s.id} aria-labelledby={`${s.id}-h`}>
      <div className="ys-wrap">
        <SectionHead ctx={ctx} s={s} first={first} heading={s.props.heading} fallback="What we do" />
        {items.length ? (
          <ol className="ys-features">
            {items.map((it, i) => {
              const img = it.image && ctx.image(it.image.assetId) ? it.image : undefined
              return (
                <li key={i} className={`ys-feature${i % 2 ? ' is-flip' : ''}${img ? ' has-img' : ''}`}>
                  <div className="ys-feature-copy">
                    <p className="ys-label">{two(i)}{it.label ? <> · <Txt>{it.label}</Txt></> : null}</p>
                    <h3 className="ys-h2 ys-feature-title"><HeadTxt>{it.title}</HeadTxt></h3>
                    <p className="ys-lead"><Txt>{it.body}</Txt></p>
                  </div>
                  {img ? <div className="ys-feature-media"><Img ctx={ctx} image={img} className="ys-cover" sizes="(min-width: 900px) 50vw, 100vw" /></div> : null}
                </li>
              )
            })}
          </ol>
        ) : <DraftHint ctx={ctx}>Add 2 to 4 things you want people to know, each with a photo</DraftHint>}
      </div>
    </section>
  )
}
