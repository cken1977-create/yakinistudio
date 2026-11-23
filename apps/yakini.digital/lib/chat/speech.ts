import { ASSISTANT } from './assistant'

/** Rewrite spoken text so ElevenLabs says Yakini as yah-KEE-nee, without changing on-screen spelling. */
export function forSpeech(text: string): string {
  return String(text || '').replace(/\bYakini\b/g, ASSISTANT.yakiniSaid)
}
