// Pure batch-edit helpers.
// Preserves ListAdmin.removeSelected (lines 1003-1005) and
// ListAdmin.submitBatchEdit (lines 1065-1076) semantics exactly.
// No Vue, no axios, no side effects.

export function collectBatchDeleteIds(records: Array<{ id?: any }>): Array<number | string> {
  return records.map((record) => record.id).filter((id) => id != null)
}

export function collectBatchUpdateData(
  batchFields: Array<{ property: string }>,
  selectedFields: string[],
  form: Record<string, any>
): Record<string, any> {
  const batchFieldProperties = new Set(batchFields.map((field) => field.property))
  const data: Record<string, any> = {}
  for (const key of selectedFields) {
    // Object.hasOwn gate preserved: empty relation arrays initialized by form
    // plugins ARE included when the form owns the key.
    if (batchFieldProperties.has(key) && Object.hasOwn(form, key)) {
      data[key] = form[key]
    }
  }
  return data
}

// Mirrors CrudSkeletonAdapter.batchUpdate record shaping:
// ids.map(id => ({ id, ...data })) posted with params {'@basis': 'id', '@mode': 'update'}.
export function buildBatchUpdateBody(
  ids: Array<number | string>,
  data: Record<string, any>
): Array<Record<string, any>> {
  return ids.map((id) => ({ id, ...data }))
}
