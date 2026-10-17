'use client'

// VIZIONZ SANKOFA · modal shell (same look as the existing admin modals)
// Visible "✕ Close" in the corner, Escape closes, click outside closes.

import { useEffect, type ReactNode } from 'react'
import { SERIF } from './ui'

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = '640px',
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.45)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth,
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(10, 10, 10, 0.25)',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            minWidth: '44px',
            minHeight: '44px',
            border: 'none',
            background: 'transparent',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(10, 10, 10, 0.6)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ✕ Close
        </button>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#0A0A0A', margin: subtitle ? '0 80px 6px 0' : '0 80px 24px 0', fontFamily: SERIF }}>
          {title}
        </h2>
        {subtitle && <p style={{ fontSize: '13px', color: 'rgba(10, 10, 10, 0.6)', margin: '0 0 24px' }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
