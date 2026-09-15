import { mount } from '@vue/test-utils'
import ElementPlus, { ElSwitch, ElTag } from 'element-plus'
import BooleanCell from '@/components/EasyAdmin/plugins/list/boolean.vue'

const t = (key) => key

function mountCell(props = {}, mocks = {}) {
  return mount(BooleanCell, {
    props,
    global: {
      plugins: [ElementPlus],
      mocks: {
        $t: t,
        $message: { success: vi.fn(), error: vi.fn() },
        ...mocks
      }
    }
  })
}

describe('list/boolean.vue', () => {
  it('renders Yes tag for truthy value when not editable', () => {
    const wrapper = mountCell({ value: true, field: {}, scope: { row: {} }, em: {}, struct: {} })
    const tag = wrapper.findComponent(ElTag)
    expect(tag.exists()).toBe(true)
    expect(tag.props('type')).toBe('success')
    expect(tag.text()).toBe('Yes')
    expect(wrapper.findComponent(ElSwitch).exists()).toBe(false)
  })

  it('renders No tag for falsy values when not editable', () => {
    for (const value of [false, null, 0, '', undefined]) {
      const wrapper = mountCell({ value, field: {}, scope: { row: {} }, em: {}, struct: {} })
      const tag = wrapper.findComponent(ElTag)
      expect(tag.exists()).toBe(true)
      expect(tag.props('type')).toBe('danger')
      expect(tag.text()).toBe('No')
    }
  })

  it('renders truthy non-boolean values as Yes', () => {
    const wrapper = mountCell({ value: 1, field: {}, scope: { row: {} }, em: {}, struct: {} })
    expect(wrapper.findComponent(ElTag).text()).toBe('Yes')
  })

  it('renders a switch bound to scope.row[field.property] when editable', () => {
    const scope = { row: { id: 7, active: true } }
    const wrapper = mountCell(
      { value: true, field: { property: 'active', editable: true }, scope, em: {}, struct: {} }
    )
    const sw = wrapper.findComponent(ElSwitch)
    expect(sw.exists()).toBe(true)
    expect(sw.props('modelValue')).toBe(true)
    expect(wrapper.findComponent(ElTag).exists()).toBe(false)
  })

  it('switch reflects false row value', () => {
    const scope = { row: { id: 7, active: false } }
    const wrapper = mountCell(
      { value: false, field: { property: 'active', editable: true }, scope, em: {}, struct: {} }
    )
    expect(wrapper.findComponent(ElSwitch).props('modelValue')).toBe(false)
  })

  it('onChange persists via em.update and shows success message', async () => {
    const scope = { row: { id: 7, active: false } }
    const em = { update: vi.fn(() => Promise.resolve()) }
    const success = vi.fn()
    const wrapper = mountCell(
      { value: false, field: { property: 'active', editable: true }, scope, em, struct: {} },
      { $message: { success, error: vi.fn() } }
    )
    scope.row.active = true
    await wrapper.vm.$nextTick()
    wrapper.vm.onChange()
    await Promise.resolve()
    await wrapper.vm.$nextTick()
    expect(em.update).toHaveBeenCalledWith(7, { active: true })
    // flush the .then() chain
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(success).toHaveBeenCalledWith('Property updated successfully')
  })

  it('change event on the switch triggers persistence', async () => {
    const scope = { row: { id: 3, enabled: true } }
    const em = { update: vi.fn(() => Promise.resolve()) }
    const wrapper = mountCell(
      { value: true, field: { property: 'enabled', editable: true }, scope, em, struct: {} },
      { $message: { success: vi.fn(), error: vi.fn() } }
    )
    await wrapper.findComponent(ElSwitch).vm.$emit('change', false)
    expect(em.update).toHaveBeenCalledWith(3, { enabled: true })
  })
})
