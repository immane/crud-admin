// Backend-faithful metadata types for GET /system/entities[/{fqcn}].
// Pure types only. The backend spells the label field `plantext` (not
// `plaintext`); preserve that spelling at the adapter boundary and normalize
// only in application code if a normalized view becomes necessary.

export interface RawFieldMetadata {
  type?: string
  columnName?: string
  nullable?: boolean
  targetEntity?: string
  [key: string]: unknown
}

export interface RawFieldStructure {
  metadata?: RawFieldMetadata
  plantext?: string
  translation?: string
  [key: string]: unknown
}

export type RawEntityStructure = Record<string, RawFieldStructure>
