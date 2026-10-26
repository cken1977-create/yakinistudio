// TEST PROVIDER. Returns the same clearly-labeled SAMPLE receipt no matter
// what photo is uploaded, so the review flow can be exercised without a paid
// reading service. Numbers are invented sample data, not real prices.
// Line 3 deliberately has a math error so the checks have something to flag.
import type { ReceiptExtractor } from '../types'

export const mockExtractor: ReceiptExtractor = {
  id: 'mock',
  local: true,
  async extract() {
    return {
      vendor: 'SAMPLE Restaurant Supply',
      receipt_date: new Date().toISOString().slice(0, 10),
      receipt_number: 'SAMPLE-0001',
      subtotal_cents: 14450,
      tax_cents: 0,
      total_cents: 14450,
      lines: [
        { raw_text: 'BEEF BRISKET CHOICE 10LB', quantity: 2, unit_price_cents: 4000, line_total_cents: 8000, confidence: 0.9 },
        { raw_text: 'CLAMSHELL 9X9 200CT', quantity: 1, unit_price_cents: 1000, line_total_cents: 1000, confidence: 0.9 },
        { raw_text: 'COLLARD GREENS 6/2 LB', quantity: 3, unit_price_cents: 1500, line_total_cents: 4600, confidence: 0.6 },
        { raw_text: 'SWEET POTATO 40#', quantity: 1, unit_price_cents: 850, line_total_cents: 850, confidence: 0.8 },
      ],
      notes: ['SAMPLE DATA from the test reader: not read from your photo. Replace every value before approving.'],
    }
  },
}
