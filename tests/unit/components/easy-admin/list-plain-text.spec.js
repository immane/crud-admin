import { mount } from '@vue/test-utils'
import PlainText from '@/components/EasyAdmin/plugins/list/plain-text.vue'

function mountCell(value) {
  return mount(PlainText, {
    props: { value, field: {}, scope: {}, em: {}, struct: {} },
    global: { mocks: { $t: (key) => key } }
  })
}

describe('list/plain-text.vue', () => {
  it('renders plain strings unchanged', () => {
    expect(mountCell('hello world').text()).toBe('hello world')
  })

  it('renders empty string for nullish values', () => {
    for (const value of [null, undefined]) {
      const wrapper = mountCell(value)
      expect(wrapper.text()).toBe('')
      expect(wrapper.vm.displayValue).toBe('')
    }
  })

  it('strips html tags', () => {
    expect(mountCell('<b>bold</b>').text()).toBe('bold')
    expect(mountCell('<p>hello</p><p>world</p>').text()).toBe('helloworld')
    expect(mountCell('<a href="https://example.com">link</a>').text()).toBe('link')
  })

  it('strips nested and self-closing tags', () => {
    expect(mountCell('<div><span>deep</span></div>').text()).toBe('deep')
    expect(mountCell('a<br/>b').text()).toBe('ab')
  })

  it('coerces numbers to strings', () => {
    expect(mountCell(123).text()).toBe('123')
    expect(mountCell(0).text()).toBe('0')
  })

  it('returns raw string for tag-like text without closing bracket', () => {
    // /<[^>]*>/g requires a closing ">"; without it nothing is stripped
    expect(mountCell('a < b').text()).toBe('a < b')
  })
})
