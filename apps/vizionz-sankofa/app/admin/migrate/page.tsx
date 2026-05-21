// VIZIONZ SANKOFA · /admin/migrate
// Workbook upload + preview + commit flow.
// Principal-only: Khadijah, Carly, Denise, Clarence.

import { requirePrincipal, getOperatorDisplayName } from '@/lib/supabase/auth'
import { MigrateClient } from './MigrateClient'

export const dynamic = 'force-dynamic'

export default async function MigratePage() {
  const user = await requirePrincipal()
  const displayName = getOperatorDisplayName(user)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-stone-500">
          principal · workbook migration
        </p>
        <h1 className="mt-2 text-3xl font-serif text-stone-900">
          Migrate Workbook
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Welcome, {displayName}. Upload the Emergancy Rental Programs workbook
          (.xlsx) below. The system will parse every tab, deduplicate participants,
          and show you a preview before anything is written to the database.
        </p>
      </header>

      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <MigrateClient />
      </section>

      <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Before you upload:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Every row written is logged to migration_log for audit.</li>
          <li>Participants are deduplicated by name + date of birth.</li>
          <li>You will see a preview and can cancel before committing.</li>
          <li>Historical tabs (ERAP, old daily logs) go to historical_archive.</li>
        </ul>
      </section>
    </div>
  )
}
