// Pure URL query-sync helpers.
// Preserves ListAdmin.buildQueryParams / applyQueryParams semantics exactly
// (ListAdmin.vue lines 782-819). No Vue, no router, no side effects.

export function buildQueryParams(
  listFilterData: Record<string, any>,
  pager: { page: number; limit: number }
): Record<string, any> {
  const query: Record<string, any> = {}
  for (const key of Object.keys(listFilterData)) {
    if (listFilterData[key] != null && listFilterData[key] !== '') {
      query[key] = listFilterData[key]
    }
  }
  if (pager.page !== 1) query.page = String(pager.page)
  if (pager.limit !== 20) query.limit = String(pager.limit)
  return query
}

export function applyQueryParams(query: Record<string, any>): {
  filterData: Record<string, any>
  pager: { page: number; limit: number }
} {
  const filterData: Record<string, any> = {}
  let page = 1
  let limit = 20
  for (const key of Object.keys(query)) {
    if (key === 'page') {
      page = Math.max(1, Number(query[key]) || 1)
    } else if (key === 'limit') {
      limit = Math.max(1, Number(query[key]) || 20)
    } else {
      filterData[key] = query[key]
    }
  }
  if (!Object.hasOwn(query, 'page')) page = 1
  if (!Object.hasOwn(query, 'limit')) limit = 20
  return { filterData, pager: { page, limit } }
}

export function buildUrlSearch(params: Record<string, any>): string {
  return new URLSearchParams(params).toString()
}
