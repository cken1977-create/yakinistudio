import Link from 'next/link'
import Image from 'next/image'
import { PHONE_DISPLAY, PHONE_TEL, HAS_PAY, FACEBOOK_URL, PUBLIC_EMAIL } from '@/config/site'

export function SiteStyles() {
  return (
    <style>{`
      body { padding-bottom: 76px; }
      @media (min-width: 900px) { body { padding-bottom: 0; } }
      .ms-wrap { max-width: 1120px; margin: 0 auto; padding: 0 20px; }
      .ms-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .28em; text-transform: uppercase; color: var(--brand-primary); margin-bottom: 14px; }
      .ms-es { font-style: italic; color: var(--brand-muted); }
      .ms-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; padding: 0 26px; border-radius: 999px; font-weight: 700; font-size: 16px; letter-spacing: .02em; border: 2px solid transparent; transition: transform .15s, background .15s; }
      .ms-btn:active { transform: scale(.97); }
      .ms-btn-red { background: var(--brand-primary); color: #fff; }
      .ms-btn-red:hover { background: #d0161f; }
      .ms-btn-white { background: #fff; color: #000; }
      .ms-btn-ghost { border-color: rgba(255,255,255,.55); color: #fff; }
      .ms-btn-ghost:hover { background: rgba(255,255,255,.08); }
      .ms-nav { position: sticky; top: 0; z-index: 50; background: rgba(0,0,0,.88); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--brand-border); }
      .ms-nav-in { display: flex; align-items: center; justify-content: space-between; height: 60px; }
      .ms-logo { font-family: var(--font-display); font-size: 22px; font-weight: 600; }
      .ms-logo span { color: var(--brand-primary); }
      .ms-nav-links { display: flex; gap: 22px; align-items: center; font-size: 14px; font-weight: 600; }
      .ms-nav-links a:hover { color: var(--brand-primary); }
      .ms-hide-sm { display: none; }
      @media (min-width: 900px) { .ms-hide-sm { display: inline-flex; } }
      .ms-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; display: grid; gap: 8px; padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); background: rgba(0,0,0,.94); border-top: 1px solid var(--brand-border); }
      .ms-bar a { min-height: 54px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; line-height: 1.1; }
      .ms-bar a small { font-size: 11px; font-weight: 500; opacity: .8; font-style: italic; }
      @media (min-width: 900px) { .ms-bar { display: none; } }
      .ms-footer { border-top: 1px solid var(--brand-border); padding: 48px 0 40px; color: var(--brand-muted); font-size: 14px; }
      .ms-footer a { color: #fff; }
    `}</style>
  )
}

export function SiteNav() {
  return (
    <header className="ms-nav">
      <div className="ms-wrap ms-nav-in">
        <Link href="/" className="ms-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/photos/logo-badge.webp" alt="Momma Sally's logo" width={44} height={44} priority />
          <span style={{ color: '#fff' }}>Momma Sally&rsquo;s</span>
        </Link>
        <nav className="ms-nav-links">
          <Link href="/menu">Menu</Link>
          <Link href="/food-truck" className="ms-hide-sm">Food Truck</Link>
          <Link href="/catering" className="ms-hide-sm">Catering</Link>
          <Link href="/events" className="ms-hide-sm">Events</Link>
          {HAS_PAY && <Link href="/pay" className="ms-hide-sm">Pay</Link>}
          <a href={PHONE_TEL} className="ms-btn ms-btn-red" style={{ minHeight: 40, padding: '0 18px', fontSize: 14 }}>Call</a>
        </nav>
      </div>
    </header>
  )
}

/** Thumb-reach action bar for phones (QR visitors). */
export function ActionBar() {
  return (
    <div className="ms-bar" style={{ gridTemplateColumns: HAS_PAY ? '1fr 1fr 1fr' : '1fr 1fr' }}>
      <Link href="/menu" style={{ background: '#fff', color: '#000' }}>Menu<small>Menú</small></Link>
      <a href={PHONE_TEL} style={{ background: 'var(--brand-primary)', color: '#fff' }}>Call<small>Llamar</small></a>
      {HAS_PAY && (
        <Link href="/pay" style={{ border: '2px solid rgba(255,255,255,.6)', color: '#fff' }}>Pay<small>Pagar</small></Link>
      )}
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="ms-footer">
      <div className="ms-wrap" style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <div className="ms-logo" style={{ color: '#fff', marginBottom: 8 }}>Momma Sally<span>&rsquo;</span>s</div>
          <div>Texas BBQ food truck · Abilene, TX</div>
          <div className="ms-es">Barbacoa texana · Abilene, TX</div>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
          {PUBLIC_EMAIL && <a href={`mailto:${PUBLIC_EMAIL}`}>{PUBLIC_EMAIL}</a>}
          {FACEBOOK_URL && <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">Facebook</a>}
          <span>Call for today&rsquo;s location &amp; hours</span>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <Link href="/menu">Menu / Menú</Link>
          <Link href="/food-truck">Food Truck</Link>
          <Link href="/catering">Catering</Link>
          <Link href="/events">Events / Eventos</Link>
          {HAS_PAY && <Link href="/pay">Pay / Pagar</Link>}
        </div>
      </div>
      <div className="ms-wrap" style={{ marginTop: 32, fontSize: 12 }}>
        © {new Date().getFullYear()} Momma Sally&rsquo;s · Site by Yakini Digital
      </div>
    </footer>
  )
}
