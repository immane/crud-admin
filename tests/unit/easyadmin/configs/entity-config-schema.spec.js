import { describe, it, expect, vi, beforeAll } from 'vitest'
import Ajv from 'ajv'

// Mock i18n FIRST, before importing any entity collection, to avoid store
// side-effects from the real i18n module (localStorage/navigator access).
vi.mock('@/i18n', () => ({ t: (key) => key }))

import entities from '@/configs/entities'
import schema from '@/configs/schema/entity-config.schema.json'

const NON_ENTITY_KEYS = new Set(['__hmrId', 'name', 'props', 'setup'])

function realEntries() {
  return Object.entries(entities).filter(([key]) => !NON_ENTITY_KEYS.has(key))
}

// JSON-safe projection: source configs are never mutated. Functions and Vue
// components cannot live in JSON Schema land; they collapse to a marker the
// schema accepts as an object. Their semantics stay covered by
// config-shape.spec.js (shapes), async-filter-resolve.spec.js (factories) and
// the DQL fast-path validator (expressions).
function project(value) {
  if (typeof value === 'function') return { $fn: true }
  if (value && typeof value === 'object' && (value.$$typeof || value.__v_isVNode || value.render || value.setup)) {
    return { $component: true }
  }
  if (Array.isArray(value)) return value.map(project)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, project(v)]))
  }
  return value
}

let validate

beforeAll(() => {
  const ajv = new Ajv({ allErrors: true, strict: false })
  validate = ajv.compile(schema)
})

describe('configs entity JSON schema', () => {
  it('uses draft-07 with a stable $id', () => {
    expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#')
    expect(schema.$id).toBe('EasyAdmin/EntityConfig')
  })

  it('accepts every real entity configuration', () => {
    const failures = []
    for (const [name, config] of realEntries()) {
      const valid = validate(project(config))
      if (!valid) failures.push(`${name}: ${JSON.stringify(validate.errors)}`)
    }
    expect(failures).toEqual([])
  })

  it('rejects unknown entity-level keys', () => {
    expect(validate(project({ ...entities.User, frobnicate: 1 }))).toBe(false)
  })

  it('rejects unknown disabled_actions values', () => {
    const bad = project(structuredCloneLike(entities.User))
    bad.list = { ...bad.list, disabled_actions: ['vaporize'] }
    expect(validate(bad)).toBe(false)
  })

  it('rejects empty batch_edit.fields', () => {
    const bad = project(structuredCloneLike(entities.User))
    bad.form = { ...bad.form, batch_edit: { fields: [] } }
    expect(validate(bad)).toBe(false)
  })

  it('rejects field objects without property', () => {
    const bad = project(structuredCloneLike(entities.User))
    bad.form = { fields: [{ type: 'input' }] }
    expect(validate(bad)).toBe(false)
  })

  it('rejects detail_display outside __all__/array', () => {
    const bad = project(structuredCloneLike(entities.User))
    bad.detail = { detail_display: 'everything' }
    expect(validate(bad)).toBe(false)
  })
})

// structuredClone cannot clone functions/components; project first, then clone
// the already-JSON-safe projection for negative-case fixtures.
function structuredCloneLike(value) {
  return JSON.parse(JSON.stringify(value))
}
