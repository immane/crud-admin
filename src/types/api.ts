export interface Paginator {
  totalCount?: number
  [key: string]: unknown
}

export interface ApiResponse<T = unknown> {
  code: number
  message?: string
  data: T
  paginator?: Paginator
}

export interface Metadata {
  type?: string
  nullable?: boolean
  targetEntity?: string
  [key: string]: unknown
}

export interface EntityStructureField {
  plaintext?: string
  translation?: string
  metadata?: Metadata
  [key: string]: unknown
}

export type EntityStructure = Record<string, EntityStructureField>