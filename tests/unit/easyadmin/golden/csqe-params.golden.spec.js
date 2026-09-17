import { describe, it, expect } from 'vitest'
import { buildAdminQuery } from '@/easyadmin/application/query/build-admin-query'
import { compileCsqeQuery } from '@/easyadmin/adapters/crudskeleton/CrudSkeletonQueryCompiler'
import { buildQueryParams, buildUrlSearch } from '@/easyadmin/application/query/url-query-sync'
import { shorthandExpression } from '@/easyadmin/core/query/dql-ops'
import { buildExportRequest } from '@/easyadmin/application/usecases/export-records'
import {
  collectBatchDeleteIds,
  collectBatchUpdateData,
  buildBatchUpdateBody
} from '@/easyadmin/application/usecases/batch-update-records'

// Load every golden fixture in __fixtures__ (keeps explicit toEqual, no snapshots).
const goldenModules = import.meta.glob('./__fixtures__/*.golden.json', { eager: true })
const CASES = Object.entries(goldenModules)
  .map(([path, mod]) => [path, mod.default ?? mod])
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

// Rebuild the { key: { expression } } filters map from the entity list_filter
// shorthand shapes (src/configs/collections/*), using the real
// dottedKeyToExpression + matches/== rules:
// - string shorthand (or null) -> input -> `entity... matches ':value'`
// - object shorthand without `expression` -> select -> `entity... == ':value'`
// - object with `expression` -> full-style, used as-is.
function filtersFromShorthands(defs) {
  return Object.fromEntries(
    Object.entries(defs).map(([key, field]) => [key, { expression: shorthandExpression(key, field).expression }])
  )
}

// Shorthand shapes mirror Order.js / User.js list_filter (labels simplified;
// only the string-vs-object shape drives the derived expression).
const FILTER_SHORTHANDS = {
  Order: {
    status: {
      __label: 'Status',
      draft: 'Draft',
      pending: 'Pending',
      confirmed: 'Confirmed',
      paid: 'Paid',
      fulfilled: 'Fulfilled',
      completed: 'Completed',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    },
    'user.username': 'User',
    currency: 'Currency',
    paymentMethod: 'Payment Method'
  },
  User: {
    username: 'Username',
    email: 'Email',
    phone: 'Phone',
    phoneVerified: {
      label: 'Phone Verified',
      type: 'boolean',
      expression: 'entity.getPhoneVerified() == :value'
    }
  },
  Product: {
    'category.name': 'Category'
  }
}

// Entities whose list_filter uses full-style inline expressions (no shorthand
// derivation): the expression is the locked config shape, used as-is.
const INLINE_FILTERS = {
  // Assignment: falsy rule drops revokedAt:false / scopeUuid:'' from @filter
  // (revokedAt has no ':value' placeholder, so substitution would leave
  // `entity.getRevokedAt()` unchanged even when truthy).
  Assignment: {
    userUuid: { expression: `entity.getUserUuid() matches ':value'` },
    roleId: { expression: `entity.getRole().getId() == ':value'` },
    scopeType: { expression: `entity.getScopeType() == ':value'` },
    scopeUuid: { expression: `entity.getScopeUuid() matches ':value'` },
    revokedAt: { expression: 'entity.getRevokedAt()' }
  },
  // AuditLog: placeholder inside a quoted datetime.get(":value") call.
  AuditLog: {
    createdAt: { expression: `entity.getCreatedAt() >= datetime.get(":value")` }
  },
  // Role: `system` key maps to `entity.getIsSystem() == :value`
  // (key-vs-expression mismatch; backend DQL fast path only accepts getX(),
  // so the boolean `isSystem` property must be queried as getIsSystem()).
  Role: {
    code: { expression: `entity.getCode() matches ':value'` },
    system: { expression: 'entity.getIsSystem() == :value' }
  },
  Setting: {
    key: { expression: `entity.getKey() matches ':value'` }
  },
  Stock: {
    storeUuid: { expression: `entity.getStoreUuid() matches ':value'` }
  }
}

function filtersFor(entity) {
  if (FILTER_SHORTHANDS[entity]) return filtersFromShorthands(FILTER_SHORTHANDS[entity])
  if (INLINE_FILTERS[entity]) return INLINE_FILTERS[entity]
  throw new Error(`No filter definitions for entity "${entity}"`)
}

describe('golden/csqe-params', () => {
  for (const [path, golden] of CASES) {
    const name = `${golden.input.entity} (${path.split('/').pop()})`
    describe(`${name} fixture`, () => {
      const { input } = golden
      const filters = filtersFor(input.entity)
      const adminQuery = buildAdminQuery({
        entity: input.entity,
        listFilterData: input.listFilterData,
        filters,
        pager: input.pager,
        sort: input.sort,
        query: input.query
      })

      it('builds the golden admin query', () => {
        expect(adminQuery).toEqual(golden.adminQuery)
      })

      it('compiles the golden csqe params (base query merged, filter/pager/sort override)', () => {
        // buildAdminQuery carries no base query; the ListAdmin dataProcessor
        // flow merges Object.assign({}, query, filter, pager, sort), so the
        // base query travels via the compiler `query` field.
        expect(compileCsqeQuery({ ...adminQuery, query: input.query })).toEqual(golden.csqeParams)
      })

      it('syncs the golden url query string', () => {
        expect(buildUrlSearch(buildQueryParams(input.listFilterData, input.pager))).toBe(
          golden.urlQueryString
        )
      })

      it('builds the golden export request', () => {
        const req = buildExportRequest(
          input.entity,
          {
            configQuery: input.exportConf.configQuery,
            filter: input.exportConf.filter,
            exportQuery: input.exportConf.exportQuery,
            rows: input.exportConf.rows
          },
          input.exportConf.exportLabel
        )
        expect(req.query).toEqual(golden.exportRequest.query)
        expect(req.filename).toBe(golden.exportRequest.filename)
        expect(req.label).toEqual(golden.exportRequest.label)
        expect(req.data).toEqual(golden.exportRequest.data)
      })

      it('builds the golden batch update body', () => {
        const ids = collectBatchDeleteIds(input.batch.records)
        const data = collectBatchUpdateData(
          input.batch.batchFields,
          input.batch.selectedFields,
          input.batch.form
        )
        expect(buildBatchUpdateBody(ids, data)).toEqual(golden.batchUpdateBody)
      })
    })
  }
})
