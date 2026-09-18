// Canonical record types. Pure types only.

export interface EntityRecord {
  id: number
  __toString?: string
  [key: string]: any
}

export interface EntityListResponse {
  data: EntityRecord[]
  paginator?: Record<string, any>
}
