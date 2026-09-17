export type FilterCondition = { kind: 'cond'; expression: string }

export type FilterNode = { kind: 'and'; children: FilterCondition[] } | { kind: 'empty' }

export function emptyFilter(): FilterNode {
  return { kind: 'empty' }
}

export function andFilter(children: FilterCondition[]): FilterNode {
  if (children.length === 0) {
    return { kind: 'empty' }
  }
  return { kind: 'and', children }
}

export function cond(expression: string): FilterCondition {
  return { kind: 'cond', expression }
}
