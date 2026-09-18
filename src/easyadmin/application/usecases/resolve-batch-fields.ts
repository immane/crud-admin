// Pure port of ListAdmin.resolvedBatchFields (src/easyadmin/ui/vue/ListAdmin.vue).
// Original:
//   const fields = this.config?.form?.batch_edit?.fields
//   if (!fields) return []
//   return fields.map(field => {
//     if (typeof field === 'string') return { property: field }
//     return field.component ? { ...field, component: markRaw(toRaw(field.component)) } : field
//   })
//
// Vue-specific markRaw/toRaw wrapping is intentionally dropped here: it only
// controls Vue reactivity for rendering form components and has no effect on
// query building or batch-update payloads. A plain spread ({ ...field })
// preserves every key (property, type, component, help, ...) by value, which
// keeps data/query semantics identical for non-rendering purposes.

export function resolveBatchFields(
  fields: Array<string | Record<string, any>> | undefined
): Array<Record<string, any>> {
  if (!fields) return []
  return fields.map((field) => {
    if (typeof field === 'string') return { property: field }
    return { ...field }
  })
}

export default resolveBatchFields
