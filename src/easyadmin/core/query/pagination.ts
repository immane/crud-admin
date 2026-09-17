export interface OffsetPage {
  page: number
  limit: number
}

// Preserve ListAdmin.normalizePaginator semantics exactly.
export function normalizePaginator(input: Record<string, any> = {}): { totalCount: number } & Record<string, any> {
  return {
    ...input,
    totalCount: Number(input.totalCount ?? input.total ?? 0)
  }
}

export function normalizePage(pager: { page?: any; limit?: any } = {}): OffsetPage {
  return {
    page: Math.max(1, Number(pager.page) || 1),
    limit: Math.max(1, Number(pager.limit) || 20)
  }
}
