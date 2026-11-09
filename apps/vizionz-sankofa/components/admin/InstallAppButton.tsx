'use client'

// VIZIONZ SANKOFA · install the staff app on this computer
// Shown only from the signed-in staff header. Chromium gives us
// beforeinstallprompt; Safari never does, so those browsers get the
// system tip instead. Already-installed windows (standalone) render nothing.

import { useSyncExternalStore } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallPlatform = 'installed' | 'ios' | 'mac' | 'browser'

const IOS_TIP = 'Share → Add to Home Screen'
const MAC_TIP = 'File → Add to Dock'

function runningStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    nav.standalone === true
  )
}

function safariInstallTip(): string | null {
  const ua = window.navigator.userAgent
  const iPadOs =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1
  if (/iPad|iPhone|iPod/.test(ua) || iPadOs) return IOS_TIP

  const safari =
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|FxiOS|Edg|EdgiOS|OPR|Android/i.test(ua)
  if (safari && /Macintosh|Mac OS X/i.test(ua)) return MAC_TIP
  return null
}

function subscribeToInstall(onChange: () => void) {
  const queries = [
    window.matchMedia('(display-mode: standalone)'),
    window.matchMedia('(display-mode: window-controls-overlay)'),
  ]
  for (const query of queries) query.addEventListener('change', onChange)
  window.addEventListener('appinstalled', onChange)
  return () => {
    for (const query of queries) query.removeEventListener('change', onChange)
    window.removeEventListener('appinstalled', onChange)
  }
}

function installPlatformSnapshot(): InstallPlatform {
  if (runningStandalone()) return 'installed'
  const tip = safariInstallTip()
  if (tip === IOS_TIP) return 'ios'
  if (tip === MAC_TIP) return 'mac'
  return 'browser'
}

function installPlatformServerSnapshot(): InstallPlatform {
  return 'browser'
}

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '36px',
  padding: '6px 10px',
  color: '#0A2548',
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: 'inherit',
  border: '1px solid rgba(10, 10, 10, 0.16)',
  borderRadius: '6px',
  background: '#FFFFFF',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
} as const

const PROMPT_EVENT = 'vizionz-install-prompt'

function readStashedPrompt(): BeforeInstallPromptEvent | null {
  const stored = (window as Window & { __vizionzInstallPrompt?: BeforeInstallPromptEvent | null })
    .__vizionzInstallPrompt
  return stored ?? null
}

function clearStashedPrompt() {
  ;(window as Window & { __vizionzInstallPrompt?: BeforeInstallPromptEvent | null }).__vizionzInstallPrompt =
    null
  window.dispatchEvent(new Event(PROMPT_EVENT))
}

function subscribeToPrompt(onChange: () => void) {
  function onBeforeInstall(event: Event) {
    event.preventDefault()
    ;(window as Window & { __vizionzInstallPrompt?: BeforeInstallPromptEvent }).__vizionzInstallPrompt =
      event as BeforeInstallPromptEvent
    onChange()
  }
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
  window.addEventListener(PROMPT_EVENT, onChange)
  return () => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    window.removeEventListener(PROMPT_EVENT, onChange)
  }
}

export function InstallAppButton() {
  const platform = useSyncExternalStore(
    subscribeToInstall,
    installPlatformSnapshot,
    installPlatformServerSnapshot,
  )
  const promptEvent = useSyncExternalStore(
    subscribeToPrompt,
    readStashedPrompt,
    () => null,
  )

  async function install() {
    if (!promptEvent) return
    try {
      await promptEvent.prompt()
      await promptEvent.userChoice
    } catch {
      // The browser closed the dialog, or the prompt was already used.
    }
    clearStashedPrompt()
  }

  if (platform === 'installed') return null

  if (promptEvent) {
    return (
      <button
        type="button"
        className="vs-admin-install"
        data-testid="install-app-button"
        onClick={install}
        style={buttonStyle}
      >
        Install on this computer
      </button>
    )
  }

  const tip = platform === 'ios' ? IOS_TIP : platform === 'mac' ? MAC_TIP : null
  if (!tip) return null

  return (
    <span
      className="vs-admin-install"
      data-testid="install-app-tip"
      role="note"
      aria-label={`Install on this computer: ${tip}`}
      style={{
        fontSize: '12px',
        lineHeight: 1.3,
        color: 'rgba(10, 10, 10, 0.7)',
        maxWidth: '11rem',
        textAlign: 'right',
      }}
    >
      {tip}
    </span>
  )
}
