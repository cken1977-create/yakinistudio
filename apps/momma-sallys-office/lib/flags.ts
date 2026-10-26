// Every module ships OFF. Each flag must be exactly "true" to turn on.
// OFFICE_ENABLED gates the whole app (proxy.ts returns 404 for every path
// when it's off). The module flags gate their own pages and API routes.

const on = (v: string | undefined) => v === 'true'

export const flags = {
  office: () => on(process.env.OFFICE_ENABLED),
  squareSync: () => on(process.env.OFFICE_SQUARE_SYNC_ENABLED),
  receipts: () => on(process.env.OFFICE_RECEIPTS_ENABLED),
}
