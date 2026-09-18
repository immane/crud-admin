// Repository port: CRUD behavior behind the query boundary.
// Implemented by adapters (CrudSkeleton first). Pure interfaces only.

import type { EntityListResponse, EntityRecord } from '../model/record'
import type { ApiResponse } from '@/types/api'

export interface AdminRepository {
  retrieve(pk: number | string): Promise<ApiResponse<EntityRecord>>
  list(parameter?: Record<string, any>): Promise<EntityListResponse>
  create(data: Record<string, any>): Promise<ApiResponse<EntityRecord>>
  update(pk: number | string, data: Record<string, any>): Promise<ApiResponse<EntityRecord>>
  delete(pk: number | string): Promise<ApiResponse<unknown>>
  deleteMany(pks: Array<number | string>): Promise<Array<PromiseSettledResult<ApiResponse<unknown>>>>
  batchUpdate(ids: Array<number | string>, data: Record<string, any>): Promise<ApiResponse<unknown>>
}
