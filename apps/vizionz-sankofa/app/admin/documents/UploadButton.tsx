"use client"

import { useState } from "react"
import { BatchUploadModal } from "./BatchUploadModal"

export default function UploadButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "10px 18px",
          background: "#0A0A0A",
          color: "#FFFFFF",
          border: "1px solid #0A0A0A",
          borderRadius: "2px",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          cursor: "pointer",
        }}
      >
        Upload Documents
      </button>

      {open && <BatchUploadModal onClose={() => setOpen(false)} />}
    </>
  )
}
