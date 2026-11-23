'use client'

import { useEffect, useRef, useState } from 'react'
import { ASSISTANT } from '@/lib/chat/assistant'

type Props = {
  size: number
  speaking?: boolean
  analyser?: AnalyserNode | null
  className?: string
}

/**
 * Circular Destiny avatar. Idle: muted looping portrait (still if reduced-motion or the loop fails).
 * Speaking: the same face, with a light jaw motion driven by the live audio analyser (lip-sync).
 */
export function AssistantAvatar({ size, speaking = false, analyser, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()
  const useLoop = ASSISTANT.loopReady && !reduced

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null
    const draw = () => {
      const src = !reduced && videoRef.current && videoRef.current.readyState >= 2 ? videoRef.current : imgRef.current
      canvas.width = size * 2
      canvas.height = size * 2
      if (src) ctx.drawImage(src, 0, 0, canvas.width, canvas.height)
      if (speaking && analyser && data) {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const amp = Math.min(1, Math.sqrt(sum / data.length) * 4)
        if (amp > 0.04) {
          const midY = canvas.height * 0.68
          const band = canvas.height * 0.16
          const scale = 1 + amp * 0.14
          const w = canvas.width
          ctx.drawImage(canvas, 0, midY - band / 2, w, band, 0, midY - (band * scale) / 2, w, band * scale)
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [analyser, speaking, size, reduced])

  const onVideoError = () => {
    if (videoRef.current) videoRef.current.style.display = 'none'
  }

  return (
    <span className={`yk-av ${className || ''}`} style={{ width: size, height: size }} data-speaking={speaking ? 'true' : 'false'}>
      {useLoop ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={ASSISTANT.avatarFallbackSrc}
          aria-hidden="true"
          onError={onVideoError}
        >
          <source src={ASSISTANT.loopWebm} type="video/webm" />
          <source src={ASSISTANT.loopMp4} type="video/mp4" />
        </video>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={size <= 72 ? ASSISTANT.avatarFallbackSmall : ASSISTANT.avatarFallbackSrc}
        alt={ASSISTANT.avatarAlt}
        width={size}
        height={size}
        style={useLoop ? { position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' } : undefined}
      />
      <canvas ref={canvasRef} aria-hidden="true" />
    </span>
  )
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}
