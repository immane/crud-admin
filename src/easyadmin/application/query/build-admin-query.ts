// Pure admin-query builder.
// Preserves SearchFilter.filterGenerate semantics (SearchFilter.vue lines 323-342)
// combined with the ListAdmin sort/page conventions. No Vue, no axios.

import { andFilter, cond, emptyFilter, type FilterNode } from '../../core/query/filter-node'
import { joinExpressions, shouldIncludeValue } from '../../core/query/dql-ops'
import { normalizePage } from '../../core/query/pagination'

export interface AdminQueryInput {
  entity: string
  listFilterData?: Record<string, any>
  filters?: Record<string, { expression: string }>
  pager?: { page: number; limit: number }
  sort?: Record<string, string>
  query?: Record<string, string>
}

export interface AdminQuery {
  entity: string
  filter: FilterNode
  sort: Array<{ field: string; dir: 'ASC' | 'DESC' }>
  page: { page: number; limit: number }
  rawSortParam: string
  rawFilterParam?: string
}

export function buildAdminQuery(input: AdminQueryInput): AdminQuery {
  const listFilterData = input.listFilterData ?? {}
  const filters = input.filters ?? {}
  const sortParam = input.sort ?? {}
  const baseQuery = input.query ?? {}

  // Mirror SearchFilter.filterGenerate: skip falsy values (`if (value)`),
  // substitute `:value`, collect raw expressions; joinExpressions applies the
  // exact paren/`&&` wrapping (base first, then `(expr)` chained).
  const exprs: string[] = []
  for (const key of Object.keys(listFilterData)) {
    const value = listFilterData[key]
    if (!shouldIncludeValue(value)) continue
    const def = filters[key]
    if (!def) continue
    exprs.push(def.expression.replaceAll(':value', value))
  }

  const base = baseQuery['@filter']
  const joined = joinExpressions(base, exprs)
  const filter: FilterNode = joined ? andFilter([cond(joined)]) : emptyFilter()

  // Parse sort['@order'] like 'entity.id|DESC, entity.name|ASC'.
  const rawSortParam = sortParam['@order'] ?? ''
  const sort: Array<{ field: string; dir: 'ASC' | 'DESC' }> = []
  if (rawSortParam) {
    for (const part of rawSortParam.split(',')) {
      const trimmed = part.trim()
      if (!trimmed) continue
      const [rawField, rawDir] = trimmed.split('|')
      const field = rawField.trim().replace(/^entity\./, '')
      const dir = (rawDir ?? '').trim()
      if (dir === 'ASC' || dir === 'DESC') {
        sort.push({ field, dir })
      }
    }
  }

  return {
    entity: input.entity,
    filter,
    sort,
    page: normalizePage(input.pager ?? {}),
    rawSortParam,
    rawFilterParam: joined
  }
}
