/**
 * Link to the public start form.
 * portal.yakini.digital/start officially supports ?kit= as a *plan* id
 * (for example grow or founding), not an industry kit id like food-truck.
 * Unsupported fields are omitted so we do not prefill the wrong plan.
 */
export function startSetupUrl(_prefill?: {
  name?: string
  website?: string
  kitId?: string
  sizeId?: string
}): string {
  return 'https://portal.yakini.digital/start#form'
}
