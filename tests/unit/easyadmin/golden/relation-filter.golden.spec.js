import { describe, it, expect } from 'vitest'

// Pure RelationToOne.fetchData filter logic
// (src/easyadmin/ui/vue/plugins/form/RelationToOne.vue lines 175-182),
// extracted inline without touching source:
//
//   const currentFilter = Object.assign({}, relationFilter)
//   currentFilter['@display'] = 'reduce'
//   currentFilter['limit'] = 1e10
//   if (relationFilter['@filter'] && query) {
//     currentFilter['@filter'] = relationFilter['@filter'].replaceAll(':value', query)
//   }
function relationFetchFilter(relationFilter, query = null) {
  const currentFilter = Object.assign({}, relationFilter)
  currentFilter['@display'] = 'reduce'
  currentFilter['limit'] = 1e10
  if (relationFilter['@filter'] && query) {
    currentFilter['@filter'] = relationFilter['@filter'].replaceAll(':value', query)
  }
  return currentFilter
}

// Assignment userUuid relation_filter shape.
const USER_UUID_RELATION_FILTER = {
  '@filter': 'entity.getUsername() matches ":value"'
}

describe('golden/relation-filter', () => {
  it('substitutes :value with the query and forces @display/@limit', () => {
    expect(relationFetchFilter(USER_UUID_RELATION_FILTER, 'ann')).toEqual({
      '@filter': 'entity.getUsername() matches "ann"',
      '@display': 'reduce',
      limit: 1e10
    })
  })

  it('leaves @filter untouched when no query is given', () => {
    expect(relationFetchFilter(USER_UUID_RELATION_FILTER)).toEqual({
      '@filter': 'entity.getUsername() matches ":value"',
      '@display': 'reduce',
      limit: 1e10
    })
  })

  it('leaves @filter untouched when it is absent (query present)', () => {
    expect(relationFetchFilter({}, 'ann')).toEqual({
      '@display': 'reduce',
      limit: 1e10
    })
  })

  it('does not mutate the source relation_filter', () => {
    const source = { ...USER_UUID_RELATION_FILTER }
    relationFetchFilter(source, 'ann')
    expect(source).toEqual(USER_UUID_RELATION_FILTER)
  })
})
