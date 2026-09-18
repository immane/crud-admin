import { mount } from '@vue/test-utils'
import ElementPlus, { ElImage } from 'element-plus'
import ImageCell from '@/easyadmin/ui/vue/plugins/list/image.vue'
import SIP from '@/utils/simple-image-process'

function mountCell(value) {
  return mount(ImageCell, {
    props: { value, field: {}, scope: {}, em: {}, struct: {}},
    global: { plugins: [ElementPlus], mocks: { $t: (key) => key }}
  })
}

describe('list/image.vue', () => {
  it('resolves the image url through SIP.getPicture', () => {
    const wrapper = mountCell('https://example.com/a.png')
    expect(wrapper.vm.imageUrl).toBe(SIP.getPicture('https://example.com/a.png'))
    expect(wrapper.findComponent(ElImage).props('src')).toBe('https://example.com/a.png')
  })

  it('passes absolute urls through untouched', () => {
    const url = 'https://cdn.example.com/pic.jpg'
    const wrapper = mountCell(url)
    expect(wrapper.vm.imageUrl).toBe(url)
  })

  it('prefixes relative file names with the uploads path', () => {
    const wrapper = mountCell('avatar.png')
    expect(wrapper.vm.imageUrl).toContain('/uploads/images/avatar.png')
    expect(wrapper.findComponent(ElImage).props('src')).toContain('/uploads/images/avatar.png')
  })

  it('handles null values without throwing', () => {
    const wrapper = mountCell(null)
    expect(wrapper.vm.imageUrl).toBe(SIP.getPicture(null))
    expect(wrapper.findComponent(ElImage).exists()).toBe(true)
  })

  it('wires preview-src-list, z-index, fit and lazy props', () => {
    const wrapper = mountCell('https://example.com/a.png')
    const image = wrapper.findComponent(ElImage)
    expect(image.props('previewSrcList')).toEqual(['https://example.com/a.png'])
    expect(image.props('zIndex')).toBe(3000)
    expect(image.props('fit')).toBe('cover')
    // lazy is passed as the string "true" in the template
    expect(String(image.props('lazy'))).toBe('true')
  })

  it('applies the thumbnail image class', () => {
    const wrapper = mountCell('https://example.com/a.png')
    expect(wrapper.findComponent(ElImage).classes()).toContain('image')
  })
})
