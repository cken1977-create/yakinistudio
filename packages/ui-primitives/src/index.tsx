// ═════════════════════════════════════════════════════════════════════════
// YAKINI UI PRIMITIVES
// ═════════════════════════════════════════════════════════════════════════
// Foundational components used across all Yakini Digital surfaces — both
// bespoke client builds and named templates.
//
// Three primitives live here:
//   - <BrandProvider>  — Wraps app, injects fonts and CSS variables from BrandConfig
//   - <Section>        — Padding + max-width wrapper, design-system-agnostic
//   - <Button>         — Three variants (primary/secondary/ghost), CSS-var driven
//
// File location:
//   packages/ui-primitives/src/index.tsx
//
// Imported as:
//   import { BrandProvider, Section, Button } from '@yakini/ui-primitives'
// ═════════════════════════════════════════════════════════════════════════

'use client'

import { ReactNode } from 'react'
import type { BrandConfig } from '@yakini/config'

// ───────────────────────────────────────────────────────────────────────
// BRAND PROVIDER — Wraps the entire app, injects fonts and CSS variables
// ───────────────────────────────────────────────────────────────────────
export function BrandProvider({
  config,
  children
}: {
  config: BrandConfig
  children: ReactNode
}) {
  const { brand } = config
  const fontUrl = `https://fonts.googleapis.com/css2?family=${brand.fonts.display.replace(/ /g, '+')}:wght@400;500;600;700&family=${brand.fonts.body.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontUrl} rel="stylesheet" />
      <style>{`
        :root {
          --brand-primary: ${brand.colors.primary};
          --brand-accent: ${brand.colors.accent};
          --brand-bg: ${brand.colors.background};
          --brand-text: ${brand.colors.text};
          --brand-muted: ${brand.colors.textMuted};
          --brand-border: ${brand.colors.border};
          --font-display: '${brand.fonts.display}', serif;
          --font-body: '${brand.fonts.body}', sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: var(--brand-bg);
          color: var(--brand-text);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          line-height: 1.6;
        }
        h1, h2, h3, h4, h5, h6 { font-family: var(--font-display); line-height: 1.15; font-weight: 500; }
        a { color: inherit; text-decoration: none; }
        img { max-width: 100%; height: auto; display: block; }
        button, input, textarea { font-family: inherit; }
      `}</style>
      {children}
    </>
  )
}

// ───────────────────────────────────────────────────────────────────────
// SECTION — Padding + max-width wrapper. No visual opinions.
// ───────────────────────────────────────────────────────────────────────
export function Section({
  children,
  background = 'transparent',
  padding = 'lg',
  id,
}: {
  children: ReactNode
  background?: string
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  id?: string
}) {
  const paddingMap = { sm: '40px 32px', md: '80px 32px', lg: '120px 32px', xl: '160px 32px' }
  return (
    <section id={id} style={{ background, padding: paddingMap[padding] }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}

// ───────────────────────────────────────────────────────────────────────
// BUTTON — Three variants, all driven by CSS custom properties
// ───────────────────────────────────────────────────────────────────────
export function Button({
  variant = 'primary',
  href,
  onClick,
  children,
  type = 'button',
  disabled = false,
}: {
  variant?: 'primary' | 'secondary' | 'ghost'
  href?: string
  onClick?: () => void
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}) {
  const className = `yk-btn yk-btn-${variant}`
  const content = (
    <>
      <style>{`
        .yk-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 14px 28px;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.25s ease;
          border: none;
          font-family: var(--font-body);
          white-space: nowrap;
        }
        .yk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .yk-btn-primary {
          background: var(--brand-text); color: var(--brand-bg);
        }
        .yk-btn-primary:hover:not(:disabled) {
          background: var(--brand-primary); color: white;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .yk-btn-secondary {
          background: transparent; color: var(--brand-text);
          border: 1.5px solid var(--brand-text);
        }
        .yk-btn-secondary:hover:not(:disabled) {
          background: var(--brand-text); color: var(--brand-bg);
        }
        .yk-btn-ghost {
          background: transparent; color: var(--brand-primary);
          padding: 8px 0;
        }
        .yk-btn-ghost::after {
          content: ' →'; transition: transform 0.2s;
          display: inline-block; margin-left: 4px;
        }
        .yk-btn-ghost:hover::after { transform: translateX(4px); }
      `}</style>
      {children}
    </>
  )

  if (href) return <a href={href} className={className}>{content}</a>
  return (
    <button onClick={onClick} type={type} disabled={disabled} className={className}>
      {content}
    </button>
  )
}

// ───────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────
export function hexToRgb(hex: string): string {
  const cleaned = hex.replace('#', '').trim()
  const r = parseInt(cleaned.substring(0, 2), 16) || 136
  const g = parseInt(cleaned.substring(2, 4), 16) || 136
  const b = parseInt(cleaned.substring(4, 6), 16) || 136
  return `${r},${g},${b}`
}
