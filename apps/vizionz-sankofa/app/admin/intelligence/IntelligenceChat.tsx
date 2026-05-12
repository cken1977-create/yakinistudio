'use client'

// VIZIONZ SANKOFA · Yakini Intelligence chat surface (Wave 3.4)
//
// Client component. Operator types a question, hits send, watches Yakini
// Intelligence think, reads the grounded answer with source citations.
//
// Multi-turn within a single page load (full conversation history sent with
// each request). No persistence yet — page reload starts fresh. Wave 3.5
// will add chat history persistence if operators ask for it.

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────

type Citation = {
  source_type: 'document' | 'intake'
  document_id?: string
  document_title?: string
  document_file_name?: string
  source_ref?: string | null
  chunk_index?: number
  similarity?: number
  intake_id?: string
  intake_label?: string
}

type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; citations: Citation[]; isError?: boolean }

// ─── Component ───────────────────────────────────────────────────────────

export function IntelligenceChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom whenever messages change.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  const send = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isThinking) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsThinking(true)

    // Build history for the API (everything except the new question).
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const response = await fetch('/api/admin/intelligence/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, history }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessages([
          ...nextMessages,
          {
            role: 'assistant',
            content:
              data.error ||
              'Yakini Intelligence could not complete that request. Try again.',
            citations: [],
            isError: true,
          },
        ])
      } else {
        setMessages([
          ...nextMessages,
          {
            role: 'assistant',
            content: data.answer || '(empty response)',
            citations: data.citations || [],
          },
        ])
      }
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content:
            'Could not reach Yakini Intelligence. Check your connection and try again.',
          citations: [],
          isError: true,
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }, [input, isThinking, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (Shift+Enter for newline).
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '600px',
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(10, 10, 10, 0.08)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      {/* Messages area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.length === 0 && !isThinking && <EmptyState />}

        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}

        {isThinking && <ThinkingBubble />}
      </div>

      {/* Composer */}
      <div
        style={{
          borderTop: '1px solid rgba(10, 10, 10, 0.08)',
          padding: '16px 20px',
          background: '#FFFFFF',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Yakini Intelligence anything about your organization..."
          disabled={isThinking}
          rows={1}
          style={{
            flex: 1,
            border: '1px solid rgba(10, 10, 10, 0.12)',
            borderRadius: '2px',
            padding: '10px 14px',
            fontSize: '14px',
            lineHeight: 1.5,
            color: '#0A0A0A',
            background: '#FFFFFF',
            outline: 'none',
            resize: 'none',
            minHeight: '40px',
            maxHeight: '160px',
            fontFamily: 'inherit',
            opacity: isThinking ? 0.5 : 1,
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || isThinking}
          style={{
            padding: '10px 18px',
            background:
              !input.trim() || isThinking ? 'rgba(10, 10, 10, 0.3)' : '#5B2C8F',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '2px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            cursor:
              !input.trim() || isThinking ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          {isThinking ? 'Thinking…' : 'Ask'}
        </button>
      </div>
    </div>
  )
}

// ─── Subcomponents ───────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#5B2C8F',
          marginBottom: '12px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        Yakini Intelligence
      </div>
      <div
        style={{
          fontSize: '15px',
          lineHeight: 1.55,
          color: 'rgba(10, 10, 10, 0.55)',
          maxWidth: '420px',
        }}
      >
        Ask anything about your organization. I read your documents and intake
        records to give you grounded answers with source citations.
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const isError = message.role === 'assistant' && message.isError

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div style={{ maxWidth: '85%' }}>
        <div
          style={{
            padding: '12px 16px',
            background: isUser
              ? '#0A2548'
              : isError
              ? 'rgba(206, 17, 38, 0.08)'
              : '#FFFFFF',
            color: isUser ? '#FFFFFF' : '#0A0A0A',
            borderRadius: '2px',
            borderLeft: !isUser && !isError ? '3px solid #5B2C8F' : undefined,
            border: isError ? '1px solid #CE1126' : undefined,
            fontSize: '14px',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </div>

        {message.role === 'assistant' &&
          !message.isError &&
          message.citations.length > 0 && (
            <CitationsList citations={message.citations} />
          )}
      </div>
    </div>
  )
}

function CitationsList({ citations }: { citations: Citation[] }) {
  return (
    <div
      style={{
        marginTop: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
      }}
    >
      {citations.map((c, i) => (
        <CitationChip key={i} index={i + 1} citation={c} />
      ))}
    </div>
  )
}

function CitationChip({
  index,
  citation,
}: {
  index: number
  citation: Citation
}) {
  const href =
    citation.source_type === 'document'
      ? `/admin/documents`
      : `/admin/intakes`

  const label =
    citation.source_type === 'document'
      ? `${citation.document_title}${
          citation.source_ref ? ` · ${citation.source_ref}` : ''
        }`
      : citation.intake_label || 'Intake record'

  return (
    <a
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        background: 'rgba(91, 44, 143, 0.08)',
        border: '1px solid rgba(91, 44, 143, 0.2)',
        borderRadius: '2px',
        fontSize: '11px',
        fontWeight: 500,
        color: '#5B2C8F',
        textDecoration: 'none',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontWeight: 700 }}>[{index}]</span>
      <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </a>
  )
}

function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          maxWidth: '85%',
          padding: '12px 16px',
          background: '#FFFFFF',
          borderLeft: '3px solid #5B2C8F',
          fontSize: '14px',
          color: 'rgba(10, 10, 10, 0.55)',
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#5B2C8F',
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
        Yakini Intelligence is thinking…
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}
