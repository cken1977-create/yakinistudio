// Receipt extraction contract. A provider turns photos into a DRAFT; nothing
// it returns is trusted or counted until the owner reviews and approves.

export type ExtractedLine = {
  raw_text: string
  quantity: number | null
  unit_price_cents: number | null
  line_total_cents: number | null
  discount_cents?: number
  /** Per-field confidence 0..1 if the provider reports it. */
  confidence?: number
}

export type ExtractedReceipt = {
  vendor: string | null
  receipt_date: string | null // YYYY-MM-DD
  receipt_number: string | null
  subtotal_cents: number | null
  tax_cents: number | null
  total_cents: number | null
  lines: ExtractedLine[]
  /** Free-text notes from the provider, e.g. "sample data". */
  notes?: string[]
}

export type ReceiptImage = { path: string; mimeType: string; bytes?: Uint8Array }

export interface ReceiptExtractor {
  /** Stored on the receipt so the owner can see where a draft came from. */
  readonly id: string
  /** True when the provider never sends images off the server. */
  readonly local: boolean
  extract(images: ReceiptImage[]): Promise<ExtractedReceipt>
}

export type Flag = { code: string; message: string; line_no?: number }
