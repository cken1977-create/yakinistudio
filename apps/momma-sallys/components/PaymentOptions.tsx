export function PaymentOptions() {
  const rows = [
    ['Tap to Pay available', 'Pago sin contacto disponible'],
    ['Cash', 'Efectivo'],
    ['Visa / Mastercard — credit & debit', 'Visa / Mastercard — crédito y débito'],
  ]
  return (
    <div style={{ padding: 20, border: '1px solid var(--brand-border)', borderRadius: 16, background: '#0b0b0b' }}>
      <div className="ms-eyebrow" style={{ marginBottom: 10 }}>Payment Options · Opciones de pago</div>
      <ul style={{ listStyle: 'none', display: 'grid', gap: 8 }}>
        {rows.map(([en, es]) => (
          <li key={en}><span style={{ fontWeight: 700 }}>✓ {en}</span><div className="ms-es" style={{ fontSize: 13 }}>{es}</div></li>
        ))}
      </ul>
      <p style={{ marginTop: 12, fontSize: 14, color: '#ddd' }}>CC fees &amp; tax included in pricing — no added fees.</p>
      <p className="ms-es" style={{ fontSize: 13 }}>Comisiones de tarjeta e impuestos incluidos en el precio — sin cargos adicionales.</p>
    </div>
  )
}
