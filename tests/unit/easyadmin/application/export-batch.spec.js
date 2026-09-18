import { describe, it, expect } from 'vitest'
import { buildExportRequest, exportFilename } from '@/easyadmin/application/usecases/export-records'
import {
  collectBatchDeleteIds,
  collectBatchUpdateData,
  buildBatchUpdateBody
} from '@/easyadmin/application/usecases/batch-update-records'

describe('application/usecases/export-records', () => {
  it('exports the filename as export-<Entity>.csv', () => {
    expect(exportFilename('Order')).toBe('export-Order.csv')
  })

  it('merges query as Object.assign(configQuery, filter, exportQuery)', () => {
    const req = buildExportRequest(
      'Order',
      {
        configQuery: { a: 1, b: 1 },
        filter: { b: 2 },
        exportQuery: { b: 3, c: 3 },
        rows: []
      },
      {}
    )
    expect(req.query).toEqual({ a: 1, b: 3, c: 3 })
  })

  it('uses a provided non-empty label as-is (no derivation)', () => {
    const req = buildExportRequest('Product', { rows: [{ a: 1, b: 2 }] }, { a: 'A' })
    expect(req.label).toEqual({ a: 'A' })
  })

  it('derives label from the last row keys when the label is missing/empty', () => {
    expect(buildExportRequest('Order', { rows: [{ a: 1 }, { b: 2, c: 3 }] }).label).toEqual({
      b: 'b',
      c: 'c'
    })
    expect(buildExportRequest('Order', { rows: [{ a: 1 }] }, {}).label).toEqual({ a: 'a' })
  })

  it('unwraps __toString and coerces other objects AND arrays to [Object] (source bug preserved)', () => {
    const req = buildExportRequest(
      'Order',
      {
        rows: [
          {
            rel: { __toString: 'Rin', username: 'Rin' },
            plain: { x: 1 },
            arr: [1, 2],
            nil: null,
            scalar: 'hi'
          }
        ]
      },
      {}
    )
    expect(req.data).toEqual([
      { rel: 'Rin', plain: '[Object]', arr: '[Object]', nil: null, scalar: 'hi' }
    ])
  })

  it('maps missing rows to empty data and label', () => {
    expect(buildExportRequest('User', {})).toEqual({
      query: {},
      label: {},
      filename: 'export-User.csv',
      data: []
    })
  })

  it('maps empty rows to empty data and label', () => {
    expect(buildExportRequest('User', { rows: [] }, {})).toEqual({
      query: {},
      label: {},
      filename: 'export-User.csv',
      data: []
    })
  })
})

describe('application/usecases/batch-update-records', () => {
  it('collects ids and drops only null/undefined (loose != null)', () => {
    expect(collectBatchDeleteIds([{ id: 1 }, { id: null }, {}, { id: 0 }, { id: 'x' }])).toEqual([
      1,
      0,
      'x'
    ])
    expect(collectBatchDeleteIds([])).toEqual([])
  })

  it('collects only selected fields owned by the form and declared in batchFields', () => {
    expect(
      collectBatchUpdateData(
        [{ property: 'a' }, { property: 'b' }],
        ['a', 'b', 'c'],
        { a: 1, c: 3 }
      )
    ).toEqual({ a: 1 })
  })

  it('includes empty relation arrays initialized by form plugins when hasOwn', () => {
    expect(
      collectBatchUpdateData([{ property: 'tags' }], ['tags'], { tags: [] })
    ).toEqual({ tags: [] })
  })

  it('returns {} for empty selectedFields', () => {
    expect(collectBatchUpdateData([{ property: 'a' }], [], { a: 1 })).toEqual({})
  })

  it('shapes the batch body as ids.map(id => ({ id, ...data }))', () => {
    expect(buildBatchUpdateBody([1, 2], { phoneVerified: true })).toEqual([
      { id: 1, phoneVerified: true },
      { id: 2, phoneVerified: true }
    ])
    expect(buildBatchUpdateBody([5], {})).toEqual([{ id: 5 }])
  })
})
