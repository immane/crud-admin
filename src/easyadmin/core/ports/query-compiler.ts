// Compiler port: AdminQuery in, transport params out. Pure interfaces only.

import type { AdminQuery } from '../query/admin-query'

export interface QueryCompiler<TParams extends Record<string, any> = Record<string, any>> {
  compile(adminQuery: AdminQuery & { query?: Record<string, string> }): TParams
}
