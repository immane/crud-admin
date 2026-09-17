// CrudSkeleton metadata provider: entity discovery and structure cache.
// Owns the Vuex + sessionStorage cache flow (via the store module) while the
// store remains the persistence implementation detail.
// No Vue components, no query translation.

import request from '@/utils/request'
import store from '@/store'
import { SYSTEM_API_PREFIX, apiPath } from '@/api/prefix'
import type { ApiResponse, EntityStructure } from '@/types/api'
import type { MetaProvider } from '@/easyadmin/core/ports/meta-provider'

export class CrudSkeletonMetaProvider implements MetaProvider {
  async listEntities(): Promise<string[]> {
    let entities = store.getters.entity.entities ? store.getters.entity.entities : []
    if (!(entities instanceof Array && entities.length)) {
      const entityResponse = await request.get(apiPath(SYSTEM_API_PREFIX, 'entities')) as ApiResponse<string[]>
      entities = entityResponse.data
      store.dispatch('entity/set_entities', entities)
    }
    return entities
  }

  async getStructure(fqcn: string): Promise<EntityStructure> {
    const structureMap = store.getters.entity.structures
    if (structureMap && Object.prototype.hasOwnProperty.call(structureMap, fqcn)) {
      return structureMap[fqcn]
    }

    const structureResponse = await request.get(apiPath(SYSTEM_API_PREFIX, `entities/${fqcn}`)) as ApiResponse<EntityStructure>
    const structure = structureResponse.data
    store.dispatch('entity/set_structures', { entity: fqcn, structure })
    return structure
  }
}

export default CrudSkeletonMetaProvider
