'use client'

import { useState } from 'react'

export function GalleryPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <p className="vs-gallery-missing" role="status">
        This photo could not be loaded.
      </p>
    )
  }
  return <img src={src} alt={alt} onError={() => setFailed(true)} />
}
