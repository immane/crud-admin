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
import orderGolden from './__fixtures__/order.golden.json'
import userGolden from './__fixtures__/user.golden.json'
import productGolden from './__fixtures__/product-query.golden.json'

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

const CASES = [
  ['Order', orderGolden],
  ['User', userGolden],
  ['Product', productGolden]
]

describe('golden/csqe-params', () => {
  for (const [name, golden] of CASES) {
    describe(`${name} fixture`, () => {
      const { input } = golden
      const filters = filtersFromShorthands(FILTER_SHORTHANDS[input.entity])
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
