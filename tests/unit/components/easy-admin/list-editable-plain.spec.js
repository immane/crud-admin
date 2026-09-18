import { mount } from '@vue/test-utils'
import ElementPlus, { ElInput } from 'element-plus'
import EditablePlain from '@/easyadmin/ui/vue/plugins/list/editable-plain.vue'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function mountCell({ row = { id: 1, name: 'alpha' }, property = 'name', update = () => Promise.resolve() } = {}) {
  const em = { update: vi.fn(update) }
  const success = vi.fn()
  const error = vi.fn()
  const wrapper = mount(EditablePlain, {
    props: { em, scope: { row }, field: { property }},
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key, $message: { success, error }}
    }
  })
  return { wrapper, em, success, error, row }
}

describe('list/editable-plain.vue', () => {
  it('renders the row value with an edit hint title', () => {
    const { wrapper } = mountCell()
    expect(wrapper.text()).toContain('alpha')
    expect(wrapper.find('div[title="Double-click to edit"]').exists()).toBe(true)
    expect(wrapper.findComponent(ElInput).exists()).toBe(false)
  })

  it('renders empty content for missing property', () => {
    const { wrapper } = mountCell({ row: { id: 9 }})
    expect(wrapper.findComponent(ElInput).exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })

  it('double-click enters edit mode with the current value', async() => {
    const { wrapper } = mountCell()
    await wrapper.trigger('dblclick')
    const input = wrapper.findComponent(ElInput)
    expect(input.exists()).toBe(true)
    expect(input.props('modelValue')).toBe('alpha')
    expect(wrapper.vm.editing.editable).toBe('1-name')
  })

  it('blur cancels editing without persisting', async() => {
    const { wrapper, em } = mountCell()
    await wrapper.trigger('dblclick')
    await wrapper.findComponent(ElInput).setValue('changed')
    await wrapper.find('input').trigger('blur')
    expect(em.update).not.toHaveBeenCalled()
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ElInput).exists()).toBe(false)
    expect(wrapper.text()).toContain('alpha')
  })

  it('escape cancels editing without persisting', async() => {
    const { wrapper, em } = mountCell()
    await wrapper.trigger('dblclick')
    await wrapper.findComponent(ElInput).setValue('changed')
    await wrapper.find('input').trigger('keyup', { key: 'Escape' })
    expect(em.update).not.toHaveBeenCalled()
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ElInput).exists()).toBe(false)
  })

  it('enter persists the edit, updates the row and exits edit mode', async() => {
    const { wrapper, em, success, row } = mountCell()
    await wrapper.trigger('dblclick')
    await wrapper.findComponent(ElInput).setValue('beta')
    await wrapper.find('input').trigger('keyup', { key: 'Enter' })
    expect(em.update).toHaveBeenCalledWith(1, { name: 'beta' })
    await flush()
    await wrapper.vm.$nextTick()
    expect(success).toHaveBeenCalledWith('Property updated successfully')
    expect(row.name).toBe('beta')
    expect(wrapper.findComponent(ElInput).exists()).toBe(false)
    expect(wrapper.text()).toContain('beta')
  })

  it('failed update shows an error and stays in edit mode', async() => {
    const { wrapper, em, error } = mountCell({ update: () => Promise.reject(new Error('nope')) })
    await wrapper.trigger('dblclick')
    await wrapper.findComponent(ElInput).setValue('beta')
    await wrapper.find('input').trigger('keyup', { key: 'Enter' })
    expect(em.update).toHaveBeenCalledWith(1, { name: 'beta' })
    await flush()
    await wrapper.vm.$nextTick()
    expect(error).toHaveBeenCalledWith('Failed to update property')
    expect(wrapper.findComponent(ElInput).exists()).toBe(true)
  })

  it('saveEdit uses the editing key of the current row and property', async() => {
    const { wrapper, em } = mountCell({ row: { id: 42, title: 't' }, property: 'title' })
    wrapper.vm.startEdit()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.editing.editable).toBe('42-title')
    expect(wrapper.vm.editing.value).toBe('t')
    wrapper.vm.editing.value = 't2'
    wrapper.vm.saveEdit()
    expect(em.update).toHaveBeenCalledWith(42, { title: 't2' })
  })
})
