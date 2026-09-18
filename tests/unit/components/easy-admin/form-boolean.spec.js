import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import ElementPlus, { ElCheckbox } from 'element-plus'
import BooleanPlugin from '@/easyadmin/ui/vue/plugins/form/boolean.vue'

function mountBoolean(formData = { agree: false }, fieldData = { property: 'agree' }) {
  const form = reactive(formData)
  const field = reactive(fieldData)
  const wrapper = mount(BooleanPlugin, {
    props: { form, field },
    global: { plugins: [ElementPlus] }
  })
  return { wrapper, form, field }
}

describe('form/boolean.vue', () => {
  it('renders unchecked when the form value is false', () => {
    const { wrapper } = mountBoolean({ agree: false }, { property: 'agree' })
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(false)
  })

  it('renders checked when the form value is true', () => {
    const { wrapper } = mountBoolean({ agree: true }, { property: 'agree' })
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true)
  })

  it('toggles false -> true on user check', async() => {
    const { wrapper, form } = mountBoolean({ agree: false }, { property: 'agree' })
    await wrapper.find('input[type="checkbox"]').setChecked()
    expect(form.agree).toBe(true)
  })

  it('toggles true -> false on user uncheck', async() => {
    const { wrapper, form } = mountBoolean({ agree: true }, { property: 'agree' })
    await wrapper.find('input[type="checkbox"]').setChecked(false)
    expect(form.agree).toBe(false)
  })

  it('reflects external form mutations', async() => {
    const { wrapper, form } = mountBoolean({ agree: false }, { property: 'agree' })
    form.agree = true
    await nextTick()
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true)
  })

  it('passes type_options (label / disabled) through to el-checkbox', () => {
    const { wrapper } = mountBoolean(
      { agree: false },
      { property: 'agree', type_options: { label: 'I agree', disabled: true }}
    )
    const checkbox = wrapper.findComponent(ElCheckbox)
    expect(checkbox.props('label')).toBe('I agree')
    expect(checkbox.props('disabled')).toBe(true)
    expect(wrapper.find('input[type="checkbox"]').attributes('disabled')).toBeDefined()
  })

  it('forwards type_events to el-checkbox', async() => {
    const onChange = vi.fn()
    const { wrapper } = mountBoolean(
      { agree: false },
      { property: 'agree', type_events: { change: onChange }}
    )
    wrapper.findComponent(ElCheckbox).vm.$emit('change', true)
    await nextTick()
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('mounts without type_options / type_events', () => {
    const { wrapper } = mountBoolean({ agree: false }, { property: 'agree' })
    expect(wrapper.findComponent(ElCheckbox).exists()).toBe(true)
  })
})
