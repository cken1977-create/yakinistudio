// Read-only Square endpoints used by the sync. Every call is a GET or a
// search POST; nothing here writes to Square.
import { paginate, squareFetch } from './http'

/* eslint-disable @typescript-eslint/no-explicit-any */
type F = typeof fetch

export const squareApi = (token: string, fetchImpl?: F) => ({
  merchant: () => squareFetch<any>('/v2/merchants/me', { token, fetchImpl }).then((r) => r.merchant),

  locations: () => squareFetch<any>('/v2/locations', { token, fetchImpl }).then((r) => (r.locations ?? []) as any[]),

  /** Orders updated since `since`, oldest first. */
  orders: (locationIds: string[], since: string) =>
    paginate<any>(async (cursor) => {
      const r = await squareFetch<any>('/v2/orders/search', {
        token, fetchImpl, method: 'POST',
        body: {
          location_ids: locationIds,
          cursor,
          limit: 500,
          query: {
            filter: { date_time_filter: { updated_at: { start_at: since } } },
            sort: { sort_field: 'UPDATED_AT', sort_order: 'ASC' },
          },
        },
      })
      return { items: r.orders ?? [], cursor: r.cursor }
    }),

  ordersById: async (locationId: string | undefined, ids: string[]) => {
    const r = await squareFetch<any>('/v2/orders/batch-retrieve', {
      token, fetchImpl, method: 'POST', body: { location_id: locationId, order_ids: ids },
    })
    return (r.orders ?? []) as any[]
  },

  /** Payments created since `since`. (Updates to older payments arrive by webhook + nightly window.) */
  payments: (since: string) =>
    paginate<any>(async (cursor) => {
      const q = new URLSearchParams({ begin_time: since, sort_order: 'ASC', limit: '100' })
      if (cursor) q.set('cursor', cursor)
      const r = await squareFetch<any>(`/v2/payments?${q}`, { token, fetchImpl })
      return { items: r.payments ?? [], cursor: r.cursor }
    }),

  payment: (id: string) =>
    squareFetch<any>(`/v2/payments/${encodeURIComponent(id)}`, { token, fetchImpl }).then((r) => r.payment),

  catalog: () =>
    paginate<any>(async (cursor) => {
      const q = new URLSearchParams({ types: 'ITEM,CATEGORY' })
      if (cursor) q.set('cursor', cursor)
      const r = await squareFetch<any>(`/v2/catalog/list?${q}`, { token, fetchImpl })
      return { items: r.objects ?? [], cursor: r.cursor }
    }),

  customers: () =>
    paginate<any>(async (cursor) => {
      const q = new URLSearchParams({ limit: '100' })
      if (cursor) q.set('cursor', cursor)
      const r = await squareFetch<any>(`/v2/customers?${q}`, { token, fetchImpl })
      return { items: r.customers ?? [], cursor: r.cursor }
    }),

  team: () =>
    paginate<any>(async (cursor) => {
      const r = await squareFetch<any>('/v2/team-members/search', {
        token, fetchImpl, method: 'POST', body: { limit: 200, cursor },
      })
      return { items: r.team_members ?? [], cursor: r.cursor }
    }),
})

export type SquareApi = ReturnType<typeof squareApi>
