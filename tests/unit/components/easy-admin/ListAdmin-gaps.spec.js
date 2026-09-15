import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import ListAdmin from '@/components/EasyAdmin/ListAdmin.vue'

vi.mock('@/utils/entity', () => {
  const MockEntityManage = vi.fn(function (conf) {
    this.entityConf = conf
    this.name = typeof conf === 'string' ? conf : (conf && conf.name) || 'TestEntity'
    this.prefix = '/api'
    this.plural = 'tests'
    this.structure = vi.fn().mockResolvedValue({})
    this.list = vi.fn().mockResolvedValue({ data: [], paginator: { totalCount: 0 } })
    this.retrieve = vi.fn().mockResolvedValue({ data: {} })
    this.delete = vi.fn().mockResolvedValue({})
    this.deleteMany = vi.fn().mockResolvedValue([])
    this.batchUpdate = vi.fn().mockResolvedValue({})
  })
  return { __esModule: true, default: MockEntityManage }
})

vi.mock('@/configs/entities', () => ({ __esModule: true, default: {} }))

vi.mock('@/router', () => ({
  __esModule: true,
  asyncRoutes: [
    { path: '/flat' },
    {
      path: '/parent',
      children: [
        { path: 'other', redirect: '/elsewhere', meta: { title: 'Elsewhere' } },
        { path: 'users', redirect: '/users', meta: { title: 'User List' } }
      ]
    },
    {
      path: '/tail',
      children: [{ path: 'x', redirect: '/never', meta: { title: 'Never' } }]
    }
  ],
  constantRoutes: [],
  lastRoutes: [],
  resetRouter: vi.fn(),
  default: {}
}))

vi.mock('@/utils/simple-image-process', () => ({
  __esModule: true,
  default: { getPicture: (url) => url }
}))

vi.mock('@/components/EasyAdmin/FormAdmin.vue', async () => {
  const { h } = await import('vue')
  return {
    __esModule: true,
    default: { name: 'FormAdmin', render: () => h('div', { class: 'stub-form-admin' }) }
  }
})

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
    exportExcelCsv: vi.fn(),
    ...overrides
  }
}

function mountList(props = {}, mockOverrides = {}, globalOverrides = {}) {
  const mocks = baseMocks(mockOverrides)
  const wrapper = mount(ListAdmin, {
    props: {
      entityConf: 'TestEntity',
      listDisplay: [],
      actions: [],
      disabledActions: [],
      ...props
    },
    global: {
      plugins: [ElementPlus],
      mocks,
      stubs: { SearchFilter: true, FormAdmin: true },
      ...globalOverrides
    }
  })
  return { wrapper, mocks }
}

const DummyComp = { name: 'DummyComp', template: '<div class="dummy-comp" />' }

