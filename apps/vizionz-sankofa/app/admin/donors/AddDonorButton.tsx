'use client'

// VIZIONZ SANKOFA · /admin/donors · AddDonorButton (Wave 3.5)
//
// Thin wrapper that mounts the Add Donor modal. Same Button/Modal split
// pattern as Wave 3.2's BatchUploadButton/BatchUploadModal.

import { useState } from 'react'
import { AddDonorModal } from './AddDonorModal'
import { primaryButtonStyle } from './DonorRow'

export function AddDonorButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={primaryButtonStyle}
      >
        + Add Donor
      </button>
      {open && <AddDonorModal onClose={() => setOpen(false)} />}
    </>
  )
}
