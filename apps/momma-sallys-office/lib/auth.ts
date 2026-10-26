// Who is signed in, and what they may see. The database (RLS) is the real
// lock; these checks only decide which pages to render.
import 'server-only'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Member = { member_id: string; email: string; display_name: string | null; role: 'owner' | 'crew' }

export async function getMember(): Promise<Member | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  let { data } = await supabase.rpc('ms_me')
  if (!data?.length) {
    // First sign-in: claim the invite that matches this verified email.
    await supabase.rpc('ms_accept_invite')
    ;({ data } = await supabase.rpc('ms_me'))
  }
  return (data?.[0] as Member | undefined) ?? null
}

export async function requireMember(): Promise<Member> {
  const m = await getMember()
  if (!m) redirect('/login')
  return m
}

/** Crew get a plain 404 on owner pages, not a hint that the page exists. */
export async function requireOwner(): Promise<Member> {
  const m = await requireMember()
  if (m.role !== 'owner') notFound()
  return m
}
