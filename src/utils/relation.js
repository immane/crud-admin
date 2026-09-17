import CrudSkeletonAdapter from '@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter'
export { relationIdentifier, relationLabel, relationValue, resolveRelation } from './relation-descriptor'

const recordCache = new Map()

const listData = (response) => {
  const payload = response?.data ?? response
  return Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])
}

export const loadRelationRecords = async(relation, emPrefix = '') => {
  const key = [relation.name, relation.plural || '', relation.prefix || emPrefix, relation.valueKey].join(':')
  if (!recordCache.has(key)) {
    const entity = new CrudSkeletonAdapter({
      name: relation.name,
      plural: relation.plural,
      prefix: relation.prefix || emPrefix || undefined
    })
    recordCache.set(key, entity.list({ '@display': 'reduce', limit: 1e10 }).then(listData).catch(() => []))
  }
  return recordCache.get(key)
}

export const clearRelationRecordCache = () => recordCache.clear()
