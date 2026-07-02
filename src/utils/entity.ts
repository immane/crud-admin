import request from '@/utils/request'
import store from '@/store'
import { API_PREFIX, SYSTEM_API_PREFIX, apiPath } from '@/api/prefix'
import { ApiResponse, EntityStructure } from '@/types/api'
import inflectFactory from 'i'

const inflect = inflectFactory(true)

type EntityConf = string | {
  name: string
  prefix?: string
  plural?: string
}

interface EntityRecord {
  id: number
  __toString?: string
  [key: string]: any
}

interface EntityListResponse {
  data: EntityRecord[]
  paginator?: Record<string, any>
}

export default class EntityManage {
  name: string | null = null
  plural: string | null = null
  prefix = apiPath(API_PREFIX, 'manage')

  constructor(conf: EntityConf) {
    const parameterize = (text: string) =>
      inflect.dasherize(inflect.underscore(inflect.pluralize(text)))

    if (typeof conf === 'string') {
      this.name = conf
      this.plural = parameterize(this.name)
    } else {
      this.name = conf.name
      this.prefix = conf.prefix || this.prefix
      this.plural = conf.plural || parameterize(this.name)
    }
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

    let structureMap = store.getters.entity.structures
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
}
