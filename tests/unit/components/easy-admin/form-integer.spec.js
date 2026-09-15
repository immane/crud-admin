import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import ElementPlus, { ElInputNumber } from 'element-plus'
import IntegerPlugin from '@/components/EasyAdmin/plugins/form/integer.vue'

function mountInteger(formData = { count: 0 }, fieldData = { property: 'count' }) {
  const form = reactive(formData)
  const field = reactive(fieldData)
  const wrapper = mount(IntegerPlugin, {
    props: { form, field },
    global: { plugins: [ElementPlus] }
  })
  return { wrapper, form, field }
}

describe('form/integer.vue', () => {
  it('renders the initial numeric value', () => {
    const { wrapper } = mountInteger({ count: 7 }, { property: 'count' })
    expect(wrapper.find('input').element.value).toBe('7')
  })

  it('updates form[field.property] as a number on user input', async() => {
    const { wrapper, form } = mountInteger({ count: 0 }, { property: 'count' })
    await wrapper.find('input').setValue('42')
    expect(form.count).toBe(42)
  })

  it('increments via the step control (ArrowUp)', async() => {
    const { wrapper, form } = mountInteger({ count: 5 }, { property: 'count' })
    await wrapper.find('input').trigger('keydown', { code: 'ArrowUp', key: 'ArrowUp' })
    await nextTick()
    expect(form.count).toBe(6)
  })

  it('decrements via the step control (ArrowDown)', async() => {
    const { wrapper, form } = mountInteger({ count: 5 }, { property: 'count' })
    await wrapper.find('input').trigger('keydown', { code: 'ArrowDown', key: 'ArrowDown' })
    await nextTick()
    expect(form.count).toBe(4)
  })

  it('reflects external form mutations', async() => {
    const { wrapper, form } = mountInteger({ count: 1 }, { property: 'count' })
    form.count = 99
    await nextTick()
    expect(wrapper.find('input').element.value).toBe('99')
  })

  it('passes type_options (min / max / step / disabled) through to el-input-number', () => {
    const { wrapper } = mountInteger(
      { count: 5 },
      { property: 'count', type_options: { min: 1, max: 10, step: 2, disabled: true } }
    )
    const num = wrapper.findComponent(ElInputNumber)
    expect(num.props('min')).toBe(1)
    expect(num.props('max')).toBe(10)
    expect(num.props('step')).toBe(2)
    expect(num.props('disabled')).toBe(true)
  })

  it('forwards type_events to el-input-number', async() => {
    const onChange = vi.fn()
    const { wrapper } = mountInteger(
      { count: 1 },
      { property: 'count', type_events: { change: onChange } }
    )
    wrapper.findComponent(ElInputNumber).vm.$emit('change', 7, 1)
    await nextTick()
    expect(onChange).toHaveBeenCalledWith(7, 1)
  })

  it('mounts with null / undefined value without crashing', () => {
    const { wrapper, form } = mountInteger({ count: null }, { property: 'count' })
    expect(wrapper.findComponent(ElInputNumber).exists()).toBe(true)
    expect(form.count).toBeNull()
  })
})
