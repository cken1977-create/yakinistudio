/**
 * Content policy (spec 14.4, Q7 confirmed by Clarence Nov 23 2026): refuse generation
 * for adult content, weapons sales and gambling. Extra categories can be added with
 * the BLOCKED_CATEGORIES env (comma list of ids below).
 */
export type BlockedCategory = 'adult' | 'weapons' | 'gambling'

const RULES: Record<BlockedCategory, RegExp> = {
  adult: /\b(adult (entertainment|content|store|toys?)|escort(s|ing)?|strip ?club|porn\w*|xxx|onlyfans|camgirls?|sex ?shop)\b/i,
  weapons: /\b(gun ?(shop|store|sales?)|firearms?( dealer| sales?| store)?|ammunition|ammo (shop|store|sales?)|weapons? (sales?|dealer|shop)|silencers?|suppressors?)\b/i,
  gambling: /\b(casino|sports ?book|sports betting|betting|bookmaker|poker (room|site)|slot machines?|gambling|lottery sales)\b/i,
}

export const DEFAULT_BLOCKED: readonly BlockedCategory[] = ['adult', 'weapons', 'gambling']

export function blockedFromEnv(raw: string | undefined): BlockedCategory[] {
  if (!raw?.trim()) return [...DEFAULT_BLOCKED]
  const ids = raw.split(',').map((s) => s.trim().toLowerCase()).filter((s): s is BlockedCategory => s in RULES)
  // The confirmed defaults are a floor: env can add, never remove.
  return [...new Set([...DEFAULT_BLOCKED, ...ids])]
}

export function blockedCategoryFor(text: string, blocked: readonly BlockedCategory[] = DEFAULT_BLOCKED): BlockedCategory | null {
  for (const c of blocked) if (RULES[c].test(text)) return c
  return null
}

/** Polite, vendor-free refusal shown to the visitor (R7/R8). */
export const BLOCKED_MESSAGE = "Sorry, we can't build sites for this kind of business. If you think we got this wrong, contact Yakini."
