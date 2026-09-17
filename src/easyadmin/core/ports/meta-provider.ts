// Metadata port: entity discovery and structure behind the query boundary.
// Pure interfaces only. Uses the application-facing EntityStructure view; the
// backend-faithful raw shape (including the `plantext` spelling) is documented
// in ../model/admin-meta.ts for adapter-boundary use.

import type { EntityStructure } from '@/types/api'

export interface MetaProvider {
  listEntities(): Promise<string[]>
  getStructure(fqcn: string): Promise<EntityStructure>
}
