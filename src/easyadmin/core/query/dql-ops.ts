// Pure DQL helpers. Preserves SearchFilter.filterProcess / filterGenerate semantics.

export function dottedKeyToExpression(key: string): string {
  return key
    .split('.')
    .map((value) => {
      const capitalizeKey = value.charAt(0).toUpperCase() + value.slice(1)
      return `.get${capitalizeKey}()`
    })
    .join('')
}

export type ShorthandField = string | null | Record<string, any>

export interface ShorthandResult {
  expression: string
  type: 'input' | 'select'
  label: string
  default: any
  data: Array<{ value: string; label: any }> | null
}

export function shorthandExpression(key: string, field: ShorthandField): ShorthandResult {
  if (
    field === null ||
    typeof field === 'string' ||
    !Object.keys(field).includes('expression')
  ) {
    const dotted = dottedKeyToExpression(key)
    const isInput = typeof field === 'string' || field === null
    const result: ShorthandResult = {
      data: isInput ? null : [],
      type: isInput ? 'input' : 'select',
      label: typeof field === 'string' ? field : '',
      default: null,
      expression: isInput
        ? `entity${dotted} matches ':value'`
        : `entity${dotted} == ':value'`
    }

    if (typeof field === 'object') {
      for (const k in field as Record<string, any>) {
        const v = (field as Record<string, any>)[k]
        if (k === '__label') {
          result.label = v
        } else if (k === '__default') {
          result.default = v
        } else {
          ;(result.data as Array<{ value: string; label: any }>).push({ value: k, label: v })
        }
      }
    }

    return result
  }

  // Full-style (has expression): returned as-is.
  return field as unknown as ShorthandResult
}

export function substituteValue(expression: string, value: any): string {
  return expression.replaceAll(':value', String(value))
}

// Intentional legacy semantics: mirrors the existing `if (value)` guard in
// SearchFilter.filterGenerate, so 0 / false / '' / null / undefined are dropped.
export function shouldIncludeValue(value: any): boolean {
  return !!value
}

// Preserve SearchFilter.filterGenerate paren/wrapping:
// - no expressions -> return base (may be undefined)
// - base truthy   -> `${base} && (${e})` chained
// - else          -> `(${e})` joined with ' && '
export function joinExpressions(base: string | undefined, expressions: string[]): string | undefined {
  if (expressions.length === 0) {
    return base
  }
  if (base) {
    return expressions.reduce((acc, e) => `${acc} && (${e})`, base as string)
  }
  return expressions.map((e) => `(${e})`).join(' && ')
}
