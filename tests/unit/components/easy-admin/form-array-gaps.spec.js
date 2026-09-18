import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import ArrayField from '@/easyadmin/ui/vue/plugins/form/array.vue'

vi.mock('@/easyadmin/ui/vue/FormAdmin', () => ({
  default: {
    name: 'FormAdmin',
    template: '<div class="form-admin-stub" />',
    props: ['modelValue', 'entityConf', 'fields']
  }
}))

function mountWithDefaults(extra = {}) {
  return mount(ArrayField, {
    props: {},
    global: { plugins: [ElementPlus], mocks: { $t: (key) => key }},
    ...extra
  })
}

describe('form/array.vue gaps', () => {
  it('covers form prop default factory (lines 101-102)', () => {
    const wrapper = mountWithDefaults()
    // form defaults to {}; field defaults to {} so property is undefined -> created() adds [undefined] key
    expect(wrapper.vm.options).toEqual([])
    expect(wrapper.vm.fields).toBeUndefined()
    expect(wrapper.props('form').undefined).toEqual([])
  })

  it('covers field prop default factory (lines 107-108)', () => {
    const wrapper = mount(ArrayField, {
      props: { form: { tags: [] }},
      global: { plugins: [ElementPlus], mocks: { $t: (key) => key }}
    })
    expect(wrapper.props('field')).toEqual({})
    expect(wrapper.vm.fields).toBeUndefined()
    expect(wrapper.vm.options).toEqual([])
  })

  it('covers both defaults together without crashing created()', () => {
    const wrapper = mount(ArrayField, {
      global: { plugins: [ElementPlus], mocks: { $t: (key) => key }}
    })
    expect(wrapper.vm.fields).toBeUndefined()
    expect(wrapper.vm.options).toEqual([])
    expect(wrapper.props('form').undefined).toEqual([])
  })
})
