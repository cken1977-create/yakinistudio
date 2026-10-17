'use client'

import { secondaryBtn } from '@/components/admin/ui'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} style={secondaryBtn()} data-testid="report-print">
      Print
    </button>
  )
}
