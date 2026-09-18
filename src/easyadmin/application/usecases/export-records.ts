// Pure export-table helpers.
// Preserves ListAdmin.vue export-block semantics exactly (lines 79-122).
// No Vue, no axios, no side effects.

export interface ExportInput {
  configQuery?: Record<string, any>
  filter?: Record<string, any>
  exportQuery?: Record<string, any>
  rows: Array<Record<string, any>>
}

export interface ExportRequest {
  query: Record<string, any>
  label: Record<string, string>
  filename: string
  data: Array<Record<string, any>>
}

export function exportFilename(entityName: string): string {
  return `export-${entityName}.csv`
}

export function buildExportRequest(
  entityName: string,
  input: ExportInput,
  exportLabel?: Record<string, string>
): ExportRequest {
  // Mirrors `query = Object.assign({}, listQuery, filter, query)`:
  // listQuery = config.list.query, filter = current filter, query = exportConf.query.
  const query = Object.assign({}, input.configQuery || {}, input.filter || {}, input.exportQuery || {})

  // Mirrors the res.data.forEach normalization. `keys` ends up as the keys of
  // the last iterated row (empty when rows is empty).
  // Bug preserved: the source checks `typeof === 'object'` first, so arrays
  // (typeof [] === 'object', non-null) take the '[Object]' branch via the
  // missing __toString fallback and the `else if (Array.isArray(...))` branch
  // is dead code. Do NOT "fix" arrays to '[Array]'.
  let keys: string[] = []
  const data = (input.rows || []).map((datum) => {
    const row: Record<string, any> = { ...datum }
    keys = Object.keys(row)
    keys.forEach((key) => {
      if (typeof row[key] === 'object' && row[key] !== null) {
        row[key] = (row[key] as Record<string, any>).hasOwnProperty('__toString')
          ? (row[key] as Record<string, any>).__toString
          : '[Object]'
      }
    })
    return row
  })

  // Mirrors the label fill: only a missing/empty plain label is derived.
  let label: Record<string, string>
  if (exportLabel && Object.keys(exportLabel).length > 0) {
    label = { ...exportLabel }
  } else {
    label = {}
    keys.forEach((v) => {
      label[v] = v
    })
  }

  return { query, label, filename: exportFilename(entityName), data }
}
