// Pure batch-delete helpers. Preserves ListAdmin.removeSelected counting
// semantics exactly. No Vue, no axios.

export interface DeletionSummary {
  deleted: number
  failed: number
}

// deleteMany settles one promise per id, so results.length === ids.length.
export function summarizeSettledDeletions(
  results: Array<PromiseSettledResult<unknown>>
): DeletionSummary {
  const failed = results.filter(result => result.status === 'rejected').length
  return { deleted: results.length - failed, failed }
}
