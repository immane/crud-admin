// Pure sort helpers. Preserves ListAdmin.changeSort semantics:
// val.order falsy -> caller emits '' (handled in compiler, not here).

export type SortNode = { field: string; dir: 'ASC' | 'DESC' }

export function mapElementPlusSort(prop: string, order: string | null | undefined): SortNode | null {
  if (order === 'ascending') {
    return { field: prop, dir: 'ASC' }
  }
  if (order === 'descending') {
    return { field: prop, dir: 'DESC' }
  }
  return null
}

export function formatSortParam(sorts: SortNode[]): string {
  return sorts.map((s) => `entity.${s.field}|${s.dir}`).join(', ')
}
