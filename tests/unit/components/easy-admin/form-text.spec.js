import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'

// NOTE: text.vue imports '@/components/Tinymce' (directory import without
// extension). Vite's default resolve.extensions (used by vitest.config.ts)
// does not include `.vue`, so the specifier is unresolvable here. A virtual
// mock intercepts it without requiring filesystem resolution, and doubles as
// the heavy-editor stub: no CDN / network / upload in unit tests.
vi.mock('@/components/Tinymce', () => ({
  default: {
    name: 'Tinymce',
    props: {
      modelValue: { type: String, default: '' },
      height: { type: [Number, String], default: 300 },
      width: { type: [Number, String], default: 'auto' }
    },
    emits: ['update:modelValue', 'blur', 'change'],
    template: '<div class="tinymce-stub" />'
  }
}), { virtual: true })

import TextPlugin from '@/components/EasyAdmin/plugins/form/text.vue'

function editor(wrapper) {
  return wrapper.findComponent({ name: 'Tinymce' })
}

function mountText(formData = { content: '' }, fieldData = { property: 'content' }) {
  const form = reactive(formData)
  const field = reactive(fieldData)
  const wrapper = mount(TextPlugin, { props: { form, field } })
  return { wrapper, form, field }
}

describe('form/text.vue', () => {
  it('passes form value to Tinymce as model-value', () => {
    const { wrapper } = mountText({ content: '<p>hi</p>' }, { property: 'content' })
    expect(editor(wrapper).props('modelValue')).toBe('<p>hi</p>')
  })

  it('writes editor updates back to form[field.property]', async() => {
    const { wrapper, form } = mountText({ content: '' }, { property: 'content' })
    await editor(wrapper).vm.$emit('update:modelValue', '<p>new</p>')
    expect(form.content).toBe('<p>new</p>')
  })

  it('defaults height to 300 and width to 100%', () => {
    const { wrapper } = mountText({ content: '' }, { property: 'content' })
    expect(editor(wrapper).props('height')).toBe(300)
    expect(editor(wrapper).props('width')).toBe('100%')
  })

  it('passes type_options through to Tinymce via attrs', () => {
    const { wrapper } = mountText(
      { content: '' },
      { property: 'content', type_options: { menubar: 'file edit', toolbar: ['bold'] } }
    )
    const attrs = editor(wrapper).vm.$attrs
    expect(attrs.menubar).toBe('file edit')
    expect(attrs.toolbar).toEqual(['bold'])
  })

  it('forwards type_events to Tinymce', async() => {
    const onBlur = vi.fn()
    const { wrapper } = mountText(
      { content: '' },
      { property: 'content', type_events: { blur: onBlur } }
    )
    await editor(wrapper).vm.$emit('blur', 'evt')
    expect(onBlur).toHaveBeenCalledWith('evt')
  })

  it('handles empty / undefined initial value', () => {
    const { wrapper, form } = mountText({}, { property: 'content' })
    // undefined model-value falls back to the String default ''
    expect(editor(wrapper).props('modelValue')).toBe('')
    expect(form.content).toBeUndefined()
  })

  it('reflects external form mutations in the editor', async() => {
    const { wrapper, form } = mountText({ content: 'a' }, { property: 'content' })
    form.content = '<p>external</p>'
    await nextTick()
    expect(editor(wrapper).props('modelValue')).toBe('<p>external</p>')
  })
})
