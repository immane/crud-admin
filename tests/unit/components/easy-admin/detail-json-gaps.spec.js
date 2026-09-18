import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DetailJson from '@/easyadmin/ui/vue/plugins/detail/json.vue'

function mountCell(value) {
  return mount(DetailJson, {
    props: { value, field: {}, scope: {}, em: {}, struct: {}},
    global: { plugins: [ElementPlus], mocks: { $t: (key) => key }}
  })
}

describe('detail/json.vue gaps', () => {
  it('falls back to String(parsed) when JSON.stringify throws (circular)', () => {
    const circular = { a: 1 }
    circular.self = circular
    const wrapper = mountCell(circular)
    // parsed returns a reactive copy; formatted catch path (lines 52-53)
    expect(wrapper.vm.parsed).toMatchObject({ a: 1 })
    expect(wrapper.vm.formatted).toBe('[object Object]')
    expect(wrapper.vm.lines).toEqual(['[object Object]'])
    expect(wrapper.vm.visibleLines).toEqual(['[object Object]'])
    expect(wrapper.find('.detail-json__code').text()).toContain('[object Object]')
    expect(wrapper.vm.typeLabel).toBe('Object')
  })

  it('falls back for BigInt payloads that JSON.stringify rejects', () => {
    const wrapper = mountCell({ v: 1n })
    expect(wrapper.vm.formatted).toBe(String(wrapper.vm.parsed))
    expect(wrapper.vm.typeLabel).toBe('Object')
  })
})
