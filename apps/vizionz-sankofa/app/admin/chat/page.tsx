// VIZIONZ SANKOFA · /admin/chat: inter-office chat (all active staff).
// Fully in-house: messages live in VS's Supabase and update over Supabase
// Realtime. Office channels are open to staff; direct messages only to the
// two people in them. Deletions are kept in the audit log.

import { redirect } from 'next/navigation'
import { requireOperatorOrEmployee, touchLastActive, getAccessRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { Notice, PageIntro, isMissingTable } from '@/components/admin/ui'
import { loadStaff } from '@/lib/crm/load'
import { CHANNEL_COLUMNS, type ChatChannel, type Unread } from '@/lib/chat/model'
import { ChatClient } from './ChatClient'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  if (!role) redirect('/admin/access-denied')
  const supabase = await createClient()
  const [channels, unread, staff] = await Promise.all([
    supabase.from('vs_chat_channels').select(CHANNEL_COLUMNS).is('archived_at', null).order('name'),
    supabase.rpc('vs_chat_unread'),
    loadStaff(supabase),
  ])

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'Chat' }]} fallbackHref="/admin" fallbackLabel="Operations" />
      <PageIntro kicker="Chat" title="Office chat" />
      {isMissingTable(channels.error) ? (
        <Notice tone="amber">Chat isn&apos;t set up in the database yet. Paste <code>20261017002400</code>, <code>002500</code> and <code>002600</code> in order.</Notice>
      ) : (
        <ChatClient
          me={user.id}
          canManage={role === 'executive' || role === 'operator'}
          initialChannels={(channels.data ?? []) as ChatChannel[]}
          initialUnread={(unread.data ?? []) as Unread[]}
          staff={staff.map((s) => ({ user_id: s.user_id, display_name: s.display_name, access_role: s.access_role }))}
        />
      )}
    </div>
  )
}
