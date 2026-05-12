'use client'

// VIZIONZ SANKOFA · /admin/donors · ImportCSVButton (Wave 3.5)
//
// Thin wrapper that mounts the CSV import modal. Same Button/Modal split
// pattern as AddDonorButton/AddDonorModal.

import { useState } from 'react'
import { ImportCSVModal } from './ImportCSVModal'
import { ghostButtonStyle } from './DonorRow'

export function ImportCSVButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={ghostButtonStyle}
      >
        Import CSV
      </button>
      {open && <ImportCSVModal onClose={() => setOpen(false)} />}
    </>
  )
}
