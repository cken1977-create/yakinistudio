/**
 * Site-level settings for Momma Sally's that sit outside BrandConfig.
 *
 * Anything left empty is HIDDEN on the site — never replaced with a guess.
 */

/** Display phone + tel: link. */
export const PHONE_DISPLAY = '325-428-8166'
export const PHONE_TEL = 'tel:+13254288166'
export const SMS_LINK = 'sms:+13254288166'

/**
 * Square payment link (Square account: "Marvelous House of Flavor").
 * Set NEXT_PUBLIC_SQUARE_PAY_URL in Vercel (or paste the link here).
 * When empty, every Pay button is hidden and /pay shows "Pay at the window".
 * The printed pay QR points at /pay, so it never needs reprinting.
 */
export const SQUARE_PAY_URL: string = (process.env.NEXT_PUBLIC_SQUARE_PAY_URL ?? '').trim()

export const HAS_PAY = /^https:\/\//i.test(SQUARE_PAY_URL)

/** Facebook page URL — TODO from Nicole. Hidden while empty. */
export const FACEBOOK_URL: string = ''

/** Public email (no mailbox/forwarding set up yet). */
export const PUBLIC_EMAIL: string = 'hello@mamasallys.com'
