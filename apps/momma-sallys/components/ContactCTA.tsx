import { PHONE_DISPLAY, PHONE_TEL, SMS_LINK, PUBLIC_EMAIL } from '@/config/site'

export function ContactCTA({ subject, label = 'Call' }: { subject: string; label?: string }) {
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <a href={PHONE_TEL} className="ms-btn ms-btn-red">{label} {PHONE_DISPLAY}</a>
      <a href={SMS_LINK} className="ms-btn ms-btn-ghost">Text Us · Envíanos un texto</a>
      {PUBLIC_EMAIL && <a href={`mailto:${PUBLIC_EMAIL}?subject=${encodeURIComponent(subject)}`} className="ms-btn ms-btn-ghost">Email {PUBLIC_EMAIL}</a>}
    </div>
  )
}
