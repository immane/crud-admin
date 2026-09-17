import { t } from '@/i18n'

const supportedTypes = new Set(['string', 'number', 'integer', 'boolean', 'object', 'array'])

function labelFor(property, schema) {
  const label = schema.title || property
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, char => char.toUpperCase())
  return t(label)
}

function schemaType(schema) {
  if (Array.isArray(schema.type)) return schema.type.find(type => type !== 'null')
  return schema.type
}

function supportsSchema(schema) {
  if (!schema || typeof schema !== 'object' || !supportedTypes.has(schemaType(schema))) return false
  if (schema.$ref || schema.oneOf || schema.anyOf || schema.allOf || schema.patternProperties) return false
  if (schemaType(schema) === 'object') {
    return Object.values(schema.properties || {}).every(supportsSchema)
  }
  if (schemaType(schema) === 'array') {
    return !schema.items || supportsSchema(schema.items)
  }
  return true
}

function fieldType(schema) {
  const type = schemaType(schema)
  if (schema.enum || Object.hasOwn(schema, 'const')) return 'select'
  if (type === 'boolean') return 'boolean'
  if (type === 'integer' || type === 'number') return 'integer'
  if (type === 'object') return 'json_schema'
  if (type === 'array') return schemaType(schema.items || {}) === 'object' ? 'json' : 'array'
  if (schema.format === 'email') return 'email'
  if (schema.format === 'date') return 'date'
  if (schema.format === 'date-time') return 'datetime'
  return schema.maxLength > 120 || schema.format === 'textarea' ? 'textarea' : 'input'
}

function typeOptions(schema, type) {
  const options = {}
  if (type === 'select') {
    const values = schema.enum || [schema.const]
    options.options = values.map(value => ({ value, label: t(String(value)) }))
  }
  if (type === 'integer') {
    if (schema.minimum !== undefined) options.min = schema.minimum
    if (schema.maximum !== undefined) options.max = schema.maximum
    if (schemaType(schema) === 'number') options.step = 0.01
  }
  if (['input', 'email', 'textarea'].includes(type)) {
    if (schema.minLength !== undefined) options.minlength = schema.minLength
    if (schema.maxLength !== undefined) {
      options.maxlength = schema.maxLength
      options['show-word-limit'] = true
    }
  }
  if (type === 'array') {
    options.options = (schema.items?.enum || []).map(value => ({ value, label: t(String(value)) }))
  }
  if (type === 'json_schema') options.schema = schema
  return options
}

function mergeField(base, override) {
  return {
    ...base,
    ...override,
    // Schema-required fields cannot be made optional through presentation config.
    required: base.required || Boolean(override.required),
    field_options: { ...base.field_options, ...override.field_options },
    type_options: { ...base.type_options, ...override.type_options }
  }
}

export function createSchemaForm(schema, configuredFields = []) {
  if (!supportsSchema(schema) || schemaType(schema) !== 'object') return null

  const required = new Set(schema.required || [])
  const generatedFields = []
  const structure = {}

  for (const [property, propertySchema] of Object.entries(schema.properties || {})) {
    const type = fieldType(propertySchema)
    const field = {
      property,
      type,
      required: required.has(property),
      field_options: { label: labelFor(property, propertySchema) },
      type_options: typeOptions(propertySchema, type)
    }
    if (propertySchema.default !== undefined) field.default_value = propertySchema.default
    if (propertySchema.description) field.help = t(propertySchema.description)
    generatedFields.push(field)
    structure[property] = {
      translation: labelFor(property, propertySchema),
      metadata: { type, nullable: !required.has(property) }
    }
  }

  const fieldsByProperty = new Map(generatedFields.map(field => [field.property, field]))
  const overrides = Array.isArray(configuredFields) ? configuredFields : []
  const overrideByProperty = new Map()
  const overrideOrder = []
  for (const override of overrides) {
    if (!override || typeof override !== 'object' || !fieldsByProperty.has(override.property)) continue
    if (!overrideByProperty.has(override.property)) overrideOrder.push(override.property)
    overrideByProperty.set(override.property, override)
  }

  const fields = [
    ...overrideOrder.map(property => mergeField(fieldsByProperty.get(property), overrideByProperty.get(property))),
    ...generatedFields
      .filter(field => !overrideByProperty.has(field.property))
  ]

  return { fields, structure }
}

export function applySchemaDefaults(schema, value) {
  const type = schemaType(schema)
  if (value === undefined || value === null) {
    if (schema.default !== undefined) value = structuredClone(schema.default)
    else if (type === 'object') value = {}
    else if (type === 'array') value = []
    else return value
  }

  if (type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [property, propertySchema] of Object.entries(schema.properties || {})) {
      value[property] = applySchemaDefaults(propertySchema, value[property])
      if (value[property] === undefined) delete value[property]
    }
  }
  if (type === 'array' && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => { value[index] = applySchemaDefaults(schema.items, item) })
  }
  return value
}

function isBlank(value) {
  return value === undefined || value === null || value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
}

// Optional blank fields are not user input. Strip them from a validation copy
// while preserving the original form value for submission.
export function valueForSchemaValidation(schema, value) {
  const type = schemaType(schema)
  if (type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    const normalized = {}
    const properties = schema.properties || {}
    for (const [property, propertyValue] of Object.entries(value)) {
      const propertySchema = properties[property]
      const nextValue = propertySchema
        ? valueForSchemaValidation(propertySchema, propertyValue)
        : propertyValue
      if (!isBlank(nextValue)) normalized[property] = nextValue
    }
    return normalized
  }
  if (type === 'array' && Array.isArray(value) && schema.items) {
    return value.map(item => valueForSchemaValidation(schema.items, item))
  }
  return value
}
