'use client'

// VIZIONZ SANKOFA · Intelligence ask bar (front and center on every home)
//
// Large ask box + microphone. Tap the mic, speak, and the question is sent;
// the answer is shown with its sources and read aloud. Uses only the
// browser's built-in speech recognition and speech synthesis (no paid
// voice service). The wake phrase ("Hey …") is OFF by default and can be
// turned on per user; it only listens while this page is open and visible.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Citation = {
  source_type: string
  document_title?: string
  source_ref?: string | null
  intake_label?: string
  donor_label?: string
  participant_label?: string
}
type Turn = { role: 'user' | 'assistant'; content: string; citations?: Citation[]; isError?: boolean; answeredBy?: string }

// Placeholder until Clarence picks the assistant's name.
export const DEFAULT_WAKE_PHRASE = 'Hey Sankofa'

// Minimal typing for the Web Speech API (not in TS's DOM lib everywhere).
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  processLocally?: boolean
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as (new () => SpeechRecognitionLike) | null
}

function citationLabel(c: Citation): string {
  return (
    c.participant_label ||
    c.intake_label ||
    c.donor_label ||
    [c.document_title, c.source_ref].filter(Boolean).join(' · ') ||
    c.source_type
  )
}

export function AskBar({
  greeting,
  large = false,
  voiceSettings,
}: {
  greeting?: string
  large?: boolean
  voiceSettings: { wakePhraseEnabled: boolean; wakePhrase: string | null; speakAnswers: boolean }
}) {
  const [input, setInput] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [wakeEnabled, setWakeEnabled] = useState(voiceSettings.wakePhraseEnabled)
  const [wakePhrase, setWakePhrase] = useState(voiceSettings.wakePhrase || DEFAULT_WAKE_PHRASE)
  const [speakAnswers, setSpeakAnswers] = useState(voiceSettings.speakAnswers)
  const [settingsMsg, setSettingsMsg] = useState('')
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const wakeRecRef = useRef<SpeechRecognitionLike | null>(null)
  const turnsRef = useRef<Turn[]>([])
  turnsRef.current = turns

  const base = large ? 22 : 18

  useEffect(() => {
    setVoiceSupported(getRecognitionCtor() !== null)
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text.replace(/\[\d+\]/g, '').replace(/\*\*/g, ''))
    u.rate = large ? 0.9 : 1
    window.speechSynthesis.speak(u)
  }, [large])

  const send = useCallback(
    async (question: string, via: 'text' | 'voice') => {
      const q = question.trim()
      if (!q || thinking) return
      const history = turnsRef.current.slice(-10).map((t) => ({ role: t.role, content: t.content }))
      setTurns((t) => [...t, { role: 'user', content: q }])
      setInput('')
      setThinking(true)
      try {
        const res = await fetch('/api/admin/intelligence/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, history, via }),
        })
        const data = await res.json()
        if (!res.ok) {
          setTurns((t) => [...t, { role: 'assistant', content: data.error || 'Something went wrong. Try again.', isError: true }])
        } else {
          setTurns((t) => [...t, { role: 'assistant', content: data.answer, citations: data.citations, answeredBy: data.answered_by }])
          if (via === 'voice' && speakAnswers) speak(data.answer)
        }
      } catch {
        setTurns((t) => [...t, { role: 'assistant', content: 'Could not reach Intelligence. Check your connection.', isError: true }])
      } finally {
        setThinking(false)
      }
    },
    [thinking, speakAnswers, speak]
  )

  const makeRecognizer = useCallback((continuous: boolean) => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return null
    const r = new Ctor()
    r.lang = 'en-US'
    r.continuous = continuous
    r.interimResults = !continuous
    // Prefer on-device recognition where the browser supports it, so the
    // audio does not leave the computer.
    if ('processLocally' in r) r.processLocally = true
    return r
  }, [])

  // Tap-to-talk (the default).
  const toggleMic = useCallback(() => {
    if (listening) {
      recRef.current?.stop()
      return
    }
    wakeRecRef.current?.abort()
    const r = makeRecognizer(false)
    if (!r) return
    let finalText = ''
    r.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) finalText += res[0].transcript
        else interim += res[0].transcript
      }
      setInput((finalText + interim).trim())
    }
    r.onerror = () => setListening(false)
    r.onend = () => {
      setListening(false)
      if (finalText.trim()) void send(finalText, 'voice')
    }
    recRef.current = r
    setListening(true)
    r.start()
  }, [listening, makeRecognizer, send])

  // Optional wake phrase: listens only while the tab is visible.
  useEffect(() => {
    if (!wakeEnabled || !voiceSupported) return
    const phrase = wakePhrase.trim().toLowerCase()
    if (!phrase) return
    let stopped = false
    const start = () => {
      if (stopped || document.visibilityState !== 'visible' || listening) return
      const r = makeRecognizer(true)
      if (!r) return
      r.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]
          if (!res.isFinal) continue
          const said = res[0].transcript.toLowerCase()
          const at = said.indexOf(phrase)
          if (at >= 0) {
            const rest = res[0].transcript.slice(at + phrase.length).replace(/^[\s,.!?]+/, '')
            if (rest.trim().length > 3) void send(rest, 'voice')
            else {
              r.abort()
              toggleMic()
            }
          }
        }
      }
      r.onend = () => { if (!stopped) setTimeout(start, 500) }
      r.onerror = () => {}
      wakeRecRef.current = r
      try { r.start() } catch { /* already started */ }
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') start()
      else wakeRecRef.current?.abort()
    }
    start()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', onVis)
      wakeRecRef.current?.abort()
    }
  }, [wakeEnabled, wakePhrase, voiceSupported, listening, makeRecognizer, send, toggleMic])

  const saveSettings = async () => {
    setSettingsMsg('Saving…')
    const { error } = await createClient().rpc('vs_set_my_voice_settings', {
      p_wake_phrase_enabled: wakeEnabled,
      p_wake_phrase: wakePhrase,
      p_speak_answers: speakAnswers,
    })
    setSettingsMsg(error ? `Could not save: ${error.message}` : 'Saved.')
  }


  return (
    <section
      aria-label="Ask Intelligence"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(10, 10, 10, 0.08)',
        borderTop: '3px solid #CE1126',
        borderRadius: '4px',
        padding: large ? '32px' : '24px',
        marginBottom: '32px',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      {greeting && (
        <h2 style={{ fontSize: `${base + 8}px`, fontWeight: 600, color: '#0A0A0A', margin: '0 0 16px', fontFamily: '"DM Serif Display", Georgia, serif' }}>
          {greeting}
        </h2>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send(input, 'text')
        }}
        style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? 'Listening… speak your question' : 'Ask anything — "How many clients are enrolled?"'}
          aria-label="Your question"
          disabled={thinking}
          style={{
            flex: 1,
            fontSize: `${base}px`,
            padding: large ? '18px 20px' : '14px 16px',
            border: '1px solid rgba(10, 10, 10, 0.18)',
            borderRadius: '4px',
            fontFamily: 'Georgia, serif',
            color: '#0A0A0A',
            minWidth: 0,
          }}
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? 'Stop listening' : 'Tap to talk'}
            title={listening ? 'Stop listening' : 'Tap to talk'}
            style={{
              width: large ? '68px' : '56px',
              borderRadius: '50%',
              border: 'none',
              background: listening ? '#0A2548' : '#CE1126',
              color: '#FFFFFF',
              fontSize: `${base + 4}px`,
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: listening ? '0 0 0 6px rgba(206, 17, 38, 0.25)' : 'none',
            }}
          >
            {listening ? '■' : '🎤'}
          </button>
        )}
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          style={{
            padding: '0 22px',
            background: !input.trim() || thinking ? 'rgba(10, 10, 10, 0.3)' : '#0A2548',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            fontSize: `${base - 2}px`,
            fontFamily: 'Georgia, serif',
            cursor: 'pointer',
          }}
        >
          {thinking ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '13px', color: 'rgba(10,10,10,0.6)' }}>
        <span>
          {wakeEnabled && voiceSupported
            ? `Listening for “${wakePhrase}” while this page is open.`
            : voiceSupported
              ? 'Tap the microphone to talk.'
              : 'Voice is not available in this browser — typing works.'}
        </span>
        <button type="button" onClick={() => setSettingsOpen((o) => !o)} style={{ background: 'none', border: 'none', color: '#CE1126', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '13px' }}>
          Voice settings
        </button>
      </div>

      {settingsOpen && (
        <div style={{ marginTop: '12px', padding: '14px', background: '#FAFAF8', border: '1px solid rgba(10,10,10,0.08)', borderRadius: '4px', fontSize: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" checked={speakAnswers} onChange={(e) => setSpeakAnswers(e.target.checked)} /> Read answers aloud when I ask by voice
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" checked={wakeEnabled} onChange={(e) => setWakeEnabled(e.target.checked)} /> Listen for a wake phrase on this computer (off by default — avoid on shared office computers)
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Wake phrase:{' '}
            <input value={wakePhrase} onChange={(e) => setWakePhrase(e.target.value)} maxLength={40} style={{ fontSize: '15px', padding: '4px 8px', fontFamily: 'Georgia, serif' }} />
          </label>
          <button type="button" onClick={saveSettings} style={{ padding: '6px 14px', background: '#0A2548', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Save
          </button>{' '}
          <span style={{ fontSize: '13px' }}>{settingsMsg}</span>
        </div>
      )}

      {(turns.length > 0 || thinking) && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }} aria-live="polite">
          {turns.slice(-6).map((t, i) => (
            <div
              key={i}
              style={{
                alignSelf: t.role === 'user' ? 'flex-end' : 'stretch',
                background: t.role === 'user' ? '#0A2548' : t.isError ? '#FDECEE' : '#FAFAF8',
                color: t.role === 'user' ? '#FFFFFF' : '#0A0A0A',
                padding: '12px 16px',
                borderRadius: '4px',
                fontSize: `${base - 2}px`,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                maxWidth: t.role === 'user' ? '80%' : '100%',
              }}
            >
              {t.content}
              {t.role === 'assistant' && !t.isError && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'rgba(10,10,10,0.6)' }}>
                  {t.citations && t.citations.length > 0 && (
                    <div>Sources: {t.citations.slice(0, 6).map((c, j) => `[${j + 1}] ${citationLabel(c)}`).join('  ·  ')}</div>
                  )}
                  <button type="button" onClick={() => speak(t.content)} style={{ background: 'none', border: 'none', color: '#CE1126', cursor: 'pointer', padding: 0, marginTop: '4px', fontFamily: 'Georgia, serif', fontSize: '13px' }}>
                    🔊 Read aloud
                  </button>
                </div>
              )}
            </div>
          ))}
          {thinking && <div style={{ fontSize: `${base - 2}px`, color: 'rgba(10,10,10,0.5)' }}>Thinking…</div>}
        </div>
      )}
    </section>
  )
}
