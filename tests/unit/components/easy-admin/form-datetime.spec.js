import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import ElementPlus from 'element-plus'
import DatetimePlugin from '@/components/EasyAdmin/plugins/form/datetime.vue'

function makeWrapper(form, field) {
  return mount(DatetimePlugin, {
    props: { form, field },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (k) => k }
    }
  })
}

function picker(wrapper) {
  return wrapper.findComponent({ name: 'ElDatePicker' })
}

describe('form-datetime plugin', () => {
  it('renders ElDatePicker with datetime type, full timestamp format and translated placeholder', () => {
    const form = reactive({ createdAt: '2024-01-15 10:20:30' })
    const field = reactive({ property: 'createdAt', type: 'datetime' })
    const wrapper = makeWrapper(form, field)
    const p = picker(wrapper)
    expect(p.exists()).toBe(true)
    expect(p.props('type')).toBe('datetime')
    expect(p.props('valueFormat')).toBe('yyyy-MM-dd HH:mm:ss')
    expect(p.props('placeholder')).toBe('Select date & time')
    wrapper.unmount()
  })

  it('binds initial datetime string to picker modelValue', () => {
    const form = reactive({ createdAt: '2024-01-15 10:20:30' })
    const field = reactive({ property: 'createdAt' })
    const wrapper = makeWrapper(form, field)
    expect(picker(wrapper).props('modelValue')).toBe('2024-01-15 10:20:30')
    wrapper.unmount()
  })

  it('updates form model when picker emits update:modelValue', async () => {
    const form = reactive({ createdAt: '' })
    const field = reactive({ property: 'createdAt' })
    const wrapper = makeWrapper(form, field)
    await picker(wrapper).vm.$emit('update:modelValue', '2025-06-01 08:00:00')
    await nextTick()
    expect(form.createdAt).toBe('2025-06-01 08:00:00')
    wrapper.unmount()
  })

  it('reflects external form changes in picker modelValue', async () => {
    const form = reactive({ createdAt: '2024-01-15 10:20:30' })
    const field = reactive({ property: 'createdAt' })
    const wrapper = makeWrapper(form, field)
    form.createdAt = '2026-09-15 12:34:56'
    await nextTick()
    expect(picker(wrapper).props('modelValue')).toBe('2026-09-15 12:34:56')
    wrapper.unmount()
  })

  it('preserves seconds precision in datetime strings', async () => {
    const form = reactive({ createdAt: '' })
    const field = reactive({ property: 'createdAt' })
    const wrapper = makeWrapper(form, field)
    await picker(wrapper).vm.$emit('update:modelValue', '2024-02-29 23:59:59')
    await nextTick()
    expect(form.createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect(form.createdAt).toBe('2024-02-29 23:59:59')
    wrapper.unmount()
  })

  it('forwards field.type_options onto the picker', () => {
    const form = reactive({ createdAt: '' })
    const field = reactive({ property: 'createdAt', type_options: { disabled: true, clearable: false } })
    const wrapper = makeWrapper(form, field)
    const p = picker(wrapper)
    expect(p.props('disabled')).toBe(true)
    expect(p.props('clearable')).toBe(false)
    wrapper.unmount()
  })

  it('forwards field.type_events handlers to the picker', async () => {
    const form = reactive({ createdAt: '' })
    const onChange = vi.fn()
    const field = reactive({ property: 'createdAt', type_events: { change: onChange } })
    const wrapper = makeWrapper(form, field)
    await picker(wrapper).vm.$emit('change', '2024-05-01 00:00:00')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('2024-05-01 00:00:00')
    wrapper.unmount()
  })

  it('mounts safely with default (empty) form/field props', () => {
    const wrapper = mount(DatetimePlugin, {
      global: { plugins: [ElementPlus], mocks: { $t: (k) => k } }
    })
    expect(picker(wrapper).exists()).toBe(true)
    wrapper.unmount()
  })
})
