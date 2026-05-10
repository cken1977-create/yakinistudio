// ═════════════════════════════════════════════════════════════════════════
// TRICOLOR RULE — Vizionz Sankofa ceremonial divider
// ═════════════════════════════════════════════════════════════════════════
// The Pan-African flag (red → black → green) expressed as a horizontal
// rule used at section breaks throughout the site. Every appearance is
// a quiet reaffirmation of the brand's heritage.
//
// Usage:
//   <TriColorRule />                    — default 4rem wide, 4px tall
//   <TriColorRule fullWidth />          — spans full container width
//   <TriColorRule width="2rem" />       — custom width
// ═════════════════════════════════════════════════════════════════════════

import { CSSProperties } from 'react'

// Pan-African palette extracted from the VS logo
export const VS_RED = '#CE1126'      // Pan-African red
export const VS_NAVY = '#0A2548'     // Old Glory navy (the Sankofa bird body)
export const VS_GREEN = '#007A33'    // Pan-African green
export const VS_INK = '#0A0A0A'      // Near-black (between red and green in tri-color rule)

interface TriColorRuleProps {
  fullWidth?: boolean
  width?: string
  height?: string
  marginY?: string
  align?: 'left' | 'center' | 'right'
}

export function TriColorRule({
  fullWidth = false,
  width = '4rem',
  height = '4px',
  marginY = '1.5rem',
  align = 'left',
}: TriColorRuleProps) {
  const style: CSSProperties = {
    width: fullWidth ? '100%' : width,
    height,
    background: `linear-gradient(90deg,
      ${VS_RED} 0%,
      ${VS_RED} 33%,
      ${VS_INK} 33%,
      ${VS_INK} 67%,
      ${VS_GREEN} 67%,
      ${VS_GREEN} 100%)`,
    border: 0,
    margin: align === 'center' ? `${marginY} auto` : `${marginY} 0`,
  }
  return <hr style={style} aria-hidden="true" />
}
