import { mount } from '@vue/test-utils'
import AdminSkeleton from '@/components/AdminSkeleton.vue'

describe('AdminSkeleton.vue', () => {
  it('renders 4 label/value rows in one column by default', () => {
    const wrapper = mount(AdminSkeleton)
    expect(wrapper.classes()).toContain('admin-skeleton--cols-1')
    expect(wrapper.findAll('.admin-skeleton__field')).toHaveLength(4)
    expect(wrapper.findAll('.admin-skeleton__line--label')).toHaveLength(4)
    expect(wrapper.findAll('.admin-skeleton__line--value')).toHaveLength(4)
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })

  it('renders custom rows and columns', () => {
    const wrapper = mount(AdminSkeleton, { props: { rows: 6, cols: 2 }})
    expect(wrapper.classes()).toContain('admin-skeleton--cols-2')
    expect(wrapper.findAll('.admin-skeleton__field')).toHaveLength(6)
  })

  it('accepts string columns', () => {
    const wrapper = mount(AdminSkeleton, { props: { rows: 2, cols: '4' }})
    expect(wrapper.classes()).toContain('admin-skeleton--cols-4')
    expect(wrapper.findAll('.admin-skeleton__field')).toHaveLength(2)
  })
})
