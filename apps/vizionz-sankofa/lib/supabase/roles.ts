// Access-role labels. Plain module (no server imports) so client components can use it.
import type { VsAccessRole } from './auth'

export const ACCESS_ROLE_LABELS: Record<VsAccessRole, string> = {
  executive: 'Executive',
  operator: 'Operator',
  case_manager: 'Case manager',
  leadership_readonly: 'Leadership',
}
