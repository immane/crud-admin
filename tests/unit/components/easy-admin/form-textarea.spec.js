import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import ElementPlus, { ElInput } from 'element-plus'
import TextareaPlugin from '@/components/EasyAdmin/plugins/form/textarea.vue'

function mountTextarea(formData = { bio: '' }, fieldData = { property: 'bio' }) {
  const form = reactive(formData)
  const field = reactive(fieldData)
  const wrapper = mount(TextareaPlugin, {
    props: { form, field },
    global: { plugins: [ElementPlus] }
  })
  return { wrapper, form, field }
}

describe('form/textarea.vue', () => {
  it('renders as a textarea element', () => {
    const { wrapper } = mountTextarea({ bio: 'hi' }, { property: 'bio' })
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.findComponent(ElInput).props('type')).toBe('textarea')
  })

  it('renders the initial form value', () => {
    const { wrapper } = mountTextarea({ bio: 'line1\nline2' }, { property: 'bio' })
    expect(wrapper.find('textarea').element.value).toBe('line1\nline2')
  })

  it('updates form[field.property] on user input (v-model)', async() => {
    const { wrapper, form } = mountTextarea({ bio: '' }, { property: 'bio' })
    await wrapper.find('textarea').setValue('new bio')
    expect(form.bio).toBe('new bio')
  })

  it('reflects external form mutations in the textarea', async() => {
    const { wrapper, form } = mountTextarea({ bio: 'a' }, { property: 'bio' })
    form.bio = 'external'
    await nextTick()
    expect(wrapper.find('textarea').element.value).toBe('external')
  })

  it('defaults autosize to { minRows: 2 }', () => {
    const { wrapper } = mountTextarea({ bio: '' }, { property: 'bio' })
    expect(wrapper.findComponent(ElInput).props('autosize')).toEqual({ minRows: 2 })
  })

  it('allows type_options to override autosize and set placeholder/rows', () => {
    const { wrapper } = mountTextarea(
      { bio: '' },
      { property: 'bio', type_options: { autosize: { minRows: 4, maxRows: 8 }, placeholder: 'Tell us more' } }
    )
    const input = wrapper.findComponent(ElInput)
    expect(input.props('autosize')).toEqual({ minRows: 4, maxRows: 8 })
    expect(input.props('placeholder')).toBe('Tell us more')
  })

  it('forwards type_events to el-input', async() => {
    const onBlur = vi.fn()
    const onChange = vi.fn()
    const { wrapper } = mountTextarea(
      { bio: '' },
      { property: 'bio', type_events: { blur: onBlur, change: onChange } }
    )
    const input = wrapper.findComponent(ElInput)
    input.vm.$emit('blur', new FocusEvent('blur'))
    input.vm.$emit('change', 'v')
    await nextTick()
    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('v')
  })

  it('mounts without type_options / type_events', () => {
    const { wrapper } = mountTextarea({ bio: 'plain' }, { property: 'bio' })
    expect(wrapper.find('textarea').element.value).toBe('plain')
  })
})
