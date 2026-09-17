// Pure relation-option request helpers. Preserves
// RelationToOne.fetchData filter semantics exactly:
// base relation_filter plus '@display=reduce', limit=1e10, and remote
// ':value' substitution only when both a base '@filter' and query exist.
// No Vue, no axios.

export interface RelationListParams extends Record<string, any> {}

export function buildRelationListParams(
  relationFilter: Record<string, any> = {},
  query: string | null = null
): RelationListParams {
  const currentFilter = Object.assign({}, relationFilter)

  currentFilter['@display'] = 'reduce'
  currentFilter['limit'] = 1e10

  if (relationFilter['@filter'] && query) {
    currentFilter['@filter'] = relationFilter['@filter'].replaceAll(':value', query)
  }

  return currentFilter
}
