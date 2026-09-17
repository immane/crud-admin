import request from '@/utils/request'
import store from '@/store'
import { API_PREFIX, SYSTEM_API_PREFIX, apiPath } from '@/api/prefix'
import { ApiResponse, EntityStructure } from '@/types/api'
import inflectFactory from 'i'
import { resolveEntityIdentity, type EntityConf } from '@/easyadmin/core/model/entity-identity'
import type { EntityListResponse, EntityRecord } from '@/easyadmin/core/model/record'

const inflect = inflectFactory(true)

const parameterize = (text: string) =>
  inflect.dasherize(inflect.underscore(inflect.pluralize(text)))

export class CrudSkeletonAdapter {
  name: string | null = null
  plural: string | null = null
  prefix = apiPath(API_PREFIX, 'manage')

  constructor(conf: EntityConf) {
    const identity = resolveEntityIdentity(conf, {
      defaultPrefix: this.prefix,
      parameterize
    })
    this.name = identity.name
    this.prefix = identity.prefix
    this.plural = identity.plural
  }

  async structure(): Promise<EntityStructure> {
    let entities = store.getters.entity.entities ? store.getters.entity.entities : []
    if (!(entities instanceof Array && entities.length)) {
      const entityResponse = await request.get(apiPath(SYSTEM_API_PREFIX, 'entities')) as ApiResponse<string[]>
      entities = entityResponse.data
      store.dispatch('entity/set_entities', entities)
    }

    const list = entities.filter((v: string) => v.split('\\').pop() === this.name)

    if (!list.length) {
      throw Error('No entity was found.')
    }

    const structureMap = store.getters.entity.structures
    if (structureMap && Object.prototype.hasOwnProperty.call(structureMap, list[0])) {
      return structureMap[list[0]]
    }

    const structureResponse = await request.get(apiPath(SYSTEM_API_PREFIX, `entities/${list[0]}`)) as ApiResponse<EntityStructure>
    const structure = structureResponse.data
    store.dispatch('entity/set_structures', { entity: list[0], structure })
    return structure
  }

  async retrieve(pk: number | string): Promise<ApiResponse<EntityRecord>> {
    return await request.get(apiPath(this.prefix, `${this.plural}/${pk}`))
  }

  async list(parameter?: Record<string, any>): Promise<EntityListResponse> {
    return await request.get(apiPath(this.prefix, this.plural || ''), { params: parameter })
  }

  async create(data: Record<string, any>): Promise<ApiResponse<EntityRecord>> {
    return await request.post(apiPath(this.prefix, this.plural || ''), data)
  }

  async update(pk: number | string, data: Record<string, any>): Promise<ApiResponse<EntityRecord>> {
    return await request.put(apiPath(this.prefix, `${this.plural}/${pk}`), data)
  }

  async delete(pk: number | string): Promise<ApiResponse<unknown>> {
    return await request.delete(apiPath(this.prefix, `${this.plural}/${pk}`))
  }

  async deleteMany(pks: Array<number | string>): Promise<PromiseSettledResult<ApiResponse<unknown>>[]> {
    return await Promise.allSettled(pks.map(pk => this.delete(pk)))
  }

  async batchUpdate(ids: Array<number | string>, data: Record<string, any>): Promise<ApiResponse<unknown>> {
    const records = ids.map(id => ({ id, ...data }))
    return await request.post(
      apiPath(this.prefix, `${this.plural}/batch-update`),
      records,
      { params: { '@basis': 'id', '@mode': 'update' } }
    )
  }
}

export default CrudSkeletonAdapter
