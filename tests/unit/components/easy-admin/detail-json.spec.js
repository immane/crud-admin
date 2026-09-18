import { mount } from '@vue/test-utils'
import ElementPlus, { ElButton } from 'element-plus'
import DetailJson from '@/easyadmin/ui/vue/plugins/detail/json.vue'

function mountCell(value) {
  return mount(DetailJson, {
    props: { value, field: {}, scope: {}, em: {}, struct: {}},
    global: { plugins: [ElementPlus], mocks: { $t: (key) => key }}
  })
}

function bigObject(n = 20) {
  const obj = {}
  for (let i = 0; i < n; i++) obj[`key${i}`] = i
  return obj
}

describe('detail/json.vue', () => {
  it('renders a dash placeholder for empty values', () => {
    for (const value of [null, undefined, '']) {
      const wrapper = mountCell(value)
      expect(wrapper.vm.parsed).toBeNull()
      expect(wrapper.find('.detail-json__empty').exists()).toBe(true)
      expect(wrapper.find('.detail-json__empty').text()).toBe('-')
      expect(wrapper.find('.detail-json__code').exists()).toBe(false)
    }
  })

  it('renders objects with type and size labels', () => {
    const wrapper = mountCell({ a: 1, b: 2 })
    expect(wrapper.vm.typeLabel).toBe('Object')
    expect(wrapper.vm.sizeLabel).toBe('2 keys')
    expect(wrapper.find('.detail-json__type').text()).toBe('Object')
    expect(wrapper.find('.detail-json__size').text()).toBe('2 keys')
    expect(wrapper.find('.detail-json__code').text()).toContain('"a"')
  })

  it('renders arrays with item counts', () => {
    const wrapper = mountCell([1, 2, 3])
    expect(wrapper.vm.typeLabel).toBe('Array')
    expect(wrapper.vm.sizeLabel).toBe('3 items')
    expect(wrapper.find('.detail-json__code').text()).toContain('1')
  })

  it('parses JSON strings', () => {
    const wrapper = mountCell('{"x":1}')
    expect(wrapper.vm.parsed).toEqual({ x: 1 })
    expect(wrapper.vm.typeLabel).toBe('Object')
    expect(wrapper.find('.detail-json__code').text()).toContain('"x"')
  })

  it('keeps invalid JSON strings as raw text', () => {
    const wrapper = mountCell('hello')
    expect(wrapper.vm.parsed).toBe('hello')
    expect(wrapper.vm.typeLabel).toBe('string')
    expect(wrapper.find('.detail-json__code').text()).toContain('hello')
  })

  it('labels scalar values with their typeof and no size', () => {
    expect(mountCell(42).vm.typeLabel).toBe('number')
    expect(mountCell(42).vm.sizeLabel).toBe('')
    expect(mountCell(true).vm.typeLabel).toBe('boolean')
    expect(mountCell('hello').vm.sizeLabel).toBe('')
  })

  it('shows no toggle for short payloads', () => {
    const wrapper = mountCell({ a: 1 })
    expect(wrapper.vm.lines.length).toBeLessThanOrEqual(wrapper.vm.collapseLimit)
    expect(wrapper.findComponent(ElButton).exists()).toBe(false)
    expect(wrapper.vm.visibleLines).toEqual(wrapper.vm.lines)
  })

  it('collapses long payloads to 12 lines with an expand toggle', async() => {
    const wrapper = mountCell(bigObject(20))
    expect(wrapper.vm.lines.length).toBeGreaterThan(12)
    expect(wrapper.vm.visibleLines).toHaveLength(12)
    const toggle = wrapper.find('.detail-json__toggle')
    expect(toggle.exists()).toBe(true)
    expect(toggle.text()).toContain(`Expand all (${wrapper.vm.lines.length} lines)`)
  })

  it('expands and collapses on toggle click', async() => {
    const wrapper = mountCell(bigObject(20))
    const total = wrapper.vm.lines.length
    await wrapper.find('.detail-json__toggle').trigger('click')
    expect(wrapper.vm.expanded).toBe(true)
    expect(wrapper.vm.visibleLines).toHaveLength(total)
    expect(wrapper.find('.detail-json__toggle').text()).toBe('Collapse')
    await wrapper.find('.detail-json__toggle').trigger('click')
    expect(wrapper.vm.expanded).toBe(false)
    expect(wrapper.vm.visibleLines).toHaveLength(12)
  })

  it('assigns syntax classes per line kind', () => {
    const wrapper = mountCell({ a: 1 })
    expect(wrapper.vm.syntaxClass('"a": 1')).toBe('k')
    expect(wrapper.vm.syntaxClass('"flag": true')).toBe('k') // key rule wins first
    expect(wrapper.vm.syntaxClass('  true,')).toBe('b')
    expect(wrapper.vm.syntaxClass('  null,')).toBe('b')
    expect(wrapper.vm.syntaxClass('{')).toBe('')
    // rendered code lines carry the classes
    const keySpans = wrapper.findAll('.detail-json__code .k')
    expect(keySpans.length).toBeGreaterThan(0)
  })

  it('covers the numeric-with-colon and kv syntax branches', () => {
    const wrapper = mountCell({ a: 1 })
    expect(wrapper.vm.syntaxClass('count: 42')).toBe('n')
    expect(wrapper.vm.syntaxClass('data: [1]')).toBe('kv')
  })
})
