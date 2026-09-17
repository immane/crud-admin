import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

vi.mock('@/components/EasyAdmin/FormAdmin', () => ({
  __esModule: true,
  default: {
    name: 'FormAdmin',
    props: {
      modelValue: Object,
      embedded: Boolean,
      entityConf: Object,
      fields: Array,
      structureOverride: Object
    },
    template: '<div class="form-admin-stub" />'
  }
}))

vi.mock('@/components/EasyAdmin/plugins/form/json.vue', () => ({
  __esModule: true,
  default: { name: 'JsonEditor', template: '<div class="json-editor-stub" />' }
}))

import JsonSchemaPlugin from '@/components/EasyAdmin/plugins/form/json_schema.vue'

async function settled(wrapper) {
  await flushPromises()
  await wrapper.vm.$nextTick()
}

function mountPlugin({ form = reactive({ value: null }), schema, admin } = {}) {
  const field = reactive({ property: 'value', type_options: { schema } })
  return mount(JsonSchemaPlugin, {
    props: { form, field },
    global: {
      provide: { getFormAdmin: () => admin },
      directives: { loading: {} }
    }
  })
}

describe('form-json-schema plugin', () => {
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      enabled: { type: 'boolean', default: true }
    }
  }

  it('renders a local embedded FormAdmin and registers full-object validation', async () => {
    const registerFieldValidator = vi.fn()
    const wrapper = mountPlugin({ admin: { em: { name: 'Store' }, id: 3, registerFieldValidator }, schema })
    await settled(wrapper)

    const nested = wrapper.findComponent({ name: 'FormAdmin' })
    expect(nested.props('embedded')).toBe(true)
    expect(nested.props('structureOverride').email.metadata.type).toBe('email')
    expect(wrapper.props('form').value).toEqual({ enabled: true })
    expect(registerFieldValidator).toHaveBeenCalledWith('value', expect.any(Function), 'change')
    wrapper.unmount()
  })

  it('supports asynchronous schema providers and supplies form context', async () => {
    const schemaProvider = vi.fn(async context => {
      expect(context).toMatchObject({ entity: 'Store', id: 3, property: 'value' })
      return schema
    })
    const wrapper = mountPlugin({ admin: { em: { name: 'Store' }, id: 3, registerFieldValidator: vi.fn() }, schema: schemaProvider })
    await settled(wrapper)

    expect(schemaProvider).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent({ name: 'FormAdmin' }).exists()).toBe(true)
    wrapper.unmount()
  })

  it('passes EasyAdmin field overrides to the generated nested form', async () => {
    const form = reactive({ value: { email: 'store@example.com' } })
    const field = reactive({
      property: 'value',
      type_options: {
        schema,
        fields: [{ property: 'email', field_options: { label: 'Business email' } }]
      }
    })
    const wrapper = mount(JsonSchemaPlugin, {
      props: { form, field },
      global: { provide: { getFormAdmin: () => ({ registerFieldValidator: vi.fn() }) }, directives: { loading: {} } }
    })
    await settled(wrapper)

    expect(wrapper.findComponent({ name: 'FormAdmin' }).props('fields')[0].field_options.label).toBe('Business email')
    wrapper.unmount()
  })

  it('reports JSON Schema errors through the registered validator', async () => {
    const registerFieldValidator = vi.fn()
    const wrapper = mountPlugin({ admin: { registerFieldValidator }, schema })
    await settled(wrapper)
    const validator = registerFieldValidator.mock.calls[0][1]
    const callback = vi.fn()

    validator({}, { email: 'not-an-email', extra: true }, callback)
    expect(callback).toHaveBeenCalledWith(expect.any(Error))
    wrapper.unmount()
  })

  it('skips optional blank fields but rejects blank required fields', async () => {
    const registerFieldValidator = vi.fn()
    const wrapper = mountPlugin({ admin: { registerFieldValidator }, schema })
    await settled(wrapper)
    const validator = registerFieldValidator.mock.calls[0][1]
    const optionalCallback = vi.fn()
    const requiredCallback = vi.fn()

    validator({}, { email: '' }, optionalCallback)
    expect(optionalCallback).toHaveBeenCalledWith()
    wrapper.unmount()

    const requiredWrapper = mountPlugin({
      admin: { registerFieldValidator },
      schema: { ...schema, required: ['email'] }
    })
    await settled(requiredWrapper)
    registerFieldValidator.mock.calls.at(-1)[1]({}, { email: '' }, requiredCallback)
    expect(requiredCallback).toHaveBeenCalledWith(expect.any(Error))
    requiredWrapper.unmount()
  })

  it('skips an empty optional root object instead of validating it as a non-object', async () => {
    const registerFieldValidator = vi.fn()
    const wrapper = mountPlugin({ admin: { registerFieldValidator }, form: reactive({ value: null }), schema })
    await settled(wrapper)
    const callback = vi.fn()

    registerFieldValidator.mock.calls[0][1]({}, null, callback)
    expect(callback).toHaveBeenCalledWith()
    wrapper.unmount()
  })

  it('validates required schema properties when the root object is empty', async () => {
    const registerFieldValidator = vi.fn()
    const wrapper = mountPlugin({
      admin: { registerFieldValidator },
      form: reactive({ value: null }),
      schema: { ...schema, required: ['email'] }
    })
    await settled(wrapper)
    const callback = vi.fn()

    registerFieldValidator.mock.calls[0][1]({}, null, callback)
    expect(callback).toHaveBeenCalledWith(expect.any(Error))
    wrapper.unmount()
  })

  it('uses schemas with an id and rejects an empty outer required field', async () => {
    const registerFieldValidator = vi.fn()
    const field = reactive({
      property: 'value',
      required: true,
      type_options: { schema: { ...schema, $id: 'test://schema/outer-required' } }
    })
    const wrapper = mount(JsonSchemaPlugin, {
      props: { form: reactive({ value: null }), field },
      global: { provide: { getFormAdmin: () => ({ registerFieldValidator }) }, directives: { loading: {} } }
    })
    await settled(wrapper)
    const callback = vi.fn()

    registerFieldValidator.mock.calls[0][1]({}, null, callback)
    expect(callback).toHaveBeenCalledWith(expect.any(Error))
    wrapper.unmount()
  })

  it('falls back to the raw JSON editor for unsupported schemas', async () => {
    const wrapper = mountPlugin({ admin: { registerFieldValidator: vi.fn() }, schema: { oneOf: [{ type: 'object' }] } })
    await settled(wrapper)

    expect(wrapper.find('.json-editor-stub').exists()).toBe(true)
    wrapper.unmount()
  })
})
