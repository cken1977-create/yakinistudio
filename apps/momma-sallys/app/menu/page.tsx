'use client'

import { Section, Button } from '@yakini/ui'
import { config } from '@/config/brand'

export default function MenuPage() {
  const menu = config.menu

  if (!menu) {
    return (
      <Section padding="xl">
        <div style={{ paddingTop: 80, maxWidth: 720 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 500, marginBottom: 24
          }}>
            Menu coming soon
          </h1>
          <p style={{ fontSize: 18, color: 'var(--brand-muted)', lineHeight: 1.7, marginBottom: 32 }}>
            We're still putting this page together. Get in touch and we'll tell you what's available today.
          </p>
          <Button variant="primary" href="/contact">Get in Touch</Button>
        </div>
      </Section>
    )
  }

  return (
    <>
      <section style={{
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '140px 32px 72px',
        background:
          'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.78) 100%), url(\'/backdrop-platter.png\') center center / cover no-repeat',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div style={{ maxWidth: 920 }}>
          <div style={{
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--brand-primary)', marginBottom: 24
          }}>
            Menu
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 7vw, 96px)',
            fontWeight: 500, lineHeight: 1.05,
            letterSpacing: '-0.02em', marginBottom: 32
          }}>
            {menu.headline}
          </h1>
          {menu.subheadline && (
            <p style={{
              fontSize: 22, color: 'var(--brand-muted)',
              lineHeight: 1.6, fontFamily: 'var(--font-display)',
              fontStyle: 'italic', maxWidth: 720
            }}>
              {menu.subheadline}
            </p>
          )}
        </div>
        </div>
      </section>

      <Section padding="xl">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 64
        }}>
          {menu.categories.map((cat) => (
            <div key={cat.name}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26, fontWeight: 500, fontStyle: 'italic',
                color: 'var(--brand-text)', marginBottom: 6
              }}>
                {cat.name}
              </h2>
              {cat.nameTranslated && (
                <div style={{
                  fontSize: 14, fontStyle: 'italic',
                  color: 'var(--brand-muted)', marginBottom: 20
                }}>
                  {cat.nameTranslated}
                </div>
              )}

              {cat.items.map((item) => (
                <div key={item.name} style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{item.name}</span>
                    <span style={{
                      flex: 1, borderBottom: '1px dotted var(--brand-border)',
                      transform: 'translateY(-4px)'
                    }} />
                    {item.price && (
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 17, whiteSpace: 'nowrap'
                      }}>
                        {item.price}
                      </span>
                    )}
                  </div>
                  {item.nameTranslated && (
                    <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--brand-muted)', marginTop: 2 }}>
                      {item.nameTranslated}
                    </div>
                  )}
                  {item.description && (
                    <div style={{ fontSize: 14, color: 'var(--brand-muted)', marginTop: 6, lineHeight: 1.5 }}>
                      {item.description}
                    </div>
                  )}
                  {item.descriptionTranslated && (
                    <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--brand-muted)', marginTop: 2, lineHeight: 1.5 }}>
                      {item.descriptionTranslated}
                    </div>
                  )}
                  {item.dietaryTags && item.dietaryTags.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--brand-muted)', marginTop: 4 }}>
                      {item.dietaryTags.join(' · ')}
                    </div>
                  )}
                </div>
              ))}

              {cat.note && (
                <p style={{
                  fontSize: 13, fontStyle: 'italic',
                  color: 'var(--brand-muted)', marginTop: 14
                }}>
                  {cat.note}
                </p>
              )}
            </div>
          ))}
        </div>

        {menu.paymentNote && (
          <p style={{
            marginTop: 64, paddingTop: 24,
            borderTop: '1px solid var(--brand-border)',
            fontSize: 14, color: 'var(--brand-muted)'
          }}>
            {menu.paymentNote}
          </p>
        )}
      </Section>

      <Section padding="xl">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 500, color: 'var(--brand-text)',
            marginBottom: 24, lineHeight: 1.15
          }}>
            Feeding a crowd?
          </h2>
          <p style={{
            fontSize: 17, color: 'var(--brand-muted)',
            lineHeight: 1.7, marginBottom: 32
          }}>
            Catering runs the same menu, bigger batch. Tell us the date and headcount.
          </p>
          <Button variant="primary" href="/contact">Ask About Catering</Button>
        </div>
      </Section>
    </>
  )
}
