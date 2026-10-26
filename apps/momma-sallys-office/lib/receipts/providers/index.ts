// Picks the receipt reader. Only 'manual' (default) and 'mock' exist in
// slice 1. A paid reader would be added here as one more implementation of
// ReceiptExtractor, after Clarence picks one; no paid account is wired.
import type { ReceiptExtractor } from '../types'
import { manualExtractor } from './manual'
import { mockExtractor } from './mock'

const providers: Record<string, ReceiptExtractor> = {
  manual: manualExtractor,
  mock: mockExtractor,
}

export function getExtractor(name = process.env.RECEIPT_EXTRACTOR ?? 'manual'): ReceiptExtractor {
  return providers[name] ?? manualExtractor
}

export const availableExtractors = Object.keys(providers)
