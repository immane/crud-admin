import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/i18n', () => ({ t: key => `translated:${key}` }))

import DetailJsonSchema from '@/components/EasyAdmin/plugins/detail/json_schema.vue'

async function settled(wrapper) {
  await flushPromises()
  await wrapper.vm.$nextTick()
}

function mountCell({ value, schema, scope = { row: { id: 3 } } }) {
  return mount(DetailJsonSchema, {
    props: { value, field: { property: 'contact', type_options: { schema } }, scope, em: { name: 'Store' }, struct: {} },
    global: { directives: { loading: {} } }
  })
}

describe('detail/json_schema.vue', () => {
  const schema = {
    type: 'object',
    properties: {
      phone: { type: 'string', title: 'Phone' },
      enabled: { type: 'boolean', title: 'Enabled' },
      tags: { type: 'array', title: 'Tags', items: { type: 'string' } }
    }
  }

  it('renders known fields in schema order and preserves unknown values', async () => {
    const wrapper = mountCell({ value: { enabled: true, phone: '13800000000', legacyCode: 'old', tags: ['a', 'b'] }, schema })
    await settled(wrapper)

    expect(wrapper.findAll('dt').map(node => node.text())).toEqual([
      'translated:Phone', 'translated:Enabled', 'translated:Tags', 'translated:Legacy Code'
    ])
    expect(wrapper.findAll('dd').map(node => node.text())).toEqual(['13800000000', 'true', 'a, b', 'old'])
    wrapper.unmount()
  })

  it('parses a JSON string value', async () => {
    const wrapper = mountCell({ value: '{"phone":"13800000000"}', schema })
    await settled(wrapper)

    expect(wrapper.find('dd').text()).toBe('13800000000')
    wrapper.unmount()
  })

  it('handles empty, scalar, array, and invalid JSON detail values', async () => {
    const empty = mountCell({ value: null, schema })
    await settled(empty)
    expect(empty.vm.parsed).toBeNull()
    expect(empty.find('.detail-json-schema__empty').exists()).toBe(true)
    empty.unmount()

    const emptyObject = mountCell({ value: {}, schema })
    await settled(emptyObject)
    expect(emptyObject.find('.detail-json-schema__empty').exists()).toBe(true)
    emptyObject.unmount()

    const scalar = mountCell({ value: 42, schema })
    await settled(scalar)
    expect(scalar.vm.rows).toEqual([])
    scalar.unmount()

    const array = mountCell({ value: ['one'], schema })
    await settled(array)
    expect(array.vm.rows).toEqual([])
    array.unmount()

    const invalidJson = mountCell({ value: '{invalid', schema })
    await settled(invalidJson)
    expect(invalidJson.vm.parsed).toBe('{invalid')
    invalidJson.unmount()
  })

  it('formats empty, array, and object values', async () => {
    const wrapper = mountCell({ value: { phone: '13800000000' }, schema })
    await settled(wrapper)

    expect(wrapper.vm.formatValue(null)).toBe('-')
    expect(wrapper.vm.formatValue(['one', 'two'])).toBe('one, two')
    expect(wrapper.vm.formatValue({ nested: true })).toBe('{"nested":true}')
    wrapper.unmount()
  })

  it('passes record context to an asynchronous schema provider', async () => {
    const provider = vi.fn(async context => {
      expect(context).toMatchObject({ entity: 'Store', id: 3, property: 'contact' })
      return schema
    })
    const wrapper = mountCell({ value: { phone: '13800000000' }, schema: provider })
    await settled(wrapper)

    expect(provider).toHaveBeenCalledTimes(1)
    expect(wrapper.find('dd').text()).toBe('13800000000')
    wrapper.unmount()
  })

  it('uses EasyAdmin field override ordering and labels', async () => {
    const wrapper = mount(DetailJsonSchema, {
      props: {
        value: { phone: '13800000000', enabled: true },
        field: {
          property: 'contact',
          type_options: { schema, fields: [{ property: 'enabled', field_options: { label: 'Custom enabled' } }] }
        },
        scope: { row: { id: 3 } },
        em: { name: 'Store' },
        struct: {}
      },
      global: { directives: { loading: {} } }
    })
    await settled(wrapper)

    expect(wrapper.findAll('dt').map(node => node.text())).toEqual(['Custom enabled', 'translated:Phone'])
    wrapper.unmount()
  })

  it('falls back to the raw JSON detail renderer for unsupported schemas', async () => {
    const wrapper = mountCell({ value: { phone: '13800000000' }, schema: { oneOf: [{ type: 'object' }] } })
    await settled(wrapper)

    expect(wrapper.find('.detail-json').exists()).toBe(true)
    wrapper.unmount()
  })
})
