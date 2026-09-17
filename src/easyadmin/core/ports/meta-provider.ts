// Metadata port: entity discovery and structure behind the query boundary.
// Pure interfaces only.

import type { RawEntityStructure } from '../model/admin-meta'

export interface MetaProvider {
  listEntities(): Promise<string[]>
  getStructure(fqcn: string): Promise<RawEntityStructure>
  structure(): Promise<RawEntityStructure>
}
