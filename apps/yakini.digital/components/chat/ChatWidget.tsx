'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { ASSISTANT } from '@/lib/chat/assistant'
import { AssistantAvatar } from '@/components/chat/AssistantAvatar'
import { CHAT_CSS } from '@/components/chat/chat-css'

type Link = { href: string; label: string }
type Msg = { role: 'user' | 'assistant'; text: string; links?: Link[] }

const CHIPS = [
  'How much does it cost?',
  'Show me the food truck example',
  'How do I see my kit?',
  'Are you a real person?',
]

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', text: ASSISTANT.greeting, links: [{ href: '/demo', label: 'See your kit' }, { href: '/apply', label: 'Book a call' }] }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [talk, setTalk] = useState(false)
  const [tts, setTts] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [leadOpen, setLeadOpen] = useState(false)
  const [lead, setLead] = useState({ name: '', email: '', message: '' })
  const [leadNote, setLeadNote] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const recRef = useRef<Rec | null>(null)
  const barge = useRef(0)

  useEffect(() => {
    fetch('/api/chat/status')
      .then((r) => r.json())
      .then((s) => setTts(Boolean(s.tts)))
      .catch(() => setTts(false))
  }, [])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const stopVoice = () => {
    barge.current += 1
    recRef.current?.abort()
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
    }
    setSpeaking(false)
  }

  const attachAnalyser = (audio: HTMLAudioElement) => {
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext()
      const ctx = ctxRef.current
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      const src = ctx.createMediaElementSource(audio)
      src.connect(analyser)
      analyser.connect(ctx.destination)
      analyserRef.current = analyser
    } catch {
      /* already connected or blocked */
    }
  }

  const playText = async (text: string) => {
    if (!tts || !text) return
    const token = ++barge.current
    stopVoice()
    barge.current = token
    try {
      const res = await fetch('/api/chat/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok || token !== barge.current) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      attachAnalyser(audio)
      setSpeaking(true)
      await audio.play()
      await new Promise((resolve) => {
        audio.onended = () => resolve(null)
        audio.onerror = () => resolve(null)
      })
    } catch {
      /* ignore */
    } finally {
      if (token === barge.current) setSpeaking(false)
    }
  }

  const ask = async (text: string) => {
    const question = text.trim()
    if (!question || busy) return
    stopVoice()
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: question }])
    setBusy(true)
    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.text }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history, stream: true }),
      })
      const type = res.headers.get('content-type') || ''
      if (type.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buf = ''
        let full = ''
        let links: Link[] | undefined
        setMessages((m) => [...m, { role: 'assistant', text: '' }])
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          const parts = buf.split('\n\n')
          buf = parts.pop() || ''
          for (const part of parts) {
            const line = part.split('\n').find((l) => l.startsWith('data:'))
            if (!line) continue
            let data: { type: string; text?: string; links?: Link[] }
            try { data = JSON.parse(line.slice(5).trim()) } catch { continue }
            if (data.type === 'token' && data.text) {
              full += data.text
              const snapshot = full
              setMessages((m) => {
                const next = m.slice()
                next[next.length - 1] = { role: 'assistant', text: snapshot, links }
                return next
              })
            }
            if (data.type === 'done' && data.text) {
              full = data.text
              links = data.links
            }
          }
        }
        const finalText = full.trim()
        setMessages((m) => {
          const next = m.slice()
          next[next.length - 1] = { role: 'assistant', text: finalText, links }
          return next
        })
        if (talk && finalText) {
          await playText(finalText)
          if (talk) listen()
        }
      } else {
        const data = await res.json()
        const reply: Msg = { role: 'assistant', text: data.text || 'Please try that again, or book a call.', links: data.links }
        setMessages((m) => [...m, reply])
        if (talk && reply.text) {
          await playText(reply.text)
          if (talk) listen()
        }
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: "I couldn't reach the helper just then. You can book a call or try again.", links: [{ href: '/apply', label: 'Book a call' }] }])
    } finally {
      setBusy(false)
    }
  }

  const listen = () => {
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return
    stopVoice()
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    recRef.current = rec
    rec.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
      text = text.trim()
      setInput(text)
      if (e.results[e.results.length - 1].isFinal) ask(text)
    }
    rec.start()
  }

  const send = (e: FormEvent) => {
    e.preventDefault()
    ask(input)
  }

  const submitLead = async (e: FormEvent) => {
    e.preventDefault()
    setLeadNote('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          service: 'Chat with Nikki',
          message: lead.message || 'Follow up from the site chat.',
          source: 'chat',
        }),
      })
      if (!res.ok) throw new Error('fail')
      setLeadNote('Thanks — a real person will follow up. No automatic email is sent.')
      setLead({ name: '', email: '', message: '' })
    } catch {
      setLeadNote('We could not save that. Please use the contact form or try again.')
    }
  }

  return (
    <>
      <style>{CHAT_CSS}</style>
      {open ? (
        <section className="yk-chat-panel" role="dialog" aria-label={`${ASSISTANT.name}, ${ASSISTANT.role}`}>
          <header className="yk-chat-head">
            <AssistantAvatar size={64} speaking={speaking} analyser={analyserRef.current} />
            <div>
              <h2>{ASSISTANT.name}</h2>
              <p>{ASSISTANT.role}</p>
            </div>
            <button
              type="button"
              className="yk-chat-icon"
              aria-pressed={talk}
              title={talk ? 'Voice conversation on' : 'Talk with Nikki'}
              onClick={() => { setTalk((v) => !v); stopVoice() }}
            >
              {talk ? '🎙' : '○'}
            </button>
            <button type="button" className="yk-chat-x" aria-label="Close chat" onClick={() => { setOpen(false); stopVoice() }}>✕</button>
          </header>
          <div className="yk-chat-log" ref={logRef}>
            {messages.map((m, i) => (
              <div key={i} className={`yk-chat-msg ${m.role}`}>
                <div>{m.text}</div>
                {m.role === 'assistant' ? (
                  <div className="yk-chat-links">
                    <button type="button" className="yk-chat-hear" disabled={!tts || !m.text} onClick={() => playText(m.text)} aria-label="Hear this reply">
                      Hear Nikki
                    </button>
                    {m.links?.map((l) => (
                      <a key={l.href} href={l.href}>{l.label}</a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {busy ? <div className="yk-chat-msg assistant">One moment…</div> : null}
          </div>
          <div className="yk-chat-chips">
            {CHIPS.map((c) => (
              <button key={c} type="button" onClick={() => ask(c)}>{c}</button>
            ))}
          </div>
          <form className="yk-chat-form" onSubmit={send}>
            <button type="button" aria-label="Speak" onClick={listen}>🎙</button>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Nikki…" aria-label="Ask Nikki a question" maxLength={500} />
            <button type="submit" disabled={busy}>Send</button>
          </form>
          <div className="yk-chat-lead">
            <button type="button" onClick={() => setLeadOpen((v) => !v)} style={{ background: 'transparent', color: '#C6F432', border: 0, padding: 0, cursor: 'pointer' }}>
              Want a real person to follow up?
            </button>
            {leadOpen ? (
              <form onSubmit={submitLead}>
                <input required placeholder="Your name" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
                <input required type="email" placeholder="Email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
                <input placeholder="Anything we should know" value={lead.message} onChange={(e) => setLead({ ...lead, message: e.target.value })} />
                <button type="submit">Send to Yakini</button>
                {leadNote ? <p>{leadNote}</p> : <p>This is a quote request, not a charge. No automatic email is sent.</p>}
              </form>
            ) : null}
          </div>
        </section>
      ) : (
        <button type="button" className="yk-chat-launch" onClick={() => setOpen(true)} aria-label={`Chat with ${ASSISTANT.name}, ${ASSISTANT.role}`}>
          <AssistantAvatar size={48} />
          <span className="yk-chat-launch-txt">
            <b>Ask {ASSISTANT.name}</b>
            <span>{ASSISTANT.role}</span>
          </span>
        </button>
      )}
    </>
  )
}

type Rec = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: { length: number; [i: number]: { 0: { transcript: string }; isFinal?: boolean } } }) => void) | null
  start: () => void
  abort: () => void
}
