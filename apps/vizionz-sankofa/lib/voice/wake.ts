// Wake phrase for the Intelligence ask bar.
// The browser speech API listens only while this page is open and visible.
// It is not a background or system-wide wake word. These helpers decide what
// the screen says; they do not start a microphone by themselves.

export const EXPECTED_WAKE_PHRASE = 'Hey Sankofa'

export const WAKE_PAGE_LIMIT =
  'Wake listens only while this page is open and visible. It does not keep listening after you leave or switch away.'

export type WakePhase = 'off' | 'starting' | 'listening' | 'awaiting-command' | 'error'

export type WakeView = {
  phase: WakePhase
  message: string | null
  /** Non-empty only when a question should be sent to the assistant. */
  command: string | null
}

export function wakeOff(): WakeView {
  return { phase: 'off', message: null, command: null }
}

export type WakeSupport =
  | { ok: true }
  | { ok: false; message: string }

export function wakeSupport(env: { hasRecognition: boolean; isSecureContext: boolean }): WakeSupport {
  if (!env.isSecureContext) {
    return {
      ok: false,
      message: 'Wake needs a secure https page, so the microphone was not started. Type your question instead.',
    }
  }
  if (!env.hasRecognition) {
    return {
      ok: false,
      message: 'This browser does not include speech recognition, so Wake cannot listen. Type your question instead.',
    }
  }
  return { ok: true }
}

/** On-device recognition is used only when the browser reports it is actually available. */
export function shouldUseOnDevice(availability: string | null | undefined): boolean {
  return availability === 'available'
}

export function explainSpeechError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'The browser did not start the microphone. If a permission prompt is showing, allow the microphone for this site, then press Wake again. Nothing was sent. You can type your question.'
    case 'audio-capture':
      return 'The browser could not open a microphone. It may be missing or already in use. Nothing was sent. You can type your question.'
    case 'network':
      return 'Speech recognition could not reach the browser’s speech service. Nothing was sent. You can type your question.'
    case 'no-speech':
      return `No speech was heard. Say “${EXPECTED_WAKE_PHRASE}”, then your question. You can also type it.`
    case 'language-not-supported':
      return 'This browser could not start English speech recognition. Nothing was sent. You can type your question.'
    case 'aborted':
      return 'Wake stopped. You can type your question.'
    default:
      return `The microphone stopped (${code || 'unknown'}). Nothing was sent. You can type your question.`
  }
}

export function normalizeHeard(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function matchWake(transcript: string, phrase = EXPECTED_WAKE_PHRASE):
  | { matched: false }
  | { matched: true; command: string } {
  const heard = normalizeHeard(transcript)
  const wake = normalizeHeard(phrase)
  if (!wake) return { matched: false }
  const at = heard.indexOf(wake)
  if (at < 0) return { matched: false }
  return { matched: true, command: heard.slice(at + wake.length).trim() }
}

export function activePhrase(saved: string | null | undefined): string {
  const trimmed = saved?.trim()
  return trimmed ? trimmed : EXPECTED_WAKE_PHRASE
}

export function phraseGuidance(phrase: string): string | null {
  if (normalizeHeard(phrase) === normalizeHeard(EXPECTED_WAKE_PHRASE)) return null
  return `This Wake is set to “${phrase}”, not “${EXPECTED_WAKE_PHRASE}”. Say “${phrase}”, then your question.`
}

const listeningMessage = (phrase: string) =>
  `Listening for “${phrase}”… Say that, then your question. ${WAKE_PAGE_LIMIT}`

export function wakePress(view: WakeView, support: WakeSupport, phrase: string): WakeView {
  if (!support.ok) return { phase: 'error', message: support.message, command: null }
  if (view.phase === 'starting' || view.phase === 'listening' || view.phase === 'awaiting-command') {
    return { phase: 'off', message: 'Wake is off. You can type your question.', command: null }
  }
  return { phase: 'starting', message: 'Turning the microphone on…', command: null }
}

export function wakeStarted(phrase: string): WakeView {
  const extra = phraseGuidance(phrase)
  return { phase: 'listening', message: `${listeningMessage(phrase)}${extra ? ` ${extra}` : ''}`, command: null }
}

export function wakeStartFailed(code: string): WakeView {
  return { phase: 'error', message: explainSpeechError(code), command: null }
}

export function wakeHeard(
  view: WakeView,
  transcript: string,
  isFinal: boolean,
  phrase: string,
): { view: WakeView; command: string | null } {
  const text = transcript.trim()
  if (!text) return { view, command: null }
  if (!isFinal) {
    return {
      view: { ...view, phase: view.phase === 'off' ? 'listening' : view.phase, message: `Hearing: “${text}”`, command: null },
      command: null,
    }
  }
  const matched = matchWake(text, phrase)
  if (matched.matched && matched.command) {
    return {
      view: {
        phase: 'listening',
        message: `Heard “${phrase}”. Asking: ${matched.command}`,
        command: matched.command,
      },
      command: matched.command,
    }
  }
  if (matched.matched) {
    return {
      view: {
        phase: 'awaiting-command',
        message: `Heard “${phrase}”. Listening for your question…`,
        command: null,
      },
      command: null,
    }
  }
  if (view.phase === 'awaiting-command') {
    return {
      view: {
        phase: 'listening',
        message: `Heard your question. Asking: ${text}`,
        command: text,
      },
      command: text,
    }
  }
  const mismatch = phraseGuidance(phrase)
  return {
    view: {
      phase: 'listening',
      message: `Heard “${text}”. ${mismatch ?? `Say “${EXPECTED_WAKE_PHRASE}”, then your question.`}`,
      command: null,
    },
    command: null,
  }
}

export function wakePaused(phrase: string): WakeView {
  return {
    phase: 'listening',
    message: `Listening paused. Press Wake to listen for “${phrase}” again. ${WAKE_PAGE_LIMIT}`,
    command: null,
  }
}

export function wakeHidden(): WakeView {
  return {
    phase: 'off',
    message: 'Wake paused because this page is hidden. Come back and press Wake to listen again.',
    command: null,
  }
}
