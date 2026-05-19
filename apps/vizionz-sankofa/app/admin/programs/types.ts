// VIZIONZ SANKOFA · /admin/programs · shared types

export type ProgramRecord = {
  id: string
  slug: string
  name: string
  short_name: string | null
  is_public: boolean
  is_active: boolean
  public_description: string | null
  public_long_description: string | null
  who_we_serve: string | null
  eligibility_criteria: string | null
  duration_description: string | null
  apply_cta_label: string | null
  apply_url: string | null
  hero_image_url: string | null
  icon_emoji: string | null
  display_order: number
  primary_outcome_domains: string[] | null
  launched_at: string | null
  retired_at: string | null
  created_at: string
  updated_at: string
}

export type ProgramEditableFields = Pick<
  ProgramRecord,
  | 'name'
  | 'short_name'
  | 'public_description'
  | 'public_long_description'
  | 'who_we_serve'
  | 'eligibility_criteria'
  | 'duration_description'
  | 'apply_cta_label'
  | 'apply_url'
  | 'icon_emoji'
  | 'display_order'
  | 'is_public'
>
