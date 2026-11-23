import { CURRENT_SCHEMA_VERSION } from '@yakini/site-schema'

export const dynamic = 'force-dynamic'

// Liveness only: no env values, no headers, no database calls.
export function GET() {
  return Response.json({ ok: true, app: 'builder', phase: 1, schemaVersion: CURRENT_SCHEMA_VERSION }, { headers: { 'Cache-Control': 'no-store' } })
}
