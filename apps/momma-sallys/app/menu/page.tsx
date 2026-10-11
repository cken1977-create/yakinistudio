import type { Metadata } from 'next'
import Link from 'next/link'
import { PaymentOptions } from '@/components/PaymentOptions'
import { config } from '@/config/brand'
import { PHONE_DISPLAY, PHONE_TEL, HAS_PAY } from '@/config/site'

export const metadata: Metadata = {
  title: "Menu · Menú — Momma Sally's BBQ, Abilene TX",
  description: "Momma Sally's full bilingual BBQ menu: meat plates, sides, desserts and drinks.",
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export default function MenuPage() {
  const menu = config.menu!

  return (
    <>
      <style>{`
        .m-hero { padding: 56px 0 36px; background: linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.95)), url('/backdrop-platter.png') center / cover no-repeat; }
        .m-hero h1 { font-size: clamp(40px, 10vw, 80px); letter-spacing: -.02em; }
        .m-chips { position: sticky; top: 60px; z-index: 40; background: rgba(0,0,0,.94); border-bottom: 1px solid var(--brand-border); overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .m-chips::-webkit-scrollbar { display: none; }
        .m-chips a { display: inline-block; margin: 10px 4px; padding: 8px 14px; border: 1px solid var(--brand-border); border-radius: 999px; font-size: 14px; font-weight: 600; }
        .m-chips a:first-child { margin-left: 20px; }
        .m-cat { padding: 36px 0 8px; scroll-margin-top: 120px; }
        .m-cat h2 { font-size: clamp(28px, 7vw, 40px); display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
        .m-cat h2 small { font-family: var(--font-body); font-size: 15px; font-weight: 400; font-style: italic; color: var(--brand-muted); }
        .m-bar { width: 44px; height: 3px; background: var(--brand-primary); margin: 10px 0 8px; }
        .m-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
        .m-name { font-weight: 700; font-size: 17px; }
        .m-price { font-family: var(--font-display); font-size: 20px; font-weight: 600; white-space: nowrap; color: #fff; }
        .m-price.text { font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--brand-muted); text-align: right; max-width: 9em; white-space: normal; }
        .m-note { margin-top: 12px; font-size: 14px; color: var(--brand-muted); font-style: italic; border-left: 3px solid var(--brand-primary); padding-left: 12px; }
        .m-grid { display: grid; column-gap: 56px; }
        @media (min-width: 900px) { .m-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <section className="m-hero">
        <div className="ms-wrap">
          <div className="ms-eyebrow">Menu · Menú</div>
          <h1>{menu.headline}</h1>
          {menu.subheadline && <p style={{ fontSize: 17, color: '#ddd', marginTop: 10, maxWidth: 600 }}>{menu.subheadline}</p>}
          <p className="ms-es" style={{ fontSize: 14, marginTop: 4 }}>Abilene, TX · Negocio local</p>
        </div>
      </section>

      <nav className="m-chips" aria-label="Menu sections">
        {menu.categories.map(c => <a key={c.name} href={`#${slug(c.name)}`}>{c.name}</a>)}
      </nav>

      <div className="ms-wrap" style={{ paddingBottom: 48 }}>
        <div className="m-grid">
          {menu.categories.map(cat => (
            <section key={cat.name} id={slug(cat.name)} className="m-cat">
              <h2>{cat.name}{cat.nameTranslated && cat.nameTranslated !== cat.name && <small>{cat.nameTranslated}</small>}</h2>
              <div className="m-bar" />
              {cat.items.map(item => {
                const numeric = item.price ? /^\$/.test(item.price) : false
                return (
                  <div className="m-item" key={item.name}>
                    <div>
                      <div className="m-name">{item.name}</div>
                      {item.nameTranslated && item.nameTranslated !== item.name && <div className="ms-es" style={{ fontSize: 14 }}>{item.nameTranslated}</div>}
                      {item.description && <div style={{ fontSize: 14, color: '#cfcfcf', marginTop: 6, lineHeight: 1.5 }}>{item.description}</div>}
                      {item.descriptionTranslated && <div className="ms-es" style={{ fontSize: 13, marginTop: 2, lineHeight: 1.5 }}>{item.descriptionTranslated}</div>}
                    </div>
                    {item.price && <div className={numeric ? 'm-price' : 'm-price text'}>{item.price}</div>}
                  </div>
                )
              })}
              {cat.note && <p className="m-note">{cat.note}</p>}
            </section>
          ))}
        </div>

        <div style={{ marginTop: 40 }}>
          <PaymentOptions />
          {HAS_PAY && <Link href="/pay" className="ms-btn ms-btn-red" style={{ marginTop: 16 }}>Pay Now · Pagar</Link>}
        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 6vw, 44px)', marginBottom: 8 }}>Feeding a crowd?</h2>
          <p style={{ color: 'var(--brand-muted)', marginBottom: 20 }}>Catering runs the same menu, bigger batch. <span className="ms-es">¿Un evento? Llámanos.</span></p>
          <a href={PHONE_TEL} className="ms-btn ms-btn-red">Call {PHONE_DISPLAY}</a>
        </div>
      </div>
    </>
  )
}
