/**
 * Pre-publish checklist definition (spec 11.1, v1.1 additions). Phase 0 defines the items and
 * the rule that BLOCKING items stop a publish; Phase 3 implements each check server-side.
 * The plan gate is a blocking item: a site can't go live without an active paid plan unless an
 * operator with can_override_publish overrides it (and the review gate then applies, 14.8).
 */
export type ChecklistItemId =
  | 'plan_active' | 'agreement_signed' | 'copy_lint' | 'links_ok' | 'images_alt' | 'contrast'
  | 'forms_wired' | 'risk_check' | 'domain_capacity' | 'image_licenses' | 'not_taken_down'

export type ChecklistItem = { id: ChecklistItemId; blocking: boolean; label: string; when?: 'custom_domain' | 'export' }

export const PUBLISH_CHECKLIST: readonly ChecklistItem[] = [
  { id: 'plan_active', blocking: true, label: 'Your plan is active' },
  { id: 'not_taken_down', blocking: true, label: 'Your site is available' },
  { id: 'agreement_signed', blocking: true, label: 'Your agreement is signed', when: 'custom_domain' },
  { id: 'domain_capacity', blocking: true, label: 'Your host can add another address', when: 'custom_domain' },
  { id: 'copy_lint', blocking: true, label: 'Wording check passed' },
  { id: 'links_ok', blocking: true, label: 'Every link works' },
  { id: 'forms_wired', blocking: true, label: 'Your forms are connected' },
  { id: 'risk_check', blocking: true, label: 'Safety check passed' },
  { id: 'images_alt', blocking: false, label: 'Every photo has a description' },
  { id: 'contrast', blocking: false, label: 'Text is easy to read on your colors' },
  { id: 'image_licenses', blocking: true, label: 'Every photo is cleared for use', when: 'export' },
]

export type CheckResult = { id: ChecklistItemId; ok: boolean }

export function canPublish(results: readonly CheckResult[], ctx: { customDomain: boolean; export?: boolean }): { ok: boolean; blockedBy: ChecklistItemId[] } {
  const blockedBy: ChecklistItemId[] = []
  for (const item of PUBLISH_CHECKLIST) {
    if (!item.blocking) continue
    if (item.when === 'custom_domain' && !ctx.customDomain) continue
    if (item.when === 'export' && !ctx.export) continue
    const r = results.find((x) => x.id === item.id)
    if (!r || !r.ok) blockedBy.push(item.id) // a missing result fails closed
  }
  return { ok: blockedBy.length === 0, blockedBy }
}
