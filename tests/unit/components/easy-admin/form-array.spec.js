import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElButton, ElOption, ElSelect } from 'element-plus'
import ArrayField from '@/easyadmin/ui/vue/plugins/form/array.vue'

vi.mock('@/easyadmin/ui/vue/FormAdmin', () => ({
  default: {
    name: 'FormAdmin',
    template: '<div class="form-admin-stub" />',
    props: ['modelValue', 'entityConf', 'fields']
  }
}))

const OPTIONS = [
  { value: 'value_1', label: 'Label_1' },
  { value: 'value_2', label: 'Label_2' }
]

const FIELDS = [
  { property: 'picture', type: 'image', field_options: { label: 'Picture' }},
  { property: 'link', type: 'input', field_options: { label: 'Url' }}
]

function mountArray({ form = {}, field = { property: 'tags' }} = {}) {
  return mount(ArrayField, {
    props: { form, field },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key }
    }
  })
}

describe('form/array.vue', () => {
  it('initializes a missing property to an empty array on created', () => {
    const form = {}
    mountArray({ form, field: { property: 'tags' }})

    expect(form.tags).toEqual([])
  })

  it('normalizes empty-string and non-array values to an empty array', () => {
    const emptyString = { tags: '' }
    mountArray({ form: emptyString, field: { property: 'tags' }})
    expect(emptyString.tags).toEqual([])

    const scalar = { tags: 'value_1' }
    mountArray({ form: scalar, field: { property: 'tags' }})
    expect(scalar.tags).toEqual([])

    const missing = {}
    mountArray({ form: missing, field: { property: 'tags' }})
    expect(missing.tags).toEqual([])
  })

  it('keeps an existing array untouched on created', () => {
    const form = { tags: ['value_1'] }
    mountArray({ form, field: { property: 'tags' }})

    expect(form.tags).toEqual(['value_1'])
  })

  it('defaults to simple mode with no options when type_options is absent', () => {
    const form = { tags: [] }
    const wrapper = mountArray({ form, field: { property: 'tags' }})

    expect(wrapper.vm.fields).toBeUndefined()
    expect(wrapper.vm.options).toEqual([])
    expect(wrapper.findComponent(ElSelect).exists()).toBe(true)
    expect(wrapper.findAllComponents(ElOption)).toHaveLength(0)
    expect(wrapper.find('.form-admin-stub').exists()).toBe(false)
  })

  it('renders one el-option per entry in type_options.options', () => {
    const form = { tags: [] }
    const wrapper = mountArray({
      form,
      field: { property: 'tags', type_options: { options: OPTIONS }}
    })

    expect(wrapper.vm.options).toEqual(OPTIONS)
    const options = wrapper.findAllComponents(ElOption)
    expect(options).toHaveLength(2)
    expect(options[0].props('value')).toBe('value_1')
    expect(options[0].props('label')).toBe('Label_1')
  })

  it('binds the form array as the simple select model value', () => {
    const form = { tags: ['value_2'] }
    const wrapper = mountArray({
      form,
      field: { property: 'tags', type_options: { options: OPTIONS }}
    })

    const select = wrapper.findComponent(ElSelect)
    expect(select.props('modelValue')).toEqual(['value_2'])
    expect(select.props('multiple')).toBe(true)
    expect(select.props('filterable')).toBe(true)
    expect(select.props('allowCreate')).toBe(true)
  })

  it('writes simple-mode selections back to form[field.property]', async() => {
    const form = { tags: [] }
    const wrapper = mountArray({
      form,
      field: { property: 'tags', type_options: { options: OPTIONS }}
    })

    await wrapper.findComponent(ElSelect).vm.$emit('update:modelValue', ['value_1', 'value_2'])
    expect(form.tags).toEqual(['value_1', 'value_2'])
  })

  it('exposes nested fields from type_options.fields', () => {
    const form = { pictures: [] }
    const wrapper = mountArray({
      form,
      field: { property: 'pictures', type_options: { fields: FIELDS }}
    })

    expect(wrapper.vm.fields).toEqual(FIELDS)
    expect(wrapper.findComponent(ElSelect).exists()).toBe(false)
  })

  it('appends an empty object per Add click in nested mode', async() => {
    const form = {}
    const wrapper = mountArray({
      form,
      field: { property: 'pictures', type_options: { fields: FIELDS }}
    })
    await flushPromises()

    const add = () => wrapper.findAllComponents(ElButton).find(button => button.text().includes('Add'))
    expect(add().exists()).toBe(true)

    await add().trigger('click')
    expect(form.pictures).toEqual([{}])

    await add().trigger('click')
    expect(form.pictures).toEqual([{}, {}])
  })

  it('initializes an empty-string value before appending in nested mode', async() => {
    const form = { pictures: '' }
    const wrapper = mountArray({
      form,
      field: { property: 'pictures', type_options: { fields: FIELDS }}
    })

    await wrapper.findAllComponents(ElButton).find(button => button.text().includes('Add')).trigger('click')
    expect(form.pictures).toEqual([{}])
  })

  it('renders one nested form-admin stub per row with the row as model value', async() => {
    const form = { pictures: [{ link: 'a' }, { link: 'b' }] }
    const wrapper = mountArray({
      form,
      field: { property: 'pictures', type_options: { fields: FIELDS }}
    })
    await flushPromises()

    const nested = wrapper.findAll('.form-admin-stub')
    expect(nested).toHaveLength(2)
  })

  it('removes exactly the clicked row in nested mode', async() => {
    const form = { pictures: [{ link: 'a' }, { link: 'b' }, { link: 'c' }] }
    const wrapper = mountArray({
      form,
      field: { property: 'pictures', type_options: { fields: FIELDS }}
    })
    await flushPromises()

    const deletes = () => wrapper
      .findAllComponents(ElButton)
      .filter(button => !button.text().includes('Add'))
    expect(deletes()).toHaveLength(3)

    await deletes()[1].trigger('click')
    expect(form.pictures).toEqual([{ link: 'a' }, { link: 'c' }])
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.form-admin-stub')).toHaveLength(2)
  })

  it('removes the last remaining row in nested mode', async() => {
    const form = { pictures: [{ link: 'only' }] }
    const wrapper = mountArray({
      form,
      field: { property: 'pictures', type_options: { fields: FIELDS }}
    })
    await flushPromises()

    const deletes = wrapper
      .findAllComponents(ElButton)
      .filter(button => !button.text().includes('Add'))
    await deletes[0].trigger('click')

    expect(form.pictures).toEqual([])
  })
})
