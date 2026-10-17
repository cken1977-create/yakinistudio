'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useUrlState } from '@/components/admin/nav/useUrlState'
import { Modal } from '@/components/admin/Modal'
import { Field, MONO, Meta, Notice, inputStyle, miniBtn, primaryBtn, secondaryBtn, textareaStyle } from '@/components/admin/ui'
import { createClient } from '@/lib/supabase/client'
import {
  CHANNEL_COLUMNS, CHAT_FILES_BUCKET, MAX_CHAT_FILE_BYTES, MAX_MESSAGE_LENGTH, MESSAGE_COLUMNS,
  channelTitle, chatFilePath, dmOther, looksLikeClientPii, mentionSegments, mergeMessages, parseMentions,
  type ChatChannel, type ChatMessage, type Person, type Unread,
} from '@/lib/chat/model'
import { formatMountain } from '../team/types'

const POLL_MS = 6000

export function ChatClient({ me, canManage, initialChannels, initialUnread, staff }: {
  me: string; canManage: boolean; initialChannels: ChatChannel[]; initialUnread: Unread[]; staff: Person[]
}) {
  const supabase = useMemo(() => createClient(), [])
  const [channels, setChannels] = useState(initialChannels)
  const [unread, setUnread] = useState(initialUnread)
  const office = channels.find((c) => c.slug === 'office') ?? channels.find((c) => c.kind === 'channel') ?? channels[0]
  const [cid, setCid] = useUrlState<string>('c', office?.id ?? '')
  const active = channels.find((c) => c.id === cid) ?? office
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [newDm, setNewDm] = useState('')
  const [channelModal, setChannelModal] = useState(false)
  const [pending, start] = useTransition()
  const listRef = useRef<HTMLDivElement>(null)
  const people = useMemo(() => new Map(staff.map((p) => [p.user_id, p])), [staff])
  const others = staff.filter((p) => p.user_id !== me)

  const refreshSide = useCallback(async () => {
    const [ch, un] = await Promise.all([
      supabase.from('vs_chat_channels').select(CHANNEL_COLUMNS).is('archived_at', null).order('name'),
      supabase.rpc('vs_chat_unread'),
    ])
    if (ch.data) setChannels(ch.data as ChatChannel[])
    if (un.data) setUnread(un.data as Unread[])
  }, [supabase])

  const load = useCallback(async (channelId: string) => {
    const { data, error } = await supabase.from('vs_chat_messages').select(MESSAGE_COLUMNS)
      .eq('channel_id', channelId).order('created_at', { ascending: false }).limit(150)
    if (error) { setErr(error.message); return }
    setMessages((cur) => {
      const same = cur.length > 0 && cur[0].channel_id === channelId
      return mergeMessages(same ? cur : [], (data ?? []) as ChatMessage[])
    })
  }, [supabase])

  const markRead = useCallback(async (channelId: string) => {
    await supabase.rpc('vs_chat_mark_read', { p_channel: channelId })
    setUnread((u) => u.filter((r) => r.channel_id !== channelId))
  }, [supabase])

  // Open a conversation: load, mark read, subscribe to Realtime, and poll as a fallback.
  useEffect(() => {
    if (!active) return
    const id = active.id
    setMessages([])
    void load(id).then(() => markRead(id))
    const rt = supabase.channel(`vs-chat-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vs_chat_messages', filter: `channel_id=eq.${id}` },
        (payload) => {
          const row = payload.new as ChatMessage | undefined
          if (row && row.id) { setMessages((cur) => mergeMessages(cur, [row])); void markRead(id) }
        })
      .subscribe()
    const t = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void load(id).then(() => markRead(id))
      void refreshSide()
    }, POLL_MS)
    return () => { clearInterval(t); void supabase.removeChannel(rt) }
  }, [active?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, active?.id])

  const unreadFor = (id: string) => unread.find((u) => u.channel_id === id)
  const officeChannels = channels.filter((c) => c.kind === 'channel')
  const dms = channels.filter((c) => c.kind === 'dm')
  const totalUnread = unread.reduce((n, u) => n + u.unread + u.mentions, 0)

  function openDm(userId: string) {
    if (!userId) return
    start(async () => {
      const { data, error } = await supabase.rpc('vs_chat_open_dm', { p_other: userId })
      if (error) { setErr(error.message); return }
      await refreshSide()
      setCid(data as string)
      setNewDm('')
    })
  }

  const sideList = (
    <nav aria-label="Conversations" data-testid="chat-sidebar" style={{ display: 'grid', gap: '14px' }}>
      <div>
        <div style={{ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.55)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
          Channels {canManage && <button type="button" onClick={() => setChannelModal(true)} style={{ ...miniBtn(), padding: '0 6px' }} aria-label="New channel">+</button>}
        </div>
        {officeChannels.map((c) => <ConvButton key={c.id} c={c} me={me} people={people} active={c.id === active?.id} u={unreadFor(c.id)} onClick={() => setCid(c.id)} />)}
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.55)', marginBottom: '6px' }}>Direct messages</div>
        {dms.map((c) => <ConvButton key={c.id} c={c} me={me} people={people} active={c.id === active?.id} u={unreadFor(c.id)} onClick={() => setCid(c.id)} />)}
        <select aria-label="Message someone" value={newDm} disabled={pending} onChange={(e) => { setNewDm(e.target.value); openDm(e.target.value) }}
          style={{ ...inputStyle, fontSize: '16px', marginTop: '6px' }}>
          <option value="">+ Message someone…</option>
          {others.map((p) => <option key={p.user_id} value={p.user_id}>{p.display_name}</option>)}
        </select>
      </div>
    </nav>
  )

  return (
    <>
      <style>{`
        .vs-chat { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 20px; align-items: start; }
        .vs-chat-side-mobile { display: none; }
        @media (max-width: 760px) {
          .vs-chat { grid-template-columns: minmax(0, 1fr); }
          .vs-chat-side-desktop { display: none; }
          .vs-chat-side-mobile { display: block; }
        }
      `}</style>
      <div data-testid="chat-pii-note" role="note" style={{ marginBottom: '14px' }}>
        <Notice tone="amber">
          Chat is for office coordination. Please don&apos;t put client names, case details, dates of birth, SSNs or Medicaid numbers here; use the client&apos;s record instead. Chat, including deleted messages, is kept in the audit log.
        </Notice>
      </div>
      {err && <div role="alert" style={{ marginBottom: '12px' }}><Notice tone="red">{err}</Notice></div>}
      <div className="vs-chat">
        <aside className="vs-chat-side-desktop">{sideList}</aside>
        <details className="vs-chat-side-mobile" style={{ border: '1px solid rgba(10,10,10,0.12)', borderRadius: '8px', padding: '10px 12px', background: '#FFFFFF' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '15px', minHeight: '28px' }}>
            {active ? channelTitle(active, me, people) : 'Conversations'}{totalUnread > 0 ? ` · ${totalUnread} unread` : ''} (switch)
          </summary>
          <div style={{ marginTop: '10px' }}>{sideList}</div>
        </details>
        {active ? (
          <section data-testid="chat-pane" aria-label={channelTitle(active, me, people)} style={{ background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.1)', borderRadius: '8px', display: 'flex', flexDirection: 'column', minHeight: '420px' }}>
            <header style={{ padding: '12px 16px', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
              <div style={{ fontWeight: 600, fontSize: '16px' }} data-testid="chat-title">{channelTitle(active, me, people)}</div>
              {active.topic && <Meta>{active.topic}</Meta>}
              {active.kind === 'dm' && <Meta>Only you and {people.get(dmOther(active, me) ?? '')?.display_name ?? 'them'} can see this conversation.</Meta>}
            </header>
            <div ref={listRef} data-testid="chat-messages" style={{ flex: 1, overflowY: 'auto', maxHeight: '60vh', padding: '12px 16px', display: 'grid', gap: '10px', alignContent: 'start' }}>
              {messages.length === 0 && <Meta>No messages yet. Say hello.</Meta>}
              {messages.map((m) => (
                <MessageItem key={m.id} m={m} me={me} canManage={canManage} staff={staff} supabase={supabase}
                  onChanged={() => void load(active.id)} onError={setErr} />
              ))}
            </div>
            <Composer channelId={active.id} staff={others} supabase={supabase} onSent={() => void load(active.id)} onError={setErr} />
          </section>
        ) : (
          <Meta>No conversations yet.</Meta>
        )}
      </div>
      {channelModal && <ChannelModal onClose={() => setChannelModal(false)} supabase={supabase}
        onCreated={async (id) => { setChannelModal(false); await refreshSide(); setCid(id) }} />}
    </>
  )
}

function ConvButton({ c, me, people, active, u, onClick }: {
  c: ChatChannel; me: string; people: Map<string, Person>; active: boolean; u: Unread | undefined; onClick: () => void
}) {
  const count = u ? u.unread : 0
  return (
    <button type="button" onClick={onClick} data-testid="chat-conv" aria-current={active ? 'page' : undefined}
      style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '8px', textAlign: 'left',
        minHeight: '40px', padding: '6px 10px', marginBottom: '2px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px',
        background: active ? 'rgba(10,37,72,0.08)' : 'transparent', fontWeight: count || u?.mentions ? 700 : 500, color: '#0A0A0A', fontFamily: 'inherit' }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channelTitle(c, me, people)}</span>
      <span style={{ display: 'flex', gap: '4px' }}>
        {u && u.mentions > 0 && <span data-testid="chat-mention-badge" style={{ background: '#CE1126', color: '#FFF', borderRadius: '10px', fontSize: '11px', padding: '1px 6px' }}>@{u.mentions}</span>}
        {count > 0 && <span data-testid="chat-unread-badge" style={{ background: '#0A2548', color: '#FFF', borderRadius: '10px', fontSize: '11px', padding: '1px 6px' }}>{count}</span>}
      </span>
    </button>
  )
}

type Sb = ReturnType<typeof createClient>

function MessageItem({ m, me, canManage, staff, supabase, onChanged, onError }: {
  m: ChatMessage; me: string; canManage: boolean; staff: Person[]; supabase: Sb; onChanged: () => void; onError: (e: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(m.body)
  const [busy, setBusy] = useState(false)
  const mine = m.author_id === me
  const mentionsMe = m.mentions?.includes(me)
  if (m.deleted_at) {
    return <div data-testid="chat-message" data-deleted="yes" style={{ fontSize: '13px', color: 'rgba(10,10,10,0.45)', fontStyle: 'italic' }}>Message deleted · {formatMountain(m.deleted_at)}</div>
  }
  async function del() {
    if (!window.confirm('Delete this message? It disappears from chat but is kept in the audit log.')) return
    setBusy(true)
    const { data, error } = await supabase.rpc('vs_chat_delete_message', { p_message: m.id })
    if (error) onError(error.message)
    else if (data) await supabase.storage.from(CHAT_FILES_BUCKET).remove([data as string])
    setBusy(false); onChanged()
  }
  async function save() {
    setBusy(true)
    const { error } = await supabase.rpc('vs_chat_edit_message', { p_message: m.id, p_body: text })
    if (error) onError(error.message)
    setBusy(false); setEditing(false); onChanged()
  }
  async function openFile() {
    if (!m.attachment_path) return
    const { data, error } = await supabase.storage.from(CHAT_FILES_BUCKET).createSignedUrl(m.attachment_path, 300)
    if (error || !data) onError(error?.message ?? 'Could not open the file.')
    else window.open(data.signedUrl, '_blank', 'noopener')
  }
  return (
    <div data-testid="chat-message" style={{ padding: '6px 8px', borderRadius: '6px', background: mentionsMe ? 'rgba(206,17,38,0.06)' : 'transparent', borderLeft: mentionsMe ? '3px solid #CE1126' : '3px solid transparent' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '14px' }}>{m.author_name ?? 'Former staff'}</strong>
        <Meta>{formatMountain(m.created_at)}{m.edited_at ? ' · edited' : ''}</Meta>
        {(mine || canManage) && !editing && (
          <span style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
            {mine && <button type="button" style={miniBtn(busy)} disabled={busy} onClick={() => setEditing(true)}>Edit</button>}
            <button type="button" style={miniBtn(busy, true)} disabled={busy} onClick={del} aria-label="Delete message">Delete</button>
          </span>
        )}
      </div>
      {editing ? (
        <div style={{ display: 'grid', gap: '6px', marginTop: '4px' }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_MESSAGE_LENGTH} style={{ ...textareaStyle, minHeight: '60px', fontSize: '16px' }} />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" style={miniBtn(busy)} disabled={busy} onClick={save}>Save</button>
            <button type="button" style={miniBtn()} onClick={() => { setEditing(false); setText(m.body) }}>Cancel</button>
          </div>
        </div>
      ) : (
        m.body && (
          <div style={{ fontSize: '15px', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {mentionSegments(m.body, staff).map((s, i) => s.mention
              ? <span key={i} style={{ color: '#CE1126', fontWeight: 600 }}>{s.text}</span>
              : <span key={i}>{s.text}</span>)}
          </div>
        )
      )}
      {m.attachment_path && (
        <button type="button" onClick={openFile} data-testid="chat-attachment" style={{ ...miniBtn(), marginTop: '4px' }}>
          📎 {m.attachment_name ?? 'file'}{m.attachment_size ? ` · ${Math.max(1, Math.round(m.attachment_size / 1024))} KB` : ''}
        </button>
      )}
    </div>
  )
}

function Composer({ channelId, staff, supabase, onSent, onError }: {
  channelId: string; staff: Person[]; supabase: Sb; onSent: () => void; onError: (e: string) => void
}) {
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [piiWarn, setPiiWarn] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const token = /(^|\s)@([\w' -]{0,30})$/.exec(body)
  const suggestions = token ? staff.filter((p) => p.display_name.toLowerCase().startsWith(token[2].toLowerCase())).slice(0, 5) : []

  async function send(force = false) {
    const text = body.trim()
    if (!text && !file) return
    if (!force && looksLikeClientPii(text)) { setPiiWarn(true); return }
    setBusy(true); setPiiWarn(false)
    let attachment: Record<string, unknown> = {}
    if (file) {
      if (file.size > MAX_CHAT_FILE_BYTES) { onError('That file is over 25 MB.'); setBusy(false); return }
      const path = chatFilePath(channelId, file.name, crypto.randomUUID())
      const { error } = await supabase.storage.from(CHAT_FILES_BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream' })
      if (error) { onError(error.message); setBusy(false); return }
      attachment = { attachment_path: path, attachment_name: file.name.slice(0, 200), attachment_size: file.size, attachment_mime: file.type || null }
    }
    const { error } = await supabase.from('vs_chat_messages').insert({ channel_id: channelId, body: text, mentions: parseMentions(text, staff), ...attachment })
    if (error) onError(error.message)
    else { setBody(''); setFile(null); if (fileRef.current) fileRef.current.value = '' }
    setBusy(false); onSent()
  }

  return (
    <form data-testid="chat-composer" onSubmit={(e) => { e.preventDefault(); void send() }}
      style={{ borderTop: '1px solid rgba(10,10,10,0.08)', padding: '12px 16px', display: 'grid', gap: '8px' }}>
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} aria-label="Mention suggestions">
          {suggestions.map((p) => (
            <button key={p.user_id} type="button" data-testid="mention-suggestion" style={miniBtn()}
              onClick={() => setBody(body.replace(/@([\w' -]{0,30})$/, `@${p.display_name} `))}>@{p.display_name}</button>
          ))}
        </div>
      )}
      <textarea aria-label="Message" value={body} maxLength={MAX_MESSAGE_LENGTH} placeholder="Write a message. Type @ to mention someone."
        onChange={(e) => { setBody(e.target.value); setPiiWarn(false) }}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
        style={{ ...textareaStyle, minHeight: '56px', fontSize: '16px' }} />
      {piiWarn && (
        <div role="alert" data-testid="chat-pii-warning"><Notice tone="red">
          This looks like it may include client details. Please put those in the client&apos;s record, not chat.{' '}
          <button type="button" style={miniBtn()} onClick={() => void send(true)}>Send anyway</button>
        </Notice></div>
      )}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ ...secondaryBtn(), minHeight: '44px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
          📎 {file ? file.name.slice(0, 24) : 'Attach'}
          <input ref={fileRef} type="file" data-testid="chat-file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
        </label>
        <button type="submit" disabled={busy || (!body.trim() && !file)} style={{ ...primaryBtn(busy || (!body.trim() && !file)), minHeight: '44px', marginLeft: 'auto' }}>
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  )
}

function ChannelModal({ onClose, onCreated, supabase }: { onClose: () => void; onCreated: (id: string) => void; supabase: Sb }) {
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <Modal title="New channel" subtitle="Channels are open to all active VS staff." onClose={onClose}>
      <form onSubmit={async (e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const name = String(fd.get('name') ?? '').trim().slice(0, 60)
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
        if (!slug) { setErr('Give the channel a name.'); return }
        setBusy(true)
        const { data, error } = await supabase.from('vs_chat_channels').insert({ kind: 'channel', name, slug, topic: String(fd.get('topic') ?? '').trim() || null }).select('id').single()
        setBusy(false)
        if (error) setErr(error.code === '23505' ? 'A channel with that name already exists.' : error.message)
        else onCreated(data.id as string)
      }} style={{ display: 'grid', gap: '12px' }}>
        <Field label="Name"><input name="name" required style={inputStyle} /></Field>
        <Field label="Topic (optional)"><input name="topic" style={inputStyle} /></Field>
        {err && <Notice tone="red">{err}</Notice>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtn()}>Cancel</button>
          <button type="submit" disabled={busy} style={primaryBtn(busy)}>{busy ? 'Saving…' : 'Create channel'}</button>
        </div>
      </form>
    </Modal>
  )
}
