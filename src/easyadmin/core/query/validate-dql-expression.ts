// Deliberately narrow config guard, not a DQL parser. It checks only backend
// fast-path hazards that can be recognized safely without interpreting values.
export function validateDqlExpression(expression: string): string[] {
  const violations: string[] = []
  const entityPaths = expression.matchAll(
    /\bentity\b(?:(?:\s*\.\s*[A-Za-z_$][\w$]*\s*(?:\(\s*\))?)+)?/g
  )

  for (const match of entityPaths) {
    const path = match[0].replace(/\s/g, '')
    if (!/^entity(?:\.get[A-Z][\w$]*\(\))+$/.test(path)) {
      violations.push('unsafe-entity-path')
    }
  }

  if (/\b(?:and|or)\b/i.test(expression)) {
    violations.push('word-operator')
  }

  if (/(?:==|!=)\s*null\b|\bnull\s*(?:==|!=)/.test(expression)) {
    violations.push('null-equality')
  }

  return violations
}
