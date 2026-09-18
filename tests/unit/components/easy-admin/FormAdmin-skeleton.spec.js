import { mount, flushPromises } from '@vue/test-utils'
import FormAdmin from '@/easyadmin/ui/vue/FormAdmin.vue'
import AdminSkeleton from '@/components/AdminSkeleton.vue'

vi.mock('@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter', () => {
  const MockEntityManage = vi.fn(function(conf) {
    this.entityConf = conf
    this.name = typeof conf === 'string' ? conf : (conf && conf.name) || 'TestEntity'
    this.structure = vi.fn().mockResolvedValue({
      name: { metadata: { type: 'text', nullable: false }, translation: 'Name' }
    })
    this.retrieve = vi.fn().mockResolvedValue({ data: { name: 'Ada' }})
    this.list = vi.fn().mockResolvedValue({ data: [], paginator: { totalCount: 0 }})
  })
  return { __esModule: true, default: MockEntityManage }
})

vi.mock('@/configs/entities', () => ({ __esModule: true, default: {}}))

vi.mock('@/components/Tinymce', () => ({
  default: { name: 'Tinymce', template: '<div class="tinymce-stub" />' }
}))

vi.mock('@/easyadmin/ui/vue/feedback', () => ({
  createUiFeedback: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), loading: vi.fn(() => ({ close: vi.fn() })) })
}))

function mountForm(props = {}) {
  return mount(FormAdmin, {
    props: { entityConf: { name: 'Product' }, fields: ['name'], ...props },
    global: {
      mocks: {
        $t: key => key,
        $route: { meta: { title: 'Product' }},
        $router: { go: vi.fn(), replace: vi.fn() },
        $message: { error: vi.fn() },
        $loading: vi.fn(() => ({ close: vi.fn() }))
      },
      directives: { loading: {}},
      stubs: {
        'el-row': { template: '<div><slot /></div>' },
        'el-col': { template: '<div><slot /></div>' },
        'el-tabs': { template: '<div><slot /></div>' },
        'el-tab-pane': { template: '<div><slot /></div>' },
        'el-form': { template: '<div><slot /></div>' },
        'el-form-item': { template: '<div><slot /></div>' },
        'el-button': { template: '<button><slot /></button>' }
      }
    }
  })
}

describe('FormAdmin.vue skeleton loading', () => {
  it('shows the skeleton on first paint and the form after load', async() => {
    const wrapper = mountForm()
    expect(wrapper.vm.showSkeleton).toBe(true)
    expect(wrapper.findComponent(AdminSkeleton).exists()).toBe(true)
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.loaded).toBe(true)
    expect(wrapper.vm.showSkeleton).toBe(false)
    expect(wrapper.findComponent(AdminSkeleton).exists()).toBe(false)
    wrapper.unmount()
  })

  it('falls back to 6 rows before properties resolve, then uses them', async() => {
    const wrapper = mountForm()
    expect(wrapper.vm.skeletonRows).toBe(6)
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.skeletonRows).toBe(1)
    wrapper.unmount()
  })
})
