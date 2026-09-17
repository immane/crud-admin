// Pure form-save helpers. Preserves FormAdmin.cleanBlankAttributes /
// onSubmit decision semantics exactly (FormAdmin.vue). No Vue, no axios.

export function cleanBlankAttributes(data: Record<string, any>): void {
  for (const propName in data) {
    const value = data[propName]
    if (value === null || value === undefined) {
      delete data[propName]
    } else if (Array.isArray(value)) {
      value.forEach(item => {
        if (item && typeof item === 'object' && !Array.isArray(item)) cleanBlankAttributes(item)
      })
    } else if (typeof value === 'object') {
      cleanBlankAttributes(value)
    }
  }
}

// Mirrors `if (this.id)` in onSubmit: truthy id updates, otherwise creates.
export function isUpdateOperation(id: unknown): boolean {
  return Boolean(id)
}
