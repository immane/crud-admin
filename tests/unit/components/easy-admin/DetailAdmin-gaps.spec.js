import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DetailAdmin from '@/easyadmin/ui/vue/DetailAdmin.vue'

vi.mock('@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter', () => {
  const MockEntityManage = vi.fn(function (conf) {
    this.entityConf = conf
    this.name = typeof conf === 'string' ? conf : (conf && conf.name) || 'TestEntity'
    this.prefix = '/api'
    this.plural = 'tests'
    this.structure = vi.fn().mockResolvedValue({})
    this.retrieve = vi.fn().mockResolvedValue({ data: {} })
    this.list = vi.fn().mockResolvedValue({ data: [], paginator: { totalCount: 0 } })
    this.delete = vi.fn().mockResolvedValue({})
  })
  return { __esModule: true, default: MockEntityManage }
})

vi.mock('@/configs/entities', () => ({ __esModule: true, default: {} }))

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function baseMocks(overrides = {}) {
  const message = vi.fn()
  message.error = vi.fn()
  return {
    $t: (key) => key,
    $route: { query: {}, path: '/', meta: {}, fullPath: '/' },
    $router: { push: vi.fn(), go: vi.fn(), replace: vi.fn() },
    $message: message,
    $loading: vi.fn(() => ({ close: vi.fn() })),
    ...overrides
  }
}

function mountDetail(props = {}, mockOverrides = {}) {
  const mocks = baseMocks(mockOverrides)
  const wrapper = mount(DetailAdmin, {
    props: {
      id: 1,
      entityConf: 'User',
      fields: ['name'],
      title: 'User detail',
      ...props
    },
    global: {
      plugins: [ElementPlus],
      mocks
    }
  })
  return { wrapper, mocks }
}

describe('DetailAdmin.vue gaps', () => {
  describe('created component-field branch (line 88)', () => {
    it('marks custom component fields raw via markRaw/toRaw', async () => {
      const Custom = { name: 'CustomField', template: '<div class="custom-field">custom</div>' }
      const { wrapper } = mountDetail({ fields: [{ property: 'name', label: 'Name', component: Custom }] })
      expect(wrapper.vm.properties).toHaveLength(1)
      // markRaw wraps the definition: identity of the inner component is kept
      expect(wrapper.vm.properties[0].component).toBeTruthy()
      expect(wrapper.vm.properties[0].property).toBe('name')
      await flush()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.custom-field').exists()).toBe(true)
      expect(wrapper.text()).toContain('custom')
    })
  })

  describe('resolvePlugin async loader (lines 61-62)', () => {
    it('loads a detail plugin through the loader', async () => {
      const { wrapper } = mountDetail({ fields: [{ property: 'photo', type: 'image' }] })
      wrapper.vm.em.structure.mockResolvedValue({ photo: { translation: 'Photo' } })
      wrapper.vm.em.retrieve.mockResolvedValue({ data: { id: 1, photo: 'pic.png' } })
      wrapper.vm.fetchData()
      await flushPromises()
      // first dynamic import also pays the vite transform cost
      await sleep(800)
      await flushPromises()
      await wrapper.vm.$nextTick()
      // label renders from structure; the async detail plugin (el-image,
      // lazy in jsdom so no <img src>) resolves through the loader
      expect(wrapper.text()).toContain('Photo')
      expect(wrapper.html()).toContain('el-image')
    })

    it('loads a list fallback plugin through the loader', async () => {
      const { wrapper } = mountDetail({ fields: [{ property: 'active', type: 'boolean' }] })
      wrapper.vm.em.structure.mockResolvedValue({ active: { translation: 'Active' } })
      wrapper.vm.em.retrieve.mockResolvedValue({ data: { id: 1, active: true } })
      wrapper.vm.fetchData()
      await flushPromises()
      await sleep(800)
      await flushPromises()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Active')
    })

    it('caches resolved plugins', async () => {
      const { wrapper } = mountDetail()
      await flush()
      expect(wrapper.vm.loadPlugin('image')).toBe(wrapper.vm.loadPlugin('image'))
      expect(wrapper.vm.loadPlugin('boolean')).toBe(wrapper.vm.loadPlugin('boolean'))
    })
  })

  describe('getListPluginType struct fallback (line 117)', () => {
    it('falls back to struct metadata type when field has no type', () => {
      const { wrapper } = mountDetail()
      expect(wrapper.vm.getListPluginType({ property: 'active' }, { metadata: { type: 'boolean' } }, null)).toBe('boolean')
      expect(wrapper.vm.getListPluginType({ property: 'author' }, { metadata: { type: 'ManyToOne' } }, null)).toBe('RelationToOne')
      expect(wrapper.vm.getListPluginType({ property: 'tags' }, { metadata: { type: 'ManyToMany' } }, null)).toBe('RelationToMany')
    })

    it('prefers field.type over struct metadata', () => {
      const { wrapper } = mountDetail()
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'boolean' }, { metadata: { type: 'text' } }, null)).toBe('boolean')
    })

    it('handles missing struct via optional chain', async () => {
      const { wrapper } = mountDetail()
      await flush()
      expect(wrapper.vm.getListPluginType({ property: 'a' }, undefined, [1])).toBe('RelationToMany')
      expect(wrapper.vm.getListPluginType({ property: 'a' }, undefined, 1)).toBeNull()
      expect(wrapper.vm.getListPluginType({ property: 'a' }, null, 1)).toBeNull()
    })
  })
})
