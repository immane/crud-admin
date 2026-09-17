import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import ElementPlus, { ElInput } from 'element-plus'
import InputPlugin from '@/easyadmin/ui/vue/plugins/form/input.vue'

function mountInput(formData = { name: '' }, fieldData = { property: 'name' }) {
  const form = reactive(formData)
  const field = reactive(fieldData)
  const wrapper = mount(InputPlugin, {
    props: { form, field },
    global: { plugins: [ElementPlus] }
  })
  return { wrapper, form, field }
}

describe('form/input.vue', () => {
  it('renders the initial form value in the inner input', () => {
    const { wrapper } = mountInput({ name: 'hello' }, { property: 'name' })
    expect(wrapper.find('input').element.value).toBe('hello')
  })

  it('updates form[field.property] on user input (v-model)', async() => {
    const { wrapper, form } = mountInput({ name: '' }, { property: 'name' })
    await wrapper.find('input').setValue('world')
    expect(form.name).toBe('world')
  })

  it('reflects external form mutations in the input', async() => {
    const { wrapper, form } = mountInput({ name: 'a' }, { property: 'name' })
    form.name = 'external'
    await nextTick()
    expect(wrapper.find('input').element.value).toBe('external')
  })

  it('creates the property when it was initially undefined', async() => {
    const { wrapper, form } = mountInput({}, { property: 'nickname' })
    await wrapper.find('input').setValue('nick')
    expect(form.nickname).toBe('nick')
  })

  it('passes type_options through to el-input', () => {
    const { wrapper } = mountInput(
      { name: 'x' },
      { property: 'name', type_options: { placeholder: 'Enter name', maxlength: 10, clearable: true } }
    )
    const input = wrapper.findComponent(ElInput)
    expect(input.props('placeholder')).toBe('Enter name')
    expect(input.props('maxlength')).toBe(10)
    expect(input.props('clearable')).toBe(true)
  })

  it('applies disabled from type_options to the native input', () => {
    const { wrapper } = mountInput(
      { name: 'x' },
      { property: 'name', type_options: { disabled: true } }
    )
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('forwards type_events to el-input', async() => {
    const onBlur = vi.fn()
    const onFocus = vi.fn()
    const { wrapper } = mountInput(
      { name: 'x' },
      { property: 'name', type_events: { blur: onBlur, focus: onFocus } }
    )
    const input = wrapper.findComponent(ElInput)
    input.vm.$emit('blur', new FocusEvent('blur'))
    input.vm.$emit('focus', new FocusEvent('focus'))
    await nextTick()
    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('mounts without type_options / type_events', () => {
    const { wrapper, form } = mountInput({ name: 'plain' }, { property: 'name' })
    expect(wrapper.find('input').element.value).toBe('plain')
    expect(form.name).toBe('plain')
  })

  it('mounts with default props (no form / field given)', () => {
    const wrapper = mount(InputPlugin, { global: { plugins: [ElementPlus] } })
    expect(wrapper.findComponent(ElInput).exists()).toBe(true)
  })
})
