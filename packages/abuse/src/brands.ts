/**
 * Impersonation list (spec 14.8 #5): large brands, banks, payment apps, government
 * agencies, delivery and shipping companies. Seed list; operators extend it by PR.
 * Matching is on normalized whole words so a local "Apple Valley Bakery" is flagged for
 * a human look, not refused.
 */
export const IMPERSONATION_NAMES = [
  'paypal', 'venmo', 'cash app', 'cashapp', 'zelle', 'chase', 'wells fargo', 'bank of america', 'citibank', 'capital one',
  'american express', 'amex', 'visa', 'mastercard', 'discover card', 'coinbase', 'irs', 'social security', 'ssa',
  'medicare', 'medicaid', 'dmv', 'usps', 'ups', 'fedex', 'dhl', 'amazon', 'apple', 'google', 'microsoft', 'facebook',
  'instagram', 'meta', 'netflix', 'walmart', 'target', 'costco', 'doordash', 'uber eats', 'ubereats', 'grubhub',
  'instacart', 'mcdonalds', "mcdonald's", 'starbucks', 'taco bell', 'chick-fil-a', 'chipotle', 'subway', 'dominos',
  "domino's", 'pizza hut', 'wendys', "wendy's", 'burger king', 'verizon', 't-mobile', 'at&t',
] as const

export const IMPERSONATION_DOMAINS = [
  'paypal.com', 'venmo.com', 'cash.app', 'zellepay.com', 'chase.com', 'wellsfargo.com', 'bankofamerica.com', 'irs.gov',
  'ssa.gov', 'usps.com', 'ups.com', 'fedex.com', 'dhl.com', 'amazon.com', 'apple.com', 'google.com', 'microsoft.com',
  'facebook.com', 'instagram.com', 'netflix.com', 'walmart.com', 'target.com', 'costco.com', 'doordash.com',
  'ubereats.com', 'grubhub.com', 'instacart.com', 'mcdonalds.com', 'starbucks.com', 'tacobell.com', 'chick-fil-a.com',
] as const

export function normalizeName(s: string): string {
  return ` ${s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9&'-]+/g, ' ').trim()} `
}
