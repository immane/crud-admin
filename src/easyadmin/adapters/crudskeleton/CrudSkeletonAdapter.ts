import request from '@/utils/request'
import { API_PREFIX, apiPath } from '@/api/prefix'
import { ApiResponse, EntityStructure } from '@/types/api'
import inflectFactory from 'i'
import { resolveEntityIdentity, type EntityConf } from '@/easyadmin/core/model/entity-identity'
import type { EntityListResponse, EntityRecord } from '@/easyadmin/core/model/record'
import type { AdminRepository } from '@/easyadmin/core/ports/admin-repository'
import type { MetaProvider } from '@/easyadmin/core/ports/meta-provider'
import { CrudSkeletonMetaProvider } from './CrudSkeletonMetaProvider'

const inflect = inflectFactory(true)

const parameterize = (text: string) =>
  inflect.dasherize(inflect.underscore(inflect.pluralize(text)))

export class CrudSkeletonAdapter implements AdminRepository, MetaProvider {
  name: string | null = null
  plural: string | null = null
  prefix = apiPath(API_PREFIX, 'manage')

  constructor(conf: EntityConf, private meta: MetaProvider = new CrudSkeletonMetaProvider()) {
    const identity = resolveEntityIdentity(conf, {
      defaultPrefix: this.prefix,
      parameterize
    })
    this.name = identity.name
    this.prefix = identity.prefix
    this.plural = identity.plural
  }

  async listEntities(): Promise<string[]> {
    return this.meta.listEntities()
  }

  async getStructure(fqcn: string): Promise<EntityStructure> {
    return this.meta.getStructure(fqcn)
  }

  async structure(): Promise<EntityStructure> {
    const entities = await this.meta.listEntities()

    const list = entities.filter((v: string) => v.split('\\').pop() === this.name)

    if (!list.length) {
      throw Error('No entity was found.')
    }

    return this.meta.getStructure(list[0])
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
