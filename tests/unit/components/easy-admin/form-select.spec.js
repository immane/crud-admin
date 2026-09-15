import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import ElementPlus, { ElSelect, ElOption } from 'element-plus'
import SelectPlugin from '@/components/EasyAdmin/plugins/form/select.vue'

const OPTIONS = [
  { value: 'v1', label: 'Label1' },
  { value: 'v2', label: 'Label2' }
]

function mountSelect(formData = { status: '' }, fieldData = { property: 'status' }) {
  const form = reactive(formData)
  const field = reactive(fieldData)
  const wrapper = mount(SelectPlugin, {
    props: { form, field },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key }
    }
  })
  return { wrapper, form, field }
}

function withOptions(extra = {}) {
  return { property: 'status', type_options: { options: OPTIONS, ...extra } }
}

describe('form/select.vue', () => {
  it('renders one el-option per entry in type_options.options', () => {
    const { wrapper } = mountSelect({ status: '' }, withOptions())
    const options = wrapper.findAllComponents(ElOption)
    expect(options).toHaveLength(2)
    expect(options[0].props('value')).toBe('v1')
    expect(options[0].props('label')).toBe('Label1')
    expect(options[1].props('value')).toBe('v2')
    expect(options[1].props('label')).toBe('Label2')
  })

  it('binds the form value as the select model value', () => {
    const { wrapper } = mountSelect({ status: 'v2' }, withOptions())
    expect(wrapper.findComponent(ElSelect).props('modelValue')).toBe('v2')
  })

  it('writes a user selection back to form[field.property]', async() => {
    const { wrapper, form } = mountSelect({ status: '' }, withOptions())
    await wrapper.findComponent(ElSelect).vm.$emit('update:modelValue', 'v1')
    expect(form.status).toBe('v1')
  })

  it('renders with zero options when type_options.options is missing', () => {
    const { wrapper } = mountSelect({ status: '' }, { property: 'status' })
    expect(wrapper.findComponent(ElSelect).exists()).toBe(true)
    expect(wrapper.findAllComponents(ElOption)).toHaveLength(0)
  })

  it('is filterable and clearable by default with a translated placeholder', () => {
    const { wrapper } = mountSelect({ status: '' }, withOptions())
    const select = wrapper.findComponent(ElSelect)
    expect(select.props('filterable')).toBe(true)
    expect(select.props('clearable')).toBe(true)
    expect(select.props('placeholder')).toBe('Please select')
  })

  it('allows type_options to override filterable and placeholder', () => {
    const { wrapper } = mountSelect(
      { status: '' },
      withOptions({ filterable: false, placeholder: 'Pick one' })
    )
    const select = wrapper.findComponent(ElSelect)
    expect(select.props('filterable')).toBe(false)
    expect(select.props('placeholder')).toBe('Pick one')
  })

  it('supports multiple mode with array values', async() => {
    const { wrapper, form } = mountSelect(
      { status: ['v1'] },
      withOptions({ multiple: true })
    )
    expect(wrapper.findComponent(ElSelect).props('multiple')).toBe(true)
    await wrapper.findComponent(ElSelect).vm.$emit('update:modelValue', ['v1', 'v2'])
    expect(form.status).toEqual(['v1', 'v2'])
  })

  it('supports integer option values', async() => {
    const { wrapper, form } = mountSelect(
      { level: 2 },
      { property: 'level', type_options: { options: [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }] } }
    )
    expect(wrapper.findComponent(ElSelect).props('modelValue')).toBe(2)
    await wrapper.findComponent(ElSelect).vm.$emit('update:modelValue', 1)
    expect(form.level).toBe(1)
  })

  it('clears the form value to empty on clear', async() => {
    const { wrapper, form } = mountSelect({ status: 'v1' }, withOptions())
    await wrapper.findComponent(ElSelect).vm.$emit('update:modelValue', '')
    expect(form.status).toBe('')
  })

  it('forwards type_events to el-select', async() => {
    const onChange = vi.fn()
    const { wrapper } = mountSelect(
      { status: '' },
      withOptions({}),
    )
    await wrapper.setProps({
      field: { property: 'status', type_options: { options: OPTIONS }, type_events: { change: onChange } }
    })
    wrapper.findComponent(ElSelect).vm.$emit('change', 'v2')
    await nextTick()
    expect(onChange).toHaveBeenCalledWith('v2')
  })

  it('reflects external form mutations', async() => {
    const { wrapper, form } = mountSelect({ status: 'v1' }, withOptions())
    form.status = 'v2'
    await nextTick()
    expect(wrapper.findComponent(ElSelect).props('modelValue')).toBe('v2')
  })
})
