import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import ElementPlus from 'element-plus'
import DatePlugin from '@/easyadmin/ui/vue/plugins/form/date.vue'

function makeWrapper(form, field) {
  return mount(DatePlugin, {
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

describe('form-date plugin', () => {
  it('renders ElDatePicker with date type, yyyy-MM-dd format and translated placeholder', () => {
    const form = reactive({ birth: '2024-01-15' })
    const field = reactive({ property: 'birth', type: 'date' })
    const wrapper = makeWrapper(form, field)
    const p = picker(wrapper)
    expect(p.exists()).toBe(true)
    expect(p.props('type')).toBe('date')
    expect(p.props('valueFormat')).toBe('yyyy-MM-dd')
    expect(p.props('placeholder')).toBe('Select date')
    wrapper.unmount()
  })

  it('binds initial form value to picker modelValue', () => {
    const form = reactive({ birth: '2024-01-15' })
    const field = reactive({ property: 'birth' })
    const wrapper = makeWrapper(form, field)
    expect(picker(wrapper).props('modelValue')).toBe('2024-01-15')
    wrapper.unmount()
  })

  it('updates form model when picker emits update:modelValue', async() => {
    const form = reactive({ birth: '' })
    const field = reactive({ property: 'birth' })
    const wrapper = makeWrapper(form, field)
    await picker(wrapper).vm.$emit('update:modelValue', '2025-12-01')
    await nextTick()
    expect(form.birth).toBe('2025-12-01')
    expect(picker(wrapper).props('modelValue')).toBe('2025-12-01')
    wrapper.unmount()
  })

  it('reflects external form changes in picker modelValue', async() => {
    const form = reactive({ birth: '2024-01-15' })
    const field = reactive({ property: 'birth' })
    const wrapper = makeWrapper(form, field)
    form.birth = '2026-09-15'
    await nextTick()
    expect(picker(wrapper).props('modelValue')).toBe('2026-09-15')
    wrapper.unmount()
  })

  it('clears model to null when picker is cleared', async() => {
    const form = reactive({ birth: '2024-01-15' })
    const field = reactive({ property: 'birth' })
    const wrapper = makeWrapper(form, field)
    await picker(wrapper).vm.$emit('update:modelValue', null)
    await nextTick()
    expect(form.birth).toBeNull()
    wrapper.unmount()
  })

  it('forwards field.type_options onto the picker', () => {
    const form = reactive({ birth: '' })
    const field = reactive({ property: 'birth', type_options: { disabled: true, clearable: false }})
    const wrapper = makeWrapper(form, field)
    const p = picker(wrapper)
    expect(p.props('disabled')).toBe(true)
    expect(p.props('clearable')).toBe(false)
    wrapper.unmount()
  })

  it('forwards field.type_events handlers to the picker', async() => {
    const form = reactive({ birth: '' })
    const onChange = vi.fn()
    const field = reactive({ property: 'birth', type_events: { change: onChange }})
    const wrapper = makeWrapper(form, field)
    await picker(wrapper).vm.$emit('change', '2024-05-01')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('2024-05-01')
    wrapper.unmount()
  })

  it('mounts safely with default (empty) form/field props', () => {
    const wrapper = mount(DatePlugin, {
      global: { plugins: [ElementPlus], mocks: { $t: (k) => k }}
    })
    expect(picker(wrapper).exists()).toBe(true)
    wrapper.unmount()
  })
})
