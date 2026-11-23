import type { SectionOf } from '@yakini/site-schema'
import { DAY_NAMES, DAY_ORDER, Img, Link, formatPhone, timeRange, type RenderContext } from '../context'
import { mapsUrl } from './hours'

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', linkedin: 'LinkedIn', yelp: 'Yelp', google: 'Google',
}

function Brandmark({ ctx }: { ctx: RenderContext }) {
  const { doc } = ctx
  const home = doc.pages.find((p) => p.slug === '') ?? doc.pages[0]
  const logo = doc.brand.logo && ctx.image(doc.brand.logo.assetId)
  return (
    <a className="ys-brand" href={ctx.hrefForPage(home)}>
      {logo && doc.brand.logo
        ? <><Img ctx={ctx} image={doc.brand.logo} className="ys-logo" priority /><span className="ys-brand-name ys-sr">{doc.business.name}</span></>
        : <span className="ys-brand-name">{doc.business.name}</span>}
    </a>
  )
}

export function HeaderSection({ ctx, s }: { ctx: RenderContext; s: SectionOf<'header'> }) {
  const { doc, page } = ctx
  const items = doc.nav.items
    .map((item) => ({ item, page: doc.pages.find((p) => p.id === item.pageId) }))
    .filter((x): x is { item: typeof x.item; page: NonNullable<typeof x.page> } => Boolean(x.page))
  const phone = s.props.showPhone && doc.business.phone
  const cta = doc.nav.cta
  const list = (
    <ul className="ys-nav-list">
      {items.map(({ item, page: p }) => (
        <li key={item.pageId}>
          <a href={ctx.hrefForPage(p)} aria-current={p.id === page.id ? 'page' : undefined}>{item.label}</a>
        </li>
      ))}
    </ul>
  )
  return (
    <header className={`ys-header ys-v-${s.variant}`} id={s.id}>
      <div className="ys-wrap ys-header-row">
        <Brandmark ctx={ctx} />
        {items.length > 0 ? <nav className="ys-nav-wide" aria-label="Main">{list}</nav> : null}
        <div className="ys-header-actions">
          {phone ? <a className="ys-header-phone" href={`tel:${doc.business.phone}`}>{formatPhone(doc.business.phone!)}</a> : null}
          {cta ? <Link ctx={ctx} to={cta.target} className="ys-btn ys-btn-primary ys-header-cta">{s.props.ctaLabel || cta.label}</Link> : null}
          {items.length > 0 ? (
            <details className="ys-nav-narrow">
              <summary><span className="ys-burger" aria-hidden="true" /><span>Menu</span></summary>
              <nav aria-label="Main">{list}</nav>
            </details>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export function FooterSection({ ctx, s }: { ctx: RenderContext; s: SectionOf<'footer'> }) {
  const { doc } = ctx
  const b = doc.business
  const hours = doc.footer.showHours ? b.hours ?? [] : []
  const year = new Date().getFullYear()
  return (
    <footer className="ys-footer" id={s.id}>
      <div className="ys-wrap ys-footer-grid">
        <div>
          <p className="ys-footer-name">{b.name}</p>
          {b.tagline ? <p className="ys-footer-tagline">{b.tagline}</p> : null}
          {doc.footer.showAddress && b.address ? (
            <address className="ys-footer-address">
              <a href={mapsUrl(b.address)} rel="noopener noreferrer">
                {b.address.line1}{b.address.line2 ? `, ${b.address.line2}` : ''}<br />
                {b.address.city}, {b.address.region} {b.address.postal}
              </a>
            </address>
          ) : null}
          <p className="ys-footer-contact">
            {b.phone ? <a href={`tel:${b.phone}`}>{formatPhone(b.phone)}</a> : null}
            {b.email ? <a href={`mailto:${b.email}`}>{b.email}</a> : null}
          </p>
        </div>
        {hours.length > 0 ? (
          <div>
            <p className="ys-footer-head">Hours</p>
            <dl className="ys-hours-mini">
              {DAY_ORDER.map((d) => {
                const h = hours.find((x) => x.day === d)
                if (!h) return null
                return (
                  <div key={d}>
                    <dt>{DAY_NAMES[d].slice(0, 3)}</dt>
                    <dd>{'closed' in h ? 'Closed' : timeRange(h.open, h.close)}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        ) : null}
        <div>
          <p className="ys-footer-head">Explore</p>
          <ul className="ys-footer-links">
            {doc.nav.items.map((item) => {
              const p = doc.pages.find((x) => x.id === item.pageId)
              return p ? <li key={item.pageId}><a href={ctx.hrefForPage(p)}>{item.label}</a></li> : null
            })}
            {(doc.footer.extraLinks ?? []).map((l, i) => (
              <li key={`x${i}`}><Link ctx={ctx} to={l}>{linkLabel(ctx, l)}</Link></li>
            ))}
          </ul>
          {b.social?.length ? (
            <ul className="ys-social" aria-label="Social">
              {b.social.map((so) => (
                <li key={so.kind + so.url}><a href={so.url} rel="noopener noreferrer">{SOCIAL_LABELS[so.kind]}</a></li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="ys-wrap ys-footer-base">
        <p>© {year} {doc.footer.legalName || b.name}</p>
        <p className="ys-footer-meta">
          {doc.footer.showSiteByYakini && ctx.mode !== 'export' ? <a href="https://yakini.digital" rel="noopener">Site by Yakini</a> : null}
          {ctx.reportUrl && ctx.mode !== 'export' ? <a href={ctx.reportUrl} rel="nofollow">Report this site</a> : null}
        </p>
      </div>
    </footer>
  )
}

function linkLabel(ctx: RenderContext, l: Parameters<typeof Link>[0]['to']): string {
  switch (l.kind) {
    case 'page': return ctx.doc.pages.find((p) => p.id === l.pageId)?.title ?? 'Page'
    case 'section': return ctx.doc.pages.find((p) => p.id === l.pageId)?.title ?? 'Page'
    case 'url': try { return new URL(l.url).hostname.replace(/^www\./, '') } catch { return 'Link' }
    case 'tel': return formatPhone(l.phone)
    case 'mailto': return l.email
    case 'booking': return 'Book'
    case 'form': return 'Contact'
  }
}
