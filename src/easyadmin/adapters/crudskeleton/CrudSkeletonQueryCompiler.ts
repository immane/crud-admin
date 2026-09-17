import { formatSortParam } from '@/easyadmin/core/query/sort-node'

export interface CompiledCsqeParams extends Record<string, any> {}

export interface AdminFilterChild {
  expression: string
}

export interface AdminFilterNode {
  kind: string
  children?: AdminFilterChild[]
}

export interface AdminSortNode {
  field: string
  dir: string
}

export interface AdminQuery {
  filter?: AdminFilterNode | string
  sort?: AdminSortNode[] | Record<string, any>
  rawSortParam?: string
  rawFilterParam?: string
  page?: { page?: number; limit?: number }
  query?: Record<string, string>
}

// Pure query compiler: no axios, no side effects.
// Honors the ListAdmin dataProcessor flow which merges params via
// Object.assign({}, query, filter, pager, sort).
export function compileCsqeQuery(adminQuery: AdminQuery): CompiledCsqeParams {
  const { filter, sort, rawSortParam, rawFilterParam, page, query } = adminQuery || ({} as AdminQuery)

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
