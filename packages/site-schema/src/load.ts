import { CURRENT_SCHEMA_VERSION, MAX_DOC_BYTES, SiteDoc } from './schema'
import { MIGRATIONS, type Migration } from './migrations'

export class SiteDocError extends Error {
  constructor(public readonly code: 'not_object' | 'no_version' | 'too_new' | 'no_migration' | 'invalid' | 'too_large', message: string) {
    super(message)
    this.name = 'SiteDocError'
  }
}

export type LoadResult = { doc: SiteDoc; migratedFrom: number | null }

function deepFreezeCopy<T>(v: T): T {
  return structuredClone(v)
}

/**
 * The ONLY way to read a stored SiteDoc (spec 7.3/7.4). Runs the migration chain up
 * to CURRENT_SCHEMA_VERSION, then validates. A doc newer than this code knows is
 * refused, never guessed down. The input is never mutated.
 */
/** What the final shape is checked against; the shipped SiteDoc schema unless a test swaps it. */
export type DocValidator = { safeParse: (v: unknown) => { success: true; data: SiteDoc } | { success: false } }

export function loadSiteDoc(
  raw: unknown,
  migrations: readonly Migration[] = MIGRATIONS,
  current: number = CURRENT_SCHEMA_VERSION,
  schema: DocValidator = SiteDoc as unknown as DocValidator,
): LoadResult {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new SiteDocError('not_object', 'This site file could not be read.')
  }
  if (new TextEncoder().encode(JSON.stringify(raw)).length > MAX_DOC_BYTES) {
    throw new SiteDocError('too_large', 'This site file is too large.')
  }
  const version = (raw as { schemaVersion?: unknown }).schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new SiteDocError('no_version', 'This site file has no format version.')
  }
  if (version > current) {
    throw new SiteDocError('too_new', 'This site was saved by a newer version of the editor. Please refresh and try again.')
  }
  let doc = deepFreezeCopy(raw) as Record<string, unknown>
  let v = version
  while (v < current) {
    const step = migrations.find((m) => m.from === v)
    if (!step || step.to !== v + 1) throw new SiteDocError('no_migration', `No upgrade path from format ${v}.`)
    doc = step.up(doc)
    v = step.to
    doc = { ...doc, schemaVersion: v }
  }
  const parsed = schema.safeParse(doc)
  if (!parsed.success) {
    throw new SiteDocError('invalid', 'This site file does not match the expected format.')
  }
  return { doc: parsed.data, migratedFrom: version === current ? null : version }
}
