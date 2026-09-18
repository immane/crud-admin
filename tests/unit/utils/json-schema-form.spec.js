vi.mock('@/i18n', () => ({ t: key => `translated:${key}` }))

import { applySchemaDefaults, createSchemaForm, valueForSchemaValidation } from '@/utils/json-schema-form'

describe('json-schema-form', () => {
  const schema = {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', title: 'Email address', description: 'Primary email' },
      status: { type: 'string', enum: ['active', 'disabled'], default: 'active' },
      latitude: { type: 'number', minimum: -90, maximum: 90 },
      enabled: { type: 'boolean', default: true },
      tags: { type: 'array', items: { type: 'string' }}
    }
  }

  it('converts supported JSON Schema properties into FormAdmin fields', () => {
    const definition = createSchemaForm(schema)

    expect(definition.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ property: 'email', type: 'email', required: true, field_options: { label: 'translated:Email address' }, help: 'translated:Primary email' }),
      expect.objectContaining({ property: 'status', type: 'select', default_value: 'active' }),
      expect.objectContaining({ property: 'latitude', type: 'integer', type_options: { min: -90, max: 90, step: 0.01 }}),
      expect.objectContaining({ property: 'enabled', type: 'boolean' }),
      expect.objectContaining({ property: 'tags', type: 'array' })
    ]))
    expect(definition.structure.email.metadata.nullable).toBe(false)
    expect(definition.structure.status.translation).toBe('translated:Status')
    expect(definition.fields.find(field => field.property === 'status').type_options.options).toEqual([
      { value: 'active', label: 'translated:active' },
      { value: 'disabled', label: 'translated:disabled' }
    ])
    expect(definition.fields.find(field => field.property === 'status')).not.toHaveProperty('help')
  })

  it('applies defaults without removing existing unknown properties', () => {
    const value = applySchemaDefaults(schema, { legacy: 'keep', enabled: false })

    expect(value).toEqual({ legacy: 'keep', enabled: false, status: 'active', tags: [] })
  })

  it('initialises an absent object value and applies property defaults', () => {
    expect(applySchemaDefaults(schema, null)).toEqual({ status: 'active', enabled: true, tags: [] })
  })

  it('rejects schemas with unsupported composition keywords', () => {
    expect(createSchemaForm({ type: 'object', properties: { value: { oneOf: [{ type: 'string' }] }}})).toBeNull()
  })

  it('merges matching EasyAdmin field configuration and uses its order', () => {
    const definition = createSchemaForm(schema, [
      { property: 'enabled', hidden: true, field_options: { label: 'Custom label' }},
      { property: 'email', type_options: { placeholder: 'name@example.com' }, required: false },
      { property: 'missing', type: 'input' }
    ])

    expect(definition.fields.map(field => field.property)).toEqual(['enabled', 'email', 'status', 'latitude', 'tags'])
    expect(definition.fields[0]).toMatchObject({ hidden: true, field_options: { label: 'Custom label' }})
    expect(definition.fields[1]).toMatchObject({
      required: true,
      type_options: { placeholder: 'name@example.com' }
    })
    expect(definition.fields.map(field => field.property)).not.toContain('missing')
  })

  it('removes blank values from a validation copy without changing filled values', () => {
    const value = { email: '', enabled: false, tags: [], nested: { note: '' }}
    const validationValue = valueForSchemaValidation({
      type: 'object',
      properties: {
        email: { type: 'string' },
        enabled: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' }},
        nested: { type: 'object', properties: { note: { type: 'string' }}}
      }
    }, value)

    expect(validationValue).toEqual({ enabled: false })
    expect(value).toEqual({ email: '', enabled: false, tags: [], nested: { note: '' }})
  })
})
