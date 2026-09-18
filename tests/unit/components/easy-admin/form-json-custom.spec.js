import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'

if (!globalThis.$t) globalThis.$t = (k) => k

vi.mock('@/easyadmin/ui/vue/FormAdmin', () => ({
  __esModule: true,
  default: {
    name: 'FormAdmin',
    props: ['modelValue', 'entityConf', 'fields'],
    emits: ['update:modelValue'],
    template: '<div class="form-admin-stub" />'
  }
}))

import JsonCustomPlugin from '@/easyadmin/ui/vue/plugins/form/json-custom.vue'

const FormAdminStubName = 'FormAdmin'

function makeWrapper(form, field) {
  return mount(JsonCustomPlugin, {
    props: { form, field },
    global: { mocks: { $t: (k) => k } }
  })
}

function formAdmin(wrapper) {
  return wrapper.findComponent({ name: FormAdminStubName })
}

describe('form-json-custom plugin', () => {
  it('renders nested FormAdmin with entity Option and configured fields', () => {
    const form = reactive({ extra: {} })
    const nested = [
      { property: 'link', type: 'input', field_options: { label: 'Url' } },
      { property: 'listOrder', type: 'input', field_options: { label: 'List order' } }
    ]
    const field = reactive({ property: 'extra', type_options: { fields: nested } })
    const wrapper = makeWrapper(form, field)
    const fa = formAdmin(wrapper)
    expect(fa.exists()).toBe(true)
    expect(fa.props('entityConf')).toBe('Option')
    expect(fa.props('fields')).toEqual(nested)
    wrapper.unmount()
  })

  it('binds v-model to the nested form object', async () => {
    const form = reactive({ extra: { link: 'a' } })
    const field = reactive({
      property: 'extra',
      type_options: { fields: [{ property: 'link', type: 'input' }] }
    })
    const wrapper = makeWrapper(form, field)
    expect(formAdmin(wrapper).props('modelValue')).toEqual({ link: 'a' })
    await formAdmin(wrapper).vm.$emit('update:modelValue', { link: 'b' })
    await nextTick()
    expect(form.extra).toEqual({ link: 'b' })
    wrapper.unmount()
  })

  it('falls back to a default common field when type_options.fields is absent', () => {
    const form = reactive({})
    const field = reactive({ property: 'extra' })
    const wrapper = makeWrapper(form, field)
    expect(wrapper.vm.fields).toEqual([
      { property: 'common', type: 'input', field_options: { label: 'Default' } }
    ])
    expect(formAdmin(wrapper).props('fields')).toEqual(wrapper.vm.fields)
    wrapper.unmount()
  })

  it('initialises missing nested value to an empty object on created', () => {
    const form = reactive({})
    const field = reactive({ property: 'extra', type_options: { fields: [{ property: 'link', type: 'input' }] } })
    const wrapper = makeWrapper(form, field)
    expect(form.extra).toEqual({})
    wrapper.unmount()
  })

  it('normalises array nested values to an empty object on created', () => {
    const form = reactive({ extra: [{ link: 'x' }] })
    const field = reactive({ property: 'extra', type_options: { fields: [{ property: 'link', type: 'input' }] } })
    const wrapper = makeWrapper(form, field)
    expect(form.extra).toEqual({})
    wrapper.unmount()
  })

  it('preserves an existing nested object on created', () => {
    const form = reactive({ extra: { link: 'keep', listOrder: '1' } })
    const field = reactive({ property: 'extra', type_options: { fields: [{ property: 'link', type: 'input' }] } })
    const wrapper = makeWrapper(form, field)
    expect(form.extra).toEqual({ link: 'keep', listOrder: '1' })
    wrapper.unmount()
  })

  it('renders title and action slots without crashing', () => {
    const form = reactive({ extra: {} })
    const field = reactive({ property: 'extra', type_options: { fields: [{ property: 'link', type: 'input' }] } })
    const wrapper = makeWrapper(form, field)
    expect(wrapper.html()).toContain('form-admin-stub')
    wrapper.unmount()
  })

  it('supports multiple nested fields including image and input types', () => {
    const form = reactive({ pictures: {} })
    const field = reactive({
      property: 'pictures',
      type_options: {
        fields: [
          { property: 'picture', type: 'image', field_options: { label: 'Picture' } },
          { property: 'link', type: 'input', field_options: { label: 'Url' } },
          { property: 'listOrder', type: 'input', field_options: { label: 'List order' } }
        ]
      }
    })
    const wrapper = makeWrapper(form, field)
    expect(formAdmin(wrapper).props('fields')).toHaveLength(3)
    expect(form.pictures).toEqual({})
    wrapper.unmount()
  })
})
