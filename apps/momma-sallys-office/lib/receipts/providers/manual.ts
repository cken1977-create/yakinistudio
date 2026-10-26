// Default provider: reads nothing. The owner types the receipt in the
// side-by-side review screen. No outside service, no cost.
import type { ReceiptExtractor } from '../types'

export const manualExtractor: ReceiptExtractor = {
  id: 'manual',
  local: true,
  async extract() {
    return { vendor: null, receipt_date: null, receipt_number: null, subtotal_cents: null, tax_cents: null, total_cents: null, lines: [] }
  },
}
