import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DetailAdmin from '@/easyadmin/ui/vue/DetailAdmin.vue'
import AdminSkeleton from '@/components/AdminSkeleton.vue'

vi.mock('@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter', () => {
  const MockEntityManage = vi.fn(function(conf) {
    this.entityConf = conf
    this.name = typeof conf === 'string' ? conf : (conf && conf.name) || 'TestEntity'
    this.structure = vi.fn().mockResolvedValue({})
    this.retrieve = vi.fn().mockResolvedValue({ data: {}})
  })
  return { __esModule: true, default: MockEntityManage }
})

vi.mock('@/configs/entities', () => ({ __esModule: true, default: {}}))

function mountDetail(props = {}) {
  return mount(DetailAdmin, {
    props: { id: 1, entityConf: 'User', fields: ['name'], ...props },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key }
    }
  })
}

describe('DetailAdmin.vue skeleton loading', () => {
  it('shows the skeleton on first paint and content after load', async() => {
    const wrapper = mountDetail()
    expect(wrapper.vm.showSkeleton).toBe(true)
    expect(wrapper.findComponent(AdminSkeleton).exists()).toBe(true)
    expect(wrapper.find('.detail-admin__grid').exists()).toBe(false)
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.loaded).toBe(true)
    expect(wrapper.vm.showSkeleton).toBe(false)
    expect(wrapper.findComponent(AdminSkeleton).exists()).toBe(false)
    expect(wrapper.find('.detail-admin__field').exists()).toBe(true)
    wrapper.unmount()
  })

  it('keeps stale content visible on refetch instead of masking', async() => {
    const wrapper = mountDetail()
    await flushPromises()
    await wrapper.vm.$nextTick()
    wrapper.vm.em.structure.mockImplementationOnce(() => new Promise(() => {}))
    wrapper.vm.em.retrieve.mockImplementationOnce(() => new Promise(() => {}))
    wrapper.vm.fetchData()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.loading).toBe(true)
    expect(wrapper.vm.showSkeleton).toBe(false)
    expect(wrapper.find('.detail-admin__grid').exists()).toBe(true)
    expect(wrapper.findComponent(AdminSkeleton).exists()).toBe(false)
    wrapper.unmount()
    await flushPromises()
  })

  it('derives skeleton rows from properties with a fallback', async() => {
    const wrapper = mountDetail()
    expect(wrapper.vm.skeletonRows).toBe(1)
    await flushPromises()
    wrapper.unmount()
    const empty = mountDetail({ fields: '__all__' })
    expect(empty.vm.skeletonRows).toBe(6)
    await flushPromises()
    empty.unmount()
  })
})
