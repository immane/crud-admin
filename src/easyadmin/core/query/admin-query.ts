// Canonical AdminQuery model.
// Single source for the builder output shape. The CrudSkeleton compiler accepts
// this shape plus transport extras (see CompileInput in the compiler).
// Pure types only: no Vue, axios, Vuex, or DOM.

import type { FilterNode } from './filter-node'
import type { SortNode } from './sort-node'
import type { OffsetPage } from './pagination'

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
  sort: SortNode[]
  page: OffsetPage
  rawSortParam: string
  rawFilterParam?: string
}
