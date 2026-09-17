import { mount } from '@vue/test-utils'
import ElementPlus, { ElTag, ElTooltip } from 'element-plus'
import ArrayCell from '@/easyadmin/ui/vue/plugins/list/array.vue'

function mountCell(value) {
  return mount(ArrayCell, {
    props: { value, field: {}, scope: {}, em: {}, struct: {} },
    global: { plugins: [ElementPlus], mocks: { $t: (key) => key } }
  })
}

describe('list/array.vue', () => {
  it('renders one tag per item', () => {
    const wrapper = mountCell(['a', 'b', 'c'])
    const tags = wrapper.findAllComponents(ElTag)
    expect(tags).toHaveLength(3)
    expect(tags.map((t) => t.text())).toEqual(['a', 'b', 'c'])
  })

  it('renders nothing for empty arrays', () => {
    const wrapper = mountCell([])
    expect(wrapper.findAllComponents(ElTag)).toHaveLength(0)
    expect(wrapper.findComponent(ElTooltip).exists()).toBe(false)
  })

  it('renders nothing for non-array values', () => {
    for (const value of [null, undefined, 'nope', 42]) {
      const wrapper = mountCell(value)
      expect(wrapper.findAllComponents(ElTag)).toHaveLength(0)
      expect(wrapper.vm.visibleItems).toEqual([])
      expect(wrapper.vm.overflowCount).toBe(0)
    }
  })

  it('prefers __toString over the raw item', () => {
    const wrapper = mountCell([{ __toString: 'Nice', name: 'raw' }, 'plain'])
    const tags = wrapper.findAllComponents(ElTag)
    expect(tags[0].text()).toBe('Nice')
    expect(tags[1].text()).toBe('plain')
  })

  it('renders numbers', () => {
    const wrapper = mountCell([1, 2])
    expect(wrapper.findAllComponents(ElTag).map((t) => t.text())).toEqual(['1', '2'])
  })

  it('shows exactly five tags without overflow for five items', () => {
    const wrapper = mountCell(['a', 'b', 'c', 'd', 'e'])
    expect(wrapper.vm.visibleItems).toHaveLength(5)
    expect(wrapper.vm.overflowCount).toBe(0)
    expect(wrapper.findComponent(ElTooltip).exists()).toBe(false)
    expect(wrapper.findAllComponents(ElTag)).toHaveLength(5)
    expect(wrapper.text()).not.toContain('...')
  })

  it('truncates to five tags plus a tooltip trigger for six or more items', () => {
    const wrapper = mountCell(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    expect(wrapper.vm.visibleItems).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(wrapper.vm.overflowCount).toBe(2)
    // 5 visible tags + 1 "..." trigger tag (tooltip content is teleported)
    expect(wrapper.findAllComponents(ElTag)).toHaveLength(6)
    expect(wrapper.findComponent(ElTooltip).exists()).toBe(true)
    expect(wrapper.text()).toContain('...')
  })

  it('computes overflow count beyond the limit', () => {
    expect(mountCell([1, 2, 3, 4, 5, 6]).vm.overflowCount).toBe(1)
    expect(mountCell([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).vm.overflowCount).toBe(6)
  })
})
