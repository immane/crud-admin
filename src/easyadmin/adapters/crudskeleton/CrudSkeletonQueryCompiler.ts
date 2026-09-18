import { formatSortParam } from '@/easyadmin/core/query/sort-node'
import type { AdminQuery } from '@/easyadmin/core/query/admin-query'

export interface CompiledCsqeParams extends Record<string, any> {}

// Compiler input: canonical AdminQuery plus transport extras. The `filter`
// union preserves the pre-canonical callers that pass a ready-made string.
export interface CompileInput extends Omit<Partial<AdminQuery>, 'filter' | 'sort'> {
  filter?: AdminQuery['filter'] | string
  sort?: AdminQuery['sort'] | Record<string, any>
  query?: Record<string, string>
}

// Pure query compiler: no axios, no side effects.
// Honors the ListAdmin dataProcessor flow which merges params via
// Object.assign({}, query, filter, pager, sort).
export function compileCsqeQuery(adminQuery: CompileInput): CompiledCsqeParams {
  const { filter, sort, rawSortParam, rawFilterParam, page, query } = adminQuery || ({} as CompileInput)

  let filterPart: Record<string, any> = {}
  if (typeof rawFilterParam === 'string' && rawFilterParam) {
    filterPart = { '@filter': rawFilterParam }
  } else if (typeof filter === 'string') {
    if (filter) {
      filterPart = { '@filter': filter }
    }
  } else if (filter && filter.kind === 'and' && Array.isArray(filter.children) && filter.children.length) {
    // children[0].expression already contains the full joined string.
    const expression = filter.children[0] ? filter.children[0].expression : ''
    if (expression) {
      filterPart = { '@filter': expression }
    }
  }

  const pagerPart: Record<string, any> = {}
  if (page) {
    if (typeof page.page === 'number') {
      pagerPart.page = page.page
    }
    if (typeof page.limit === 'number') {
      pagerPart.limit = page.limit
    }
  }

  let sortPart: Record<string, any> = {}
  if (typeof rawSortParam === 'string' && rawSortParam) {
    // Preserves ListAdmin.changeSort which writes sort['@order'].
    sortPart = { '@order': rawSortParam }
  } else if (Array.isArray(sort)) {
    const formatted = formatSortParam(sort as Array<{ field: string; dir: 'ASC' | 'DESC' }>)
    if (formatted) {
      sortPart = { '@order': formatted }
    }
  } else if (sort && typeof sort === 'object') {
    // Pass through a pre-compiled sort object (e.g. ListAdmin context.sort),
    // dropping cleared (empty) values so '@order' is omitted when empty.
    for (const [key, value] of Object.entries(sort)) {
      if (value !== '' && value !== undefined && value !== null) {
        sortPart[key] = value
      }
    }
  }

  return Object.assign({}, query || {}, filterPart, pagerPart, sortPart)
}
