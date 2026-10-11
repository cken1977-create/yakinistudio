export function PageHero({ eyebrow, title, es, lead, bg }: { eyebrow: string; title: string; es: string; lead: string; bg: string }) {
  return (
    <section style={{ padding: '96px 0 48px', background: `linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.92)), url('${bg}') center / cover no-repeat` }}>
      <div className="ms-wrap">
        <div className="ms-eyebrow">{eyebrow}</div>
        <h1 style={{ fontSize: 'clamp(40px, 10vw, 80px)', letterSpacing: '-.02em', lineHeight: 1.05 }}>{title}</h1>
        <p style={{ fontSize: 18, color: '#ddd', marginTop: 12, maxWidth: 600 }}>{lead}</p>
        <p className="ms-es" style={{ marginTop: 4 }}>{es}</p>
      </div>
    </section>
  )
}
