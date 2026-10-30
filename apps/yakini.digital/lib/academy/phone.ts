// Phone numbers are stored in E.164 (+15055550123). A leading + is used as typed;
// otherwise the country picked on the form supplies the calling code.
const CALLING: Record<string, string> = {
  US: '1', CA: '1', PR: '1', MX: '52', GT: '502', SV: '503', HN: '504', NI: '505', CR: '506', PA: '507',
  CO: '57', VE: '58', EC: '593', PE: '51', BO: '591', CL: '56', AR: '54', UY: '598', PY: '595', BR: '55',
  DO: '1', CU: '53', ES: '34', GB: '44', IE: '353', FR: '33', DE: '49', IT: '39', PT: '351', NL: '31',
  NG: '234', GH: '233', KE: '254', ZA: '27', ET: '251', JM: '1', TT: '1', BS: '1', BB: '1', HT: '509',
  AU: '61', NZ: '64', IN: '91', PH: '63',
}

export function normalizePhone(raw: string, country: string | null): string | null {
  const plus = raw.trim().startsWith('+')
  let digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (!plus) {
    if (digits.startsWith('00')) digits = digits.slice(2)
    else {
      const cc = CALLING[(country ?? 'US').toUpperCase()]
      if (!cc) return null
      if (cc === '1' && digits.length === 11 && digits.startsWith('1')) { /* already has the 1 */ }
      else digits = cc + digits.replace(/^0+/, '')
    }
  }
  if (!/^[1-9]\d{6,14}$/.test(digits)) return null
  if (digits.startsWith('1') && digits.length !== 11) return null // US/Canada: 10 digits after the 1
  return `+${digits}`
}
