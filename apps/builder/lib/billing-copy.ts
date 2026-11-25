/** Fixed messages for plan and publish pages (no free text in URLs). */
export const BILLING_RESULTS: Record<string, string> = {
  owner_only: 'Only the owner can do that.',
  has_plan: 'You already have a plan.',
  bad_plan: 'That plan isn’t available for this site.',
  slow_down: 'Please wait a few minutes and try again.',
  paypal_down: 'We couldn’t reach PayPal. Please try again in a minute.',
  not_ready: 'Plans aren’t set up yet. Please contact Yakini.',
  confirm_cancel: 'Tick the box to confirm, then press Cancel plan.',
  no_plan: 'There’s no plan to cancel.',
  canceled: 'Your plan is canceled. Your site stays live until the end of the month you paid for.',
  needs_plan: 'Choose a plan first. Search engines can find paid sites only.',
  indexing_on: 'Search engines can now find your site. It can take a few days to show up.',
  indexing_off: 'Search engines are asked not to list your site.',
  bad_input: 'Please try that again.',
  failed: 'That didn’t work. Please try again.',
}

export const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`

export const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  past_due: 'Payment didn’t go through',
  canceled: 'Canceled',
  pending: 'Waiting for PayPal',
}
