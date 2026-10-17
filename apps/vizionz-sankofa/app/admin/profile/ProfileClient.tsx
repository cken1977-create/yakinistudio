'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Field, Notice, SectionLabel, inputStyle, primaryBtn } from '@/components/admin/ui'

export function ProfileClient({
  displayName,
  voice,
}: {
  displayName: string
  voice: { wakePhraseEnabled: boolean; wakePhrase: string | null; speakAnswers: boolean }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(displayName)
  const [wake, setWake] = useState(voice.wakePhraseEnabled)
  const [phrase, setPhrase] = useState(voice.wakePhrase ?? '')
  const [speak, setSpeak] = useState(voice.speakAnswers)
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)

  function save() {
    if (!name.trim()) return setMsg({ tone: 'red', text: 'Enter the name people should see.' })
    setMsg(null)
    startTransition(async () => {
      const supabase = createClient()
      const a = await supabase.rpc('vs_update_my_profile', { p_display_name: name.trim() })
      if (a.error) return setMsg({ tone: 'red', text: `Could not save your name: ${a.error.message}` })
      const b = await supabase.rpc('vs_set_my_voice_settings', {
        p_wake_phrase_enabled: wake,
        p_wake_phrase: phrase.trim() || null,
        p_speak_answers: speak,
      })
      if (b.error) return setMsg({ tone: 'red', text: `Name saved; voice settings not saved: ${b.error.message}` })
      setMsg({ tone: 'green', text: 'Saved.' })
      router.refresh()
    })
  }

  return (
    <Card>
      <SectionLabel>Your details</SectionLabel>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Field label="Display name" hint="Shown in the top bar, on notes and in the audit log.">
        <input type="text" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} style={inputStyle} data-testid="profile-name" />
      </Field>
      <SectionLabel>Intelligence voice</SectionLabel>
      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', marginBottom: '10px' }}>
        <input type="checkbox" checked={wake} onChange={(e) => setWake(e.target.checked)} /> Listen for my wake phrase
      </label>
      {wake && (
        <Field label="Wake phrase">
          <input type="text" value={phrase} maxLength={40} onChange={(e) => setPhrase(e.target.value)} style={inputStyle} placeholder="Hey Sankofa" />
        </Field>
      )}
      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', marginBottom: '16px' }}>
        <input type="checkbox" checked={speak} onChange={(e) => setSpeak(e.target.checked)} /> Read answers aloud when I ask by voice
      </label>
      <button type="button" onClick={save} disabled={pending} style={primaryBtn(pending)} data-testid="profile-save">
        Save
      </button>
    </Card>
  )
}
