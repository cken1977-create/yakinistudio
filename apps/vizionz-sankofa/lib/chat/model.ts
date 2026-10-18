// VIZIONZ SANKOFA · inter-office chat model (pure).

export const CHAT_FILES_BUCKET = 'vs-chat-files'
export const MAX_CHAT_FILE_BYTES = 25 * 1024 * 1024
export const MAX_MESSAGE_LENGTH = 4000

export type ChatChannel = { id: string; kind: 'channel' | 'dm'; slug: string | null; name: string | null; topic: string | null; dm_key: string | null; archived_at: string | null }
export type ChatMember = { channel_id: string; user_id: string; last_read_at: string }
export type ChatMessage = {
  id: string; channel_id: string; author_id: string | null; author_name: string | null; body: string; mentions: string[]
  attachment_path: string | null; attachment_name: string | null; attachment_size: number | null; attachment_mime: string | null
  created_at: string; edited_at: string | null; deleted_at: string | null
}
export type Unread = { channel_id: string; unread: number; mentions: number }
export type Person = { user_id: string; display_name: string; access_role: string | null }

export const MESSAGE_COLUMNS = 'id, channel_id, author_id, author_name, body, mentions, attachment_path, attachment_name, attachment_size, attachment_mime, created_at, edited_at, deleted_at'
export const CHANNEL_COLUMNS = 'id, kind, slug, name, topic, dm_key, archived_at'

/** The other person in a DM (dm_key is "<uuid>:<uuid>"). */
export function dmOther(channel: Pick<ChatChannel, 'dm_key'>, me: string): string | null {
  if (!channel.dm_key) return null
  const [a, b] = channel.dm_key.split(':')
  return a === me ? b ?? null : a ?? null
}

export function channelTitle(channel: ChatChannel, me: string, people: Map<string, Person>): string {
  if (channel.kind === 'channel') return `# ${channel.name ?? channel.slug ?? 'channel'}`
  const other = dmOther(channel, me)
  return (other && people.get(other)?.display_name) || 'Direct message'
}

/** Find "@Display Name" mentions of known staff in a message body. Longest names win. */
export function parseMentions(body: string, people: Person[]): string[] {
  const found = new Set<string>()
  const lower = body.toLowerCase()
  const taken: Array<[number, number]> = []
  const sorted = [...people].filter((p) => p.display_name).sort((a, b) => b.display_name.length - a.display_name.length)
  for (const p of sorted) {
    const needle = '@' + p.display_name.toLowerCase()
    for (let i = lower.indexOf(needle); i !== -1; i = lower.indexOf(needle, i + 1)) {
      const end = i + needle.length
      const after = lower.charAt(end)
      if (after && /[a-z0-9]/.test(after)) continue
      if (taken.some(([s, e]) => i < e && end > s)) continue
      taken.push([i, end]); found.add(p.user_id)
    }
  }
  return [...found]
}

/** Split a body into text and @mention segments for display. */
export function mentionSegments(body: string, people: Person[]): Array<{ text: string; mention: boolean }> {
  const names = [...people].map((p) => p.display_name).filter(Boolean).sort((a, b) => b.length - a.length)
  if (names.length === 0) return [{ text: body, mention: false }]
  const esc = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`@(?:${esc.join('|')})(?![A-Za-z0-9])`, 'gi')
  const out: Array<{ text: string; mention: boolean }> = []
  let last = 0
  for (const m of body.matchAll(re)) {
    if (m.index! > last) out.push({ text: body.slice(last, m.index), mention: false })
    out.push({ text: m[0], mention: true })
    last = m.index! + m[0].length
  }
  if (last < body.length) out.push({ text: body.slice(last), mention: false })
  return out
}

export function chatFilePath(channelId: string, fileName: string, rand: string): string {
  const safe = fileName.normalize('NFKD').replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-').slice(-120) || 'file'
  return `${channelId}/${rand}/${safe}`
}

/** Merge a page of messages (e.g. from Realtime or a poll) into the list, newest last, no duplicates. */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((m) => [m.id, m]))
  for (const m of incoming) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
}

export function totalUnread(rows: Unread[]): { unread: number; mentions: number } {
  return rows.reduce((t, r) => ({ unread: t.unread + r.unread, mentions: t.mentions + r.mentions }), { unread: 0, mentions: 0 })
}

/** Messages that look like they hold client details (soft warning only). */
export function looksLikeClientPii(body: string): boolean {
  return /\b\d{3}-\d{2}-\d{4}\b/.test(body) // SSN pattern
    || /\b(dob|date of birth|medicaid|ssn)\b/i.test(body)
}