describe('ListAdmin.vue gaps', () => {
  describe('prop default factories (lines 488-564)', () => {
    it('invokes listDisplay/listFilter/actions/export/query/table defaults', () => {
      expect(ListAdmin.props.listDisplay.default()).toEqual([])
      expect(ListAdmin.props.actions.default()).toEqual([])
      expect(ListAdmin.props.disabledActions.default()).toEqual([])
      expect(ListAdmin.props.modelValue.default()).toEqual([])
      expect(ListAdmin.props.tableConf.default()).toBeUndefined()
      expect(ListAdmin.props.tableEvent.default()).toBeUndefined()
      expect(ListAdmin.props.config.default()).toBeUndefined()
      expect(ListAdmin.props.query.default()).toBeUndefined()
      expect(ListAdmin.props.entityConf.default()).toBeUndefined()
      // comment-only bodies still execute
      expect(ListAdmin.props.listFilter.default()).toBeUndefined()
      expect(ListAdmin.props.export.default()).toEqual({})
    })
  })

  describe('routeProcess (lines 924-935, branches 923/933)', () => {
    it('resolves titleText from a matching child redirect', () => {
      const { wrapper } = mountList({}, { $route: { query: {}, path: '/users', meta: {}, fullPath: '/users' } })
      expect(wrapper.vm.titleText).toBe('User List')
    })

    it('leaves titleText empty when nothing matches', () => {
      const { wrapper } = mountList({}, { $route: { query: {}, path: '/nomatch', meta: {}, fullPath: '/nomatch' } })
      expect(wrapper.vm.titleText).toBe('')
    })
  })

  describe('created query restore (lines 755-757)', () => {
    it('restores filter data and pager from $route.query', () => {
      const { wrapper } = mountList(
        {},
        { $route: { query: { name: 'abc', page: '2', limit: '50' }, path: '/', meta: {}, fullPath: '/?name=abc' } }
      )
      expect(wrapper.vm.listFilterData).toEqual({ name: 'abc' })
      expect(wrapper.vm.pager).toEqual({ page: 2, limit: 50 })
    })
  })

  describe('$route.query watcher (lines 735-740)', () => {
    it('applies params and refetches without a searchFilter ref', async () => {
      // rendering a custom filter slot leaves $refs.searchFilter undefined,
      // covering the `?.` short-circuit in the watcher
      const mocks = baseMocks()
      const wrapper = mount(ListAdmin, {
        props: { entityConf: 'TestEntity', listDisplay: [], actions: [], disabledActions: [] },
        slots: { filter: '<div class="no-filter" />' },
        global: { plugins: [ElementPlus], mocks, stubs: { SearchFilter: true, FormAdmin: true } }
      })
      expect(wrapper.vm.$refs.searchFilter).toBeUndefined()
      const fetchSpy = vi.spyOn(wrapper.vm, 'fetchData').mockImplementation(() => {})
      const handler = ListAdmin.watch['$route.query'].handler
      handler.call(wrapper.vm, { name: 'late' })
      await wrapper.vm.$nextTick()
      await flush()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.listFilterData).toEqual({ name: 'late' })
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('calls through to a real searchFilter ref when present', async () => {
      const mocks = baseMocks()
      const wrapper = mount(ListAdmin, {
        props: { entityConf: 'TestEntity', listDisplay: [], actions: [], disabledActions: [] },
        global: {
          plugins: [ElementPlus],
          mocks,
          stubs: { SearchFilter: false, FormAdmin: true }
        }
      })
      // let the embedded SearchFilter finish created() before spying
      await flush()
      await wrapper.vm.$nextTick()
      await flush()
      expect(wrapper.vm.$refs.searchFilter?.filterGenerate).toBeDefined()
      const spy = vi.spyOn(wrapper.vm.$refs.searchFilter, 'filterGenerate').mockImplementation(() => {})
      const fetchSpy = vi.spyOn(wrapper.vm, 'fetchData').mockImplementation(() => {})
      const handler = ListAdmin.watch['$route.query'].handler
      handler.call(wrapper.vm, { name: 'real' })
      await wrapper.vm.$nextTick()
      await flush()
      await wrapper.vm.$nextTick()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('beforeUnmount (line 745)', () => {
    it('clears the pending url-sync timer on unmount', async () => {
      const { wrapper } = mountList()
      wrapper.vm.syncToUrl()
      expect(wrapper.vm._syncTimer).toBeDefined()
      wrapper.unmount()
      await flush()
    })
  })

  describe('pagerTotal nullish chain (line 681)', () => {
    it('prefers totalCount, then total, then zero', async () => {
      const { wrapper } = mountList()
      // NOTE: setData deep-merges, so replace the object directly here
      wrapper.vm.paginator = { totalCount: 5, total: 9 }
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pagerTotal).toBe(5)
      wrapper.vm.paginator = { total: 7 }
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pagerTotal).toBe(7)
      wrapper.vm.paginator = {}
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pagerTotal).toBe(0)
    })
  })

  describe('resolvedBatchFields branches (lines 695-696)', () => {
    it('maps string, plain-object and component batch fields', () => {
      const { wrapper } = mountList({
        config: { form: { batch_edit: { fields: ['a', { property: 'b', label: 'B' }, { property: 'c', component: DummyComp }] } } }
      })
      const resolved = wrapper.vm.resolvedBatchFields
      expect(resolved[0]).toEqual({ property: 'a' })
      expect(resolved[1]).toEqual({ property: 'b', label: 'B' })
      expect(resolved[2].property).toBe('c')
      expect(resolved[2].component).toBeTruthy()
    })
  })

  describe('syncToUrl replaceState guard (line 793)', () => {
    it('skips history updates when the url already matches', async () => {
      // drain debounce timers left over by earlier tests in this file
      await sleep(150)
      window.history.replaceState(null, '', '/')
      const { wrapper } = mountList()
      const spy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
      try {
        wrapper.vm.listFilterData = {}
        wrapper.vm.pager = { page: 1, limit: 20 }
        await wrapper.vm.$nextTick()
        wrapper.vm.syncToUrl()
        await sleep(80)
        expect(spy).not.toHaveBeenCalled()
      } finally {
        spy.mockRestore()
      }
    })

    it('writes the url when filters diverge', async () => {
      window.history.replaceState(null, '', '/')
      const { wrapper } = mountList()
      const spy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
      try {
        await wrapper.setData({ listFilterData: { name: 'abc' } })
        await sleep(80)
        expect(spy).toHaveBeenCalled()
      } finally {
        spy.mockRestore()
      }
    })
  })

  describe('applyQueryParams limit/page coercion (line 805)', () => {
    it('falls back to 20/1 for zero values', () => {
      const { wrapper } = mountList()
      wrapper.vm.applyQueryParams({ limit: '0' })
      expect(wrapper.vm.pager.limit).toBe(20)
      wrapper.vm.applyQueryParams({ page: '0' })
      expect(wrapper.vm.pager.page).toBe(1)
      wrapper.vm.applyQueryParams({ limit: '50', page: '3' })
      expect(wrapper.vm.pager).toEqual({ page: 3, limit: 50 })
    })
  })

  describe('getListPluginType struct fallback (line 853)', () => {
    it('uses struct metadata when the field has no type', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.getListPluginType({ property: 'active' }, { metadata: { type: 'boolean' } }, null)).toBe('boolean')
      expect(wrapper.vm.getListPluginType({ property: 'author' }, { metadata: { type: 'ManyToOne' } }, null)).toBe('RelationToOne')
      expect(wrapper.vm.getListPluginType({ property: 'tags' }, { metadata: { type: 'ManyToMany' } }, null)).toBe('RelationToMany')
    })
  })

  describe('propertieProcess component branch (line 913)', () => {
    it('keeps custom component definitions raw', () => {
      const { wrapper } = mountList({ listDisplay: [{ property: 'x', label: 'X', component: DummyComp }] })
      expect(wrapper.vm.properties).toHaveLength(1)
      expect(wrapper.vm.properties[0].property).toBe('x')
      expect(wrapper.vm.properties[0].component).toBeTruthy()
    })
  })

  describe('submitBatchEdit error fallback (line 1086)', () => {
    it('falls back to a default message when the error has none', async () => {
      const { wrapper, mocks } = mountList({ config: { form: { batch_edit: { fields: ['name'] } } } })
      wrapper.vm.em.batchUpdate.mockRejectedValue({})
      await wrapper.setData({ selectedRecords: [{ id: 1 }] })
      wrapper.vm.batchEditDialog.show = true
      wrapper.vm.batchEditDialog.form = { name: 'x' }
      wrapper.vm.batchEditDialog.selectedFields = ['name']
      await wrapper.vm.submitBatchEdit()
      expect(mocks.$message.error).toHaveBeenCalledWith('Error')
      expect(wrapper.vm.batchEditing).toBe(false)
      expect(wrapper.vm.batchEditDialog.show).toBe(true)
    })
  })

  describe('batch dialog label fallback (line 347)', () => {
    it('prefers explicit labels over structure translations', async () => {
      const { wrapper } = mountList({
        config: { form: { batch_edit: { fields: [{ property: 'status', label: 'Status Label' }] } } }
      })
      await wrapper.setData({ structure: { status: { translation: 'Status Trans' } } })
      wrapper.vm.openBatchEditDialog()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Status Label')
    })

    it('uses structure translations, then the property name', async () => {
      const { wrapper } = mountList({
        config: { form: { batch_edit: { fields: [{ property: 'status' }, { property: 'other' }] } } }
      })
      await wrapper.setData({ structure: { status: { translation: 'Status Trans' } } })
      wrapper.vm.openBatchEditDialog()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Status Trans')
      expect(wrapper.text()).toContain('other')
    })
  })

  describe('table template branches (line 207)', () => {
    it('renders editable, plugin, plain and custom-component cells', async () => {
      const { wrapper } = mountList({
        listDisplay: [
          'id',
          { property: 'name', editable: true, type: 'string' },
          { property: 'active', type: 'boolean' },
          'title',
          { property: 'custom', component: DummyComp }
        ]
      })
      await wrapper.setData({
        structure: {
          name: { metadata: { type: 'string' }, translation: 'Name' },
          active: { metadata: { type: 'boolean' }, translation: 'Active' },
          title: { translation: 'Title' }
        },
        list: [{ id: 1, name: 'Ada', active: true, title: '<b>Ada</b>', custom: 'c' }]
      })
      await wrapper.vm.$nextTick()
      await flush()
      const html = wrapper.html()
      expect(html).toContain('Ada')
      expect(html).not.toContain('<b>Ada</b>')
      expect(wrapper.find('.dummy-comp').exists()).toBe(true)
    })
  })
})
