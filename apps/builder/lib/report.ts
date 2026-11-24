/** Report reasons (spec 5.11 step 2), in the order the form shows them. */
export const REPORT_REASONS = [
  { value: 'impersonation', label: 'Pretends to be another business' },
  { value: 'phishing', label: 'Phishing or scam' },
  { value: 'copyright', label: 'Uses my photos, logo or writing' },
  { value: 'illegal', label: 'Illegal or harmful' },
  { value: 'other', label: 'Something else' },
] as const
export type ReportReasonValue = (typeof REPORT_REASONS)[number]['value']

/** Fixed messages the form can show after a redirect (no free text in URLs). */
export const REPORT_ERRORS = {
  missing: 'Please pick a reason and tell us what you saw.',
  site: 'We couldn’t find that site. Please use the Report link on the site itself.',
  slow: 'You’ve sent several reports already. Please try again later.',
  expired: 'This page was open for a long time. Please send your report again.',
  failed: 'Your report wasn’t sent. Please try again in a minute.',
} as const
export type ReportError = keyof typeof REPORT_ERRORS

/** The short reference shown to the reporter (no personal data). */
export const reportRef = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase()
