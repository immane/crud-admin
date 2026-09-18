import { describe, it, expect } from 'vitest'
import { resolveBatchFields } from '@/easyadmin/application/usecases/resolve-batch-fields'

describe('application/usecases/resolve-batch-fields', () => {
  it('maps undefined to an empty array', () => {
    expect(resolveBatchFields(undefined)).toEqual([])
  })

  it('maps Role-style string arrays to property objects', () => {
    expect(resolveBatchFields(['name'])).toEqual([{ property: 'name' }])
  })

  it('maps Content-style string arrays to property objects', () => {
    expect(resolveBatchFields(['category', 'tags'])).toEqual([
      { property: 'category' },
      { property: 'tags' }
    ])
  })

  it('passes User-style object arrays through with a spread copy', () => {
    const input = [{ property: 'phoneVerified', type: 'boolean', help: 'User phoneVerified help' }]
    const out = resolveBatchFields(input)
    expect(out).toEqual(input)
    expect(out[0]).not.toBe(input[0])
  })

  it('preserves component keys via spread (no markRaw/toRaw wrapping)', () => {
    const component = { name: 'DummyField' }
    const input = [{ property: 'role', component, required: true }]
    const out = resolveBatchFields(input)
    expect(out).toEqual([{ property: 'role', component, required: true }])
    expect(out[0].component).toBe(component)
    expect(out[0]).not.toBe(input[0])
  })
})
