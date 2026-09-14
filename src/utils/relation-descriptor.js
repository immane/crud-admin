const relationTypes = {
  ManyToOne: false,
  OneToOne: false,
  ManyToMany: true,
  OneToMany: true
}

const entityName = (value) => {
  if (!value) return ''
  if (typeof value === 'object') return value.name || ''
  return String(value).split('\\').pop()
}

const inferredEntity = (property, entities) => {
  const match = String(property || '').match(/^(.+?)(Uuids?|UUIDs?)$/)
  if (!match) return ''
  const name = match[1][0].toUpperCase() + match[1].slice(1)
  return entities && entities[name] ? name : ''
}

export const resolveRelation = (field = {}, struct = {}, entities = {}) => {
  const relation = field.relation || {}
  const metadataType = struct?.metadata?.type
  const explicitTarget = relation.target || relation.entity || relation.entity_name
  const conventionalTarget = field.type_options?.entity_name || struct?.metadata?.targetEntity
  const target = explicitTarget || conventionalTarget || inferredEntity(field.property, entities)
  const name = entityName(target)

  if (!name) return null

  const isUuid = relation.valueKey
    ? relation.valueKey === 'uuid'
    : (!conventionalTarget && /Uuids?$/i.test(field.property || ''))
  const multiple = typeof relation.multiple === 'boolean'
    ? relation.multiple
    : relation.cardinality
      ? relation.cardinality === 'many'
      : Object.prototype.hasOwnProperty.call(relationTypes, metadataType)
        ? relationTypes[metadataType]
        : /Uuids$/i.test(field.property || '')
  const targetOptions = typeof target === 'object' ? target : {}

  return {
    name,
    plural: relation.plural || targetOptions.plural,
    prefix: relation.prefix || targetOptions.prefix,
    valueKey: isUuid ? 'uuid' : 'id',
    multiple: !!multiple
  }
}

export const relationValue = (record, relation) => record?.[relation?.valueKey || 'id']

export const relationLabel = (record, fallback = '') => {
  if (!record || typeof record !== 'object') return String(fallback || '')
  return record.__toString || record.name || record.title || record.username || record.email || record.phone || record.code || record.uuid || String(record.id ?? fallback ?? '')
}
