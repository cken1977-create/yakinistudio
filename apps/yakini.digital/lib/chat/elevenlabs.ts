import { ASSISTANT } from './assistant'
import { forSpeech } from './speech'

const TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech'

export function elevenLabsKey(): string {
  return (process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY || '').trim()
}

export function hasElevenLabsKey(): boolean {
  return elevenLabsKey().length > 0
}

export function voiceId(): string {
  return (process.env.ELEVENLABS_VOICE_ID || ASSISTANT.elevenLabsVoiceId || 'EXAVITQu4vr4xnSDxMaL').trim()
}

/** Warm, low-latency spoken audio for a reply. Returns raw mp3 bytes, or null if no key / failure. */
export async function speakReply(text: string, timeoutMs = 8000): Promise<Buffer | null> {
  if (!hasElevenLabsKey()) return null
  const spoken = forSpeech(text).slice(0, 600)
  if (!spoken) return null
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(`${TTS_URL}/${encodeURIComponent(voiceId())}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey(),
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: spoken,
        model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5',
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
      }),
      signal: ac.signal,
    })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    return buf.length ? buf : null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}
