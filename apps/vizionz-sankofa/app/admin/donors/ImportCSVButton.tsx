'use client'

// VIZIONZ SANKOFA · /admin/donors · ImportCSVButton (Wave 3.5)
//
// Thin wrapper that mounts the CSV import modal. Same Button/Modal split
// pattern as AddDonorButton/AddDonorModal.

import { useState } from 'react'
import { ImportCSVModal } from './ImportCSVModal'
import { ghostButtonStyle } from './DonorRow'
import { useCanEdit } from '@/components/admin/CanEdit'

export function ImportCSVButton() {
  const canEdit = useCanEdit()
  const [open, setOpen] = useState(false)

  return (
    <>
      {canEdit && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={ghostButtonStyle}
        >
          Import CSV
        </button>
      )}
      {open && <ImportCSVModal onClose={() => setOpen(false)} />}
    </>
  )
}
