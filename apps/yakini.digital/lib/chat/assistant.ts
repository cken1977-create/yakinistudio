/**
 * Persona and asset paths for the public site helper.
 * Swap name, role, portrait, loop, or voice id here — the chat UI, launcher, prompts, and avatar all read this file.
 * Stills and loops live in /public/helper/.
 */
export const ASSISTANT = {
  name: 'Nikki',
  role: "Yakini's virtual assistant",
  /** Always spell the company name Yakini. For speech, use yakiniSaid (yah-KEE-nee). */
  yakiniSpelling: 'Yakini',
  yakiniSaid: 'Yah-KEE-nee',
  avatarSrc: '/helper/nikki.webp',
  avatarFallbackSrc: '/helper/nikki.jpg',
  avatarSrcSmall: '/helper/nikki-128.webp',
  avatarFallbackSmall: '/helper/nikki-128.jpg',
  avatarAlt: "Nikki, Yakini's virtual assistant",
  loopMp4: '/helper/nikki-loop.mp4',
  loopWebm: '/helper/nikki-loop.webm',
  loopReady: true,
  /**
   * ElevenLabs voice id, overridable with ELEVENLABS_VOICE_ID.
   * Left empty until Clarence picks a sample; the speak route uses the env id, then this, then a warm female default.
   */
  elevenLabsVoiceId: '',
  greeting:
    "Hi — I'm Nikki, Yakini's virtual assistant. I can help with pricing, show you a kit in your brand, or get you to a real person. What can I help with?",
} as const

export type AssistantPersona = typeof ASSISTANT
