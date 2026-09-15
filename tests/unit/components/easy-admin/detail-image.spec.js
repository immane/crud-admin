import { mount } from '@vue/test-utils'
import ElementPlus, { ElImage } from 'element-plus'
import DetailImage from '@/components/EasyAdmin/plugins/detail/image.vue'
import SIP from '@/utils/simple-image-process'

function mountCell(value) {
  return mount(DetailImage, {
    props: { value, field: {}, scope: {}, em: {}, struct: {} },
    global: { plugins: [ElementPlus], mocks: { $t: (key) => key } }
  })
}

describe('detail/image.vue', () => {
  it('resolves the image url through SIP.getPicture', () => {
    const wrapper = mountCell('https://example.com/full.png')
    expect(wrapper.vm.imageUrl).toBe(SIP.getPicture('https://example.com/full.png'))
    expect(wrapper.findComponent(ElImage).props('src')).toBe('https://example.com/full.png')
  })

  it('passes absolute urls through untouched', () => {
    expect(mountCell('https://cdn.example.com/x.jpg').vm.imageUrl).toBe('https://cdn.example.com/x.jpg')
  })

  it('prefixes relative file names with the uploads path', () => {
    const wrapper = mountCell('photo.png')
    expect(wrapper.vm.imageUrl).toContain('/uploads/images/photo.png')
  })

  it('handles null values without throwing', () => {
    const wrapper = mountCell(null)
    expect(wrapper.vm.imageUrl).toBe(SIP.getPicture(null))
    expect(wrapper.findComponent(ElImage).exists()).toBe(true)
  })

  it('wires preview-src-list and z-index for the preview', () => {
    const wrapper = mountCell('https://example.com/full.png')
    const image = wrapper.findComponent(ElImage)
    expect(image.props('previewSrcList')).toEqual(['https://example.com/full.png'])
    expect(image.props('zIndex')).toBe(3000)
  })

  it('renders full-size styling on the image', () => {
    const wrapper = mountCell('https://example.com/full.png')
    const style = wrapper.findComponent(ElImage).attributes('style') || ''
    expect(wrapper.html()).toContain('width: 100%')
    expect(style).toContain('100%')
  })
})
