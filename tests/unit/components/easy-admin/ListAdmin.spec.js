import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import ListAdmin from '@/easyadmin/ui/vue/ListAdmin.vue'

vi.mock('@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter', () => {
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
  asyncRoutes: [],
  constantRoutes: [],
  lastRoutes: [],
  resetRouter: vi.fn(),
  default: {}
}))

vi.mock('@/utils/simple-image-process', () => ({
  __esModule: true,
  default: { getPicture: (url) => url }
}))

vi.mock('@/easyadmin/ui/vue/FormAdmin.vue', async () => {
  const { h } = await import('vue')
  return {
    __esModule: true,
    default: { name: 'FormAdmin', render: () => h('div', { class: 'stub-form-admin' }) }
  }
})

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

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

function mountList(props = {}, mockOverrides = {}) {
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
      stubs: { SearchFilter: true, FormAdmin: true }
    }
  })
  return { wrapper, mocks }
}

function findButton(wrapper, text) {
  const buttons = wrapper.findAll('button')
  const found = buttons.filter((b) => b.text().includes(text))
  return found.length ? found[0] : null
}

describe('ListAdmin.vue', () => {
  describe('initial data / pagination / selection', () => {
    it('initializes default pager, list, selection and dialogs', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.pager).toEqual({ page: 1, limit: 20 })
      expect(wrapper.vm.list).toEqual([])
      expect(wrapper.vm.selectedRecords).toEqual([])
      expect(wrapper.vm.sort).toEqual({})
      expect(wrapper.vm.filter).toEqual({})
      expect(wrapper.vm.dialog.show).toBe(false)
      expect(wrapper.vm.batchEditDialog.show).toBe(false)
      expect(wrapper.vm.batchDeleting).toBe(false)
      expect(wrapper.vm.batchEditing).toBe(false)
      expect(wrapper.vm.loading).toBe(true)
      expect(wrapper.vm.refreshing).toBe(false)
    })

    it('builds an EntityManage from the entityConf prop', () => {
      const { wrapper } = mountList({ entityConf: 'TestEntity' })
      expect(wrapper.vm.em.name).toBe('TestEntity')
    })

    it('computes pagerTotal as 0 without paginator and normalizes total/totalCount', async () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.pagerTotal).toBe(0)
      await wrapper.setData({ paginator: { totalCount: '7' } })
      expect(wrapper.vm.pagerTotal).toBe(7)
      wrapper.vm.paginator = { total: 3 }
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pagerTotal).toBe(3)
    })

    it('normalizePaginator coerces totals to numbers', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.normalizePaginator({ total: '12' })).toEqual({ total: '12', totalCount: 12 })
      expect(wrapper.vm.normalizePaginator({ totalCount: 5 })).toEqual({ totalCount: 5 })
      expect(wrapper.vm.normalizePaginator()).toEqual({ totalCount: 0 })
    })
  })

  describe('properties / propertieProcess', () => {
    it('maps string and object listDisplay entries to properties', () => {
      const { wrapper } = mountList({ listDisplay: ['id', { property: 'name', label: 'Name' }] })
      expect(wrapper.vm.properties).toEqual([{ property: 'id' }, { property: 'name', label: 'Name' }])
    })

    it('expands __all__ from structure keys', async () => {
      const { wrapper } = mountList({ listDisplay: '__all__' })
      expect(wrapper.vm.properties).toEqual([])
      await wrapper.setData({ structure: { id: {}, name: {} } })
      wrapper.vm.propertieProcess()
      expect(wrapper.vm.properties).toEqual([{ property: 'id' }, { property: 'name' }])
    })

    it('leaves titleText empty when no redirect route matches', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.titleText).toBe('')
    })
  })

  describe('fetchData / dataProcessor', () => {
    it('delegates fetchData to the dataProcessor prop', () => {
      const dataProcessor = vi.fn()
      const { wrapper } = mountList({ dataProcessor })
      wrapper.vm.fetchData()
      expect(dataProcessor).toHaveBeenCalledTimes(1)
      expect(dataProcessor).toHaveBeenCalledWith(wrapper.vm)
    })

    it('default dataProcessor merges query/filter/pager/sort and assigns list + paginator', async () => {
      const defaultProcessor = ListAdmin.props.dataProcessor.default
      const ctx = {
        em: {
          structure: vi.fn().mockResolvedValue({ id: {} }),
          list: vi.fn().mockResolvedValue({ data: [{ id: 1 }], paginator: { total: 5 } })
        },
        query: { a: 1 },
        filter: { '@filter': 'x' },
        pager: { page: 2, limit: 20 },
        sort: { '@order': 'entity.id|ASC' },
        refreshing: false,
        loading: true,
        list: [],
        paginator: null,
        structure: {},
        normalizePaginator: ListAdmin.methods.normalizePaginator
      }
      defaultProcessor(ctx)
      expect(ctx.refreshing).toBe(true)
      expect(ctx.loading).toBe(false)
      await flush()
      expect(ctx.em.list).toHaveBeenCalledWith({ a: 1, '@filter': 'x', page: 2, limit: 20, '@order': 'entity.id|ASC' })
      expect(ctx.list).toEqual([{ id: 1 }])
      expect(ctx.paginator).toEqual({ total: 5, totalCount: 5 })
      expect(ctx.structure).toEqual({ id: {} })
      expect(ctx.refreshing).toBe(false)
    })

    it('default dataProcessor still clears refreshing when a request fails', async () => {
      const defaultProcessor = ListAdmin.props.dataProcessor.default
      const ctx = {
        em: {
          structure: vi.fn().mockRejectedValue(new Error('nope')),
          list: vi.fn().mockResolvedValue({ data: [], paginator: {} })
        },
        query: {},
        filter: {},
        pager: { page: 1, limit: 20 },
        sort: {},
        refreshing: false,
        loading: true,
        normalizePaginator: ListAdmin.methods.normalizePaginator
      }
      defaultProcessor(ctx)
      await flush()
      expect(ctx.refreshing).toBe(false)
    })

    it('fetchFilteredData resets page by default and preserves it when asked', () => {
      const { wrapper } = mountList()
      const spy = vi.spyOn(wrapper.vm, 'fetchData').mockImplementation(() => {})
      wrapper.vm.pager.page = 3
      wrapper.vm.fetchFilteredData(null, true)
      expect(wrapper.vm.pager.page).toBe(1)
      wrapper.vm.pager.page = 3
      wrapper.vm.fetchFilteredData(null, false)
      expect(wrapper.vm.pager.page).toBe(3)
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('resetSearch restores default pager and refetches', () => {
      const { wrapper } = mountList()
      const spy = vi.spyOn(wrapper.vm, 'fetchData').mockImplementation(() => {})
      wrapper.vm.pager.page = 4
      wrapper.vm.pager.limit = 50
      wrapper.vm.resetSearch()
      expect(wrapper.vm.pager).toEqual({ page: 1, limit: 20 })
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('sorting / pagination / selection handlers', () => {
    it('changeSort maps element-plus orders to entity order expressions', () => {
      const { wrapper } = mountList()
      const spy = vi.spyOn(wrapper.vm, 'fetchData').mockImplementation(() => {})
      wrapper.vm.changeSort({ prop: 'title', order: 'ascending' })
      expect(wrapper.vm.sort['@order']).toBe('entity.title|ASC')
      wrapper.vm.changeSort({ prop: 'title', order: 'descending' })
      expect(wrapper.vm.sort['@order']).toBe('entity.title|DESC')
      wrapper.vm.changeSort({ prop: 'title', order: null })
      expect(wrapper.vm.sort['@order']).toBe('')
      expect(spy).toHaveBeenCalledTimes(3)
    })

    it('handleSizeChange updates limit, resets page and syncs url', () => {
      const { wrapper } = mountList()
      const fetchSpy = vi.spyOn(wrapper.vm, 'fetchData').mockImplementation(() => {})
      const syncSpy = vi.spyOn(wrapper.vm, 'syncToUrl').mockImplementation(() => {})
      wrapper.vm.pager.page = 5
      wrapper.vm.handleSizeChange(50)
      expect(wrapper.vm.pager).toEqual({ page: 1, limit: 50 })
      expect(syncSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('handleCurrentChange updates page and syncs url', () => {
      const { wrapper } = mountList()
      const fetchSpy = vi.spyOn(wrapper.vm, 'fetchData').mockImplementation(() => {})
      const syncSpy = vi.spyOn(wrapper.vm, 'syncToUrl').mockImplementation(() => {})
      wrapper.vm.handleCurrentChange(3)
      expect(wrapper.vm.pager.page).toBe(3)
      expect(syncSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('handleSelectionChange stores selected records', () => {
      const { wrapper } = mountList()
      wrapper.vm.handleSelectionChange([{ id: 1 }, { id: 2 }])
      expect(wrapper.vm.selectedRecords).toEqual([{ id: 1 }, { id: 2 }])
    })
  })

  describe('single delete flow', () => {
    it('removeAction deletes, notifies and refetches', async () => {
      const { wrapper, mocks } = mountList()
      const notifySpy = vi.spyOn(wrapper.vm, 'notifySuccess').mockImplementation(() => {})
      const fetchSpy = vi.spyOn(wrapper.vm, 'fetchData').mockImplementation(() => {})
      wrapper.vm.removeAction(7)
      await flush()
      expect(wrapper.vm.em.delete).toHaveBeenCalledWith(7)
      expect(notifySpy).toHaveBeenCalledWith('Deleted successfully')
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(mocks.$message).not.toHaveBeenCalled()
    })
  })

  describe('batch delete flow', () => {
    it('hasBatchDelete is disabled via delete or batch_delete', () => {
      expect(mountList().wrapper.vm.hasBatchDelete).toBe(true)
      expect(mountList({ disabledActions: ['delete'] }).wrapper.vm.hasBatchDelete).toBe(false)
      expect(mountList({ disabledActions: ['batch_delete'] }).wrapper.vm.hasBatchDelete).toBe(false)
    })

    it('removeSelected does nothing without selectable ids', async () => {
      const { wrapper } = mountList()
      await wrapper.setData({ selectedRecords: [{ name: 'no-id' }] })
      await wrapper.vm.removeSelected()
      expect(wrapper.vm.em.deleteMany).not.toHaveBeenCalled()
    })

    it('removeSelected deletes all ids, notifies, clears selection and refetches', async () => {
      const { wrapper } = mountList()
      const notifySpy = vi.spyOn(wrapper.vm, 'notifySuccess').mockImplementation(() => {})
      const fetchSpy = vi.spyOn(wrapper.vm, 'fetchData').mockImplementation(() => {})
      wrapper.vm.em.deleteMany.mockResolvedValue([{ status: 'fulfilled' }, { status: 'fulfilled' }])
      await wrapper.setData({ selectedRecords: [{ id: 1 }, { id: 2 }] })
      await wrapper.vm.removeSelected()
      expect(wrapper.vm.em.deleteMany).toHaveBeenCalledWith([1, 2])
      expect(notifySpy).toHaveBeenCalledWith('Deleted {0} records successfully')
      expect(wrapper.vm.selectedRecords).toEqual([])
      expect(wrapper.vm.batchDeleting).toBe(false)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('removeSelected warns about failures while keeping successes', async () => {
      const { wrapper, mocks } = mountList()
      const notifySpy = vi.spyOn(wrapper.vm, 'notifySuccess').mockImplementation(() => {})
      wrapper.vm.em.deleteMany.mockResolvedValue([{ status: 'fulfilled' }, { status: 'rejected' }])
      await wrapper.setData({ selectedRecords: [{ id: 1 }, { id: 2 }] })
      await wrapper.vm.removeSelected()
      expect(notifySpy).toHaveBeenCalledWith('Deleted {0} records successfully')
      expect(mocks.$message).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning' })
      )
      expect(wrapper.vm.batchDeleting).toBe(false)
    })
  })

  describe('batch edit flow', () => {
    const batchConfig = { form: { batch_edit: { fields: ['name'] } } }

    it('hasBatchEdit requires batch fields and enabled edit actions', () => {
      expect(mountList().wrapper.vm.hasBatchEdit).toBeFalsy()
      expect(mountList({ config: batchConfig }).wrapper.vm.hasBatchEdit).toBeTruthy()
      expect(
        mountList({ config: batchConfig, disabledActions: ['edit'] }).wrapper.vm.hasBatchEdit
      ).toBe(false)
      expect(
        mountList({ config: batchConfig, disabledActions: ['batch_edit'] }).wrapper.vm.hasBatchEdit
      ).toBe(false)
      expect(
        mountList({ config: { form: { batch_edit: { fields: [] } } } }).wrapper.vm.hasBatchEdit
      ).toBeFalsy()
    })

    it('resolvedBatchFields normalizes string fields to objects', () => {
      const { wrapper } = mountList({ config: batchConfig })
      expect(wrapper.vm.resolvedBatchFields).toEqual([{ property: 'name' }])
      const empty = mountList()
      expect(empty.wrapper.vm.resolvedBatchFields).toEqual([])
    })

    it('openBatchEditDialog resets state and shows the dialog', () => {
      const { wrapper } = mountList({ config: batchConfig })
      wrapper.vm.batchEditDialog.form = { name: 'stale' }
      wrapper.vm.batchEditDialog.selectedFields = ['name']
      wrapper.vm.openBatchEditDialog()
      expect(wrapper.vm.batchEditDialog.form).toEqual({})
      expect(wrapper.vm.batchEditDialog.selectedFields).toEqual([])
      expect(wrapper.vm.batchEditDialog.show).toBe(true)
    })

    it('resetBatchEditDialog clears form and selected fields', () => {
      const { wrapper } = mountList({ config: batchConfig })
      wrapper.vm.batchEditDialog.form = { name: 'x' }
      wrapper.vm.batchEditDialog.selectedFields = ['name']
      wrapper.vm.resetBatchEditDialog()
      expect(wrapper.vm.batchEditDialog.form).toEqual({})
      expect(wrapper.vm.batchEditDialog.selectedFields).toEqual([])
    })

    it('submitBatchEdit does nothing without selected ids', async () => {
      const { wrapper } = mountList({ config: batchConfig })
      await wrapper.setData({ selectedRecords: [] })
      await wrapper.vm.submitBatchEdit()
      expect(wrapper.vm.em.batchUpdate).not.toHaveBeenCalled()
    })

    it('submitBatchEdit warns when no fields are selected', async () => {
      const { wrapper, mocks } = mountList({ config: batchConfig })
      await wrapper.setData({ selectedRecords: [{ id: 1 }] })
      wrapper.vm.batchEditDialog.form = { name: 'x' }
      wrapper.vm.batchEditDialog.selectedFields = []
      await wrapper.vm.submitBatchEdit()
      expect(wrapper.vm.em.batchUpdate).not.toHaveBeenCalled()
      expect(mocks.$message).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }))
    })

    it('submitBatchEdit sends only selected batch fields and closes the dialog', async () => {
      const { wrapper } = mountList({ config: batchConfig })
      const notifySpy = vi.spyOn(wrapper.vm, 'notifySuccess').mockImplementation(() => {})
      const fetchSpy = vi.spyOn(wrapper.vm, 'fetchData').mockImplementation(() => {})
      await wrapper.setData({ selectedRecords: [{ id: 1 }, { id: 2 }] })
      wrapper.vm.batchEditDialog.show = true
      wrapper.vm.batchEditDialog.form = { name: 'x', other: 'y' }
      wrapper.vm.batchEditDialog.selectedFields = ['name', 'other']
      await wrapper.vm.submitBatchEdit()
      expect(wrapper.vm.em.batchUpdate).toHaveBeenCalledWith([1, 2], { name: 'x' })
      expect(notifySpy).toHaveBeenCalledWith('Data saved successfully')
      expect(wrapper.vm.batchEditDialog.show).toBe(false)
      expect(wrapper.vm.selectedRecords).toEqual([])
      expect(wrapper.vm.batchEditing).toBe(false)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('submitBatchEdit reports batchUpdate errors and resets the editing flag', async () => {
      const { wrapper, mocks } = mountList({ config: batchConfig })
      wrapper.vm.em.batchUpdate.mockRejectedValue(new Error('boom'))
      await wrapper.setData({ selectedRecords: [{ id: 1 }] })
      wrapper.vm.batchEditDialog.show = true
      wrapper.vm.batchEditDialog.form = { name: 'x' }
      wrapper.vm.batchEditDialog.selectedFields = ['name']
      await wrapper.vm.submitBatchEdit()
      expect(mocks.$message.error).toHaveBeenCalledWith('boom')
      expect(wrapper.vm.batchEditing).toBe(false)
      expect(wrapper.vm.batchEditDialog.show).toBe(true)
    })

    it('auto-selects touched batch fields in the form watcher', async () => {
      const { wrapper } = mountList({ config: batchConfig })
      wrapper.vm.openBatchEditDialog()
      wrapper.vm.batchEditDialog.form = { name: 'x' }
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.batchEditDialog.selectedFields).toContain('name')
    })

    it('ignores empty relation arrays initialized by form plugins', async () => {
      const { wrapper } = mountList({ config: { form: { batch_edit: { fields: ['tags'] } } } })
      wrapper.vm.openBatchEditDialog()
      wrapper.vm.batchEditDialog.form = { tags: [] }
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.batchEditDialog.selectedFields).not.toContain('tags')
    })
  })

  describe('batch plugin type resolution', () => {
    it('resolveBatchPluginType prefers explicit field types', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.resolveBatchPluginType({ property: 'x', type: 'text' })).toBe('text')
    })

    it('resolveBatchPluginType maps relation metadata types', async () => {
      const { wrapper } = mountList()
      await wrapper.setData({ structure: { author: { metadata: { type: 'ManyToOne' } } } })
      expect(wrapper.vm.resolveBatchPluginType({ property: 'author' })).toBe('RelationToOne')
      await wrapper.setData({ structure: { tags: { metadata: { type: 'ManyToMany' } } } })
      expect(wrapper.vm.resolveBatchPluginType({ property: 'tags' })).toBe('RelationToMany')
    })

    it('resolveBatchPluginType falls back to supported metadata types or input', async () => {
      const { wrapper } = mountList()
      await wrapper.setData({ structure: { active: { metadata: { type: 'boolean' } } } })
      expect(wrapper.vm.resolveBatchPluginType({ property: 'active' })).toBe('boolean')
      await wrapper.setData({ structure: { weird: { metadata: { type: 'unknown-thing' } } } })
      expect(wrapper.vm.resolveBatchPluginType({ property: 'weird' })).toBe('input')
      expect(wrapper.vm.resolveBatchPluginType({ property: 'missing' })).toBe('input')
    })

    it('loadBatchPlugin maps aliases and falls back to input', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.loadBatchPlugin('images')).toBeDefined()
      expect(wrapper.vm.loadBatchPlugin('datetime_immutable')).toBeDefined()
      expect(wrapper.vm.loadBatchPlugin('ManyToOne')).toBeDefined()
      expect(wrapper.vm.loadBatchPlugin('OneToMany')).toBeDefined()
      expect(wrapper.vm.loadBatchPlugin('input')).toBeDefined()
      expect(wrapper.vm.loadBatchPlugin('no-such-type')).toBeDefined()
      expect(wrapper.vm.loadBatchPlugin(undefined)).toBeDefined()
    })
  })

  describe('dialog open / close', () => {
    it('loadDialogComponent stores dialog data and bumps refresh', () => {
      const { wrapper } = mountList()
      const before = wrapper.vm.dialog.refresh
      wrapper.vm.loadDialogComponent({ entityConf: 'TestEntity', fields: [], config: {} })
      expect(wrapper.vm.dialog.data.entityConf).toBe('TestEntity')
      expect(wrapper.vm.dialog.refresh).toBe(before + 1)
    })

    it('openEditDialog targets the record and shows the dialog', () => {
      const { wrapper } = mountList()
      const before = wrapper.vm.dialog.refresh
      wrapper.vm.openEditDialog(5)
      expect(wrapper.vm.dialog.title).toBe('Edit Record')
      expect(wrapper.vm.dialog.data.id).toBe(5)
      expect(wrapper.vm.dialog.refresh).toBe(before + 1)
      expect(wrapper.vm.dialog.show).toBe(true)
    })

    it('closeEditDialog notifies and hides the dialog', () => {
      const { wrapper } = mountList()
      const spy = vi.spyOn(wrapper.vm, 'notifySuccess').mockImplementation(() => {})
      wrapper.vm.dialog.show = true
      wrapper.vm.closeEditDialog()
      expect(spy).toHaveBeenCalledWith('Data saved successfully')
      expect(wrapper.vm.dialog.show).toBe(false)
    })

    it('New button opens a blank record dialog', async () => {
      const { wrapper } = mountList({ listDisplay: ['name'] })
      const button = findButton(wrapper, 'New')
      expect(button).not.toBeNull()
      await button.trigger('click')
      expect(wrapper.vm.dialog.title).toBe('New Record')
      expect(wrapper.vm.dialog.data.id).toBeUndefined()
      expect(wrapper.vm.dialog.show).toBe(true)
    })
  })

  describe('filter / url query handling', () => {
    it('buildQueryParams skips empty values and default pager', () => {
      const { wrapper } = mountList()
      wrapper.vm.listFilterData = { a: 'x', b: null, c: '', d: 0 }
      wrapper.vm.pager = { page: 1, limit: 20 }
      expect(wrapper.vm.buildQueryParams()).toEqual({ a: 'x', d: 0 })
      wrapper.vm.pager = { page: 2, limit: 50 }
      expect(wrapper.vm.buildQueryParams()).toEqual({ a: 'x', d: 0, page: '2', limit: '50' })
    })

    it('applyQueryParams parses page/limit and keeps remaining keys as filters', () => {
      const { wrapper } = mountList()
      wrapper.vm.applyQueryParams({ page: '3', limit: '50', name: 'abc' })
      expect(wrapper.vm.pager).toEqual({ page: 3, limit: 50 })
      expect(wrapper.vm.listFilterData).toEqual({ name: 'abc' })
    })

    it('applyQueryParams resets pager when page/limit are absent and guards invalid values', () => {
      const { wrapper } = mountList()
      wrapper.vm.pager = { page: 9, limit: 99 }
      wrapper.vm.applyQueryParams({ name: 'abc' })
      expect(wrapper.vm.pager).toEqual({ page: 1, limit: 20 })
      wrapper.vm.applyQueryParams({ page: 'oops', limit: '-3' })
      expect(wrapper.vm.pager.page).toBe(1)
      expect(wrapper.vm.pager.limit).toBe(1)
    })

    it('shows loading empty text while refreshing', async () => {
      const { wrapper } = mountList()
      const table = () => wrapper.findComponent({ name: 'ElTable' })
      await wrapper.setData({ refreshing: true })
      expect(table().props('emptyText')).toBe('Loading data...')
      await wrapper.setData({ refreshing: false })
      expect(table().props('emptyText')).toBe('No data')
    })

    it('syncToUrl debounces filter state into history.replaceState', async () => {
      const { wrapper } = mountList()
      vi.useFakeTimers()
      try {
        const spy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
        wrapper.vm.listFilterData = { name: 'abc' }
        await wrapper.vm.$nextTick()
        vi.advanceTimersByTime(100)
        expect(spy).toHaveBeenCalled()
        spy.mockRestore()
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('field helpers', () => {
    it('extractFields resolves dotted paths and degrades to null', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.extractFields({ a: { b: { c: 1 } } }, 'a.b.c')).toBe(1)
      expect(wrapper.vm.extractFields({ a: 1 }, 'a.missing')).toBeNull()
      expect(wrapper.vm.extractFields(null, 'a')).toBeNull()
    })

    it('htmlStrip removes tags and handles empty input', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.htmlStrip('<b>hi</b>')).toBe('hi')
      expect(wrapper.vm.htmlStrip('')).toBe('')
      expect(wrapper.vm.htmlStrip(null)).toBe('')
    })

    it('checkMetadataType matches metadata types only', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.checkMetadataType({ metadata: { type: 'string' } }, 'string')).toBe(true)
      expect(wrapper.vm.checkMetadataType({}, 'string')).toBe(false)
      expect(wrapper.vm.checkMetadataType(null, 'string')).toBeFalsy()
    })

    it('getPicture delegates to the image processor', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.getPicture('u')).toBe('u')
    })

    it('_console returns the console', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm._console()).toBe(console)
    })

    it('startLoading and notifySuccess delegate to ui feedback', () => {
      const { wrapper, mocks } = mountList()
      const close = vi.fn()
      mocks.$loading.mockReturnValue({ close })
      const loading = wrapper.vm.startLoading({ text: 'x' })
      expect(mocks.$loading).toHaveBeenCalledWith({ text: 'x' })
      expect(loading.close).toBe(close)
      wrapper.vm.notifySuccess('ok')
      expect(mocks.$message).toHaveBeenCalledWith({ message: 'ok', type: 'success' })
      expect(wrapper.vm.uiFeedback()).toBeDefined()
    })
  })

  describe('editable fields and list plugins', () => {
    it('isEditableField guards id, image, non-editable and unknown types', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.isEditableField({ property: 'id', editable: true, type: 'string' }, {})).toBe(false)
      expect(wrapper.vm.isEditableField({ property: 'avatar', editable: true, type: 'image' }, {})).toBe(false)
      expect(wrapper.vm.isEditableField({ property: 'name', type: 'string' }, {})).toBe(false)
      expect(wrapper.vm.isEditableField({ property: 'name', type: 'string', editable: true }, {})).toBe(true)
      expect(
        wrapper.vm.isEditableField({ property: 'age', editable: true }, { metadata: { type: 'integer' } })
      ).toBe(true)
      expect(wrapper.vm.isEditableField({ property: 'x', editable: true, type: 'object' }, {})).toBe(false)
      expect(wrapper.vm.isEditableField({ property: 'y', editable: true }, null)).toBe(false)
    })

    it('getListPluginType resolves relations and scalar types', () => {
      const { wrapper } = mountList()
      expect(
        wrapper.vm.getListPluginType({ property: 'author', relation: { target: 'User' } }, {}, {})
      ).toBe('RelationToOne')
      expect(
        wrapper.vm.getListPluginType({ property: 'tags', relation: { target: 'Tag', multiple: true } }, {}, {})
      ).toBe('RelationToMany')
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'boolean' }, {}, null)).toBe('boolean')
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'ManyToOne' }, {}, null)).toBe('RelationToOne')
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'ManyToMany' }, {}, null)).toBe('RelationToMany')
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'weird' }, {}, null)).toBeNull()
      expect(wrapper.vm.getListPluginType({ property: 'a' }, {}, [1])).toBe('RelationToMany')
      expect(wrapper.vm.getListPluginType({ property: 'a' }, {}, 1)).toBeNull()
    })

    it('loadListPlugin maps aliases to list plugin components', () => {
      const { wrapper } = mountList()
      expect(wrapper.vm.loadListPlugin('boolean')).toBeDefined()
      expect(wrapper.vm.loadListPlugin('datetime_immutable')).toBeDefined()
      expect(wrapper.vm.loadListPlugin('ManyToOne')).toBeDefined()
      expect(wrapper.vm.loadListPlugin('OneToMany')).toBeDefined()
    })
  })

  describe('disabledActions branches', () => {
    const exportConfig = { form: { fields: [] }, list: { export: {}, query: {} } }

    it('shows the export button only when enabled and configured', () => {
      expect(findButton(mountList({ config: exportConfig }).wrapper, 'Export')).not.toBeNull()
      expect(
        findButton(mountList({ config: exportConfig, disabledActions: ['export'] }).wrapper, 'Export')
      ).toBeNull()
      expect(findButton(mountList().wrapper, 'Export')).toBeNull()
      expect(findButton(mountList({ config: { form: { fields: [] } } }).wrapper, 'Export')).toBeNull()
    })

    it('hides the New button when new is disabled', () => {
      expect(findButton(mountList().wrapper, 'New')).not.toBeNull()
      expect(findButton(mountList({ disabledActions: ['new'] }).wrapper, 'New')).toBeNull()
    })

    it('hides the pager when pager is disabled', () => {
      expect(mountList().wrapper.find('.pager').exists()).toBe(true)
      expect(mountList({ disabledActions: ['pager'] }).wrapper.find('.pager').exists()).toBe(false)
    })

    it('hides the actions column when lines are disabled', async () => {
      const enabled = mountList()
      const disabled = mountList({ disabledActions: ['lines'] })
      await enabled.wrapper.vm.$nextTick()
      await disabled.wrapper.vm.$nextTick()
      await flush()
      expect(enabled.wrapper.html()).toContain('Actions')
      expect(disabled.wrapper.html()).not.toContain('Actions')
    })

    it('shows the selection count only when batch actions are available', async () => {
      const { wrapper } = mountList()
      expect(wrapper.find('.easy-admin-selection-count').exists()).toBe(false)
      await wrapper.setData({ selectedRecords: [{ id: 1 }] })
      expect(wrapper.find('.easy-admin-selection-count').exists()).toBe(true)
      const disabled = mountList({ disabledActions: ['delete'] })
      await disabled.wrapper.setData({ selectedRecords: [{ id: 1 }] })
      expect(disabled.wrapper.find('.easy-admin-selection-count').exists()).toBe(false)
    })
  })

  describe('export flow', () => {
    it('exports current list data with merged query, labels and filename', async () => {
      const { wrapper, mocks } = mountList({
        config: {
          form: { fields: [] },
          list: {
            export: { query: { '@display': 'e' }, label: { name: 'Name' } },
            query: { limit: 20 }
          }
        }
      })
      const close = vi.fn()
      mocks.$loading.mockReturnValue({ close })
      wrapper.vm.filter = { '@filter': 'f' }
      wrapper.vm.em.list.mockResolvedValue({
        data: [
          { id: 1, name: '<b>A</b>', meta: { __toString: 'M' }, plain: { a: 1 } }
        ]
      })
      const button = findButton(wrapper, 'Export')
      expect(button).not.toBeNull()
      await button.trigger('click')
      await flush()
      expect(mocks.$loading).toHaveBeenCalledWith(expect.objectContaining({ text: 'Exporting data' }))
      expect(wrapper.vm.em.list).toHaveBeenCalledWith({ limit: 20, '@filter': 'f', '@display': 'e' })
      expect(close).toHaveBeenCalledTimes(1)
      expect(mocks.exportExcelCsv).toHaveBeenCalledTimes(1)
      const [label, data, filename] = mocks.exportExcelCsv.mock.calls[0]
      expect(label).toEqual({ name: 'Name' })
      expect(filename).toBe('export-TestEntity.csv')
      expect(data[0].name).toBe('<b>A</b>')
      expect(data[0].meta).toBe('M')
      expect(data[0].plain).toBe('[Object]')
    })

    it('derives labels from data keys when no export labels are configured', async () => {
      const { wrapper, mocks } = mountList({ config: { form: { fields: [] }, list: { export: {} } } })
      mocks.$loading.mockReturnValue({ close: vi.fn() })
      wrapper.vm.em.list.mockResolvedValue({ data: [{ id: 1, name: 'A' }] })
      await findButton(wrapper, 'Export').trigger('click')
      await flush()
      const [label] = mocks.exportExcelCsv.mock.calls[0]
      expect(label).toEqual({ id: 'id', name: 'name' })
    })
  })

  describe('model watchers', () => {
    it('mirrors modelValue into list', async () => {
      const { wrapper } = mountList()
      await wrapper.setProps({ modelValue: [{ id: 1 }] })
      expect(wrapper.vm.list).toEqual([{ id: 1 }])
    })

    it('emits update:modelValue when list changes', async () => {
      const { wrapper } = mountList()
      await wrapper.setData({ list: [{ id: 2 }] })
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })
})
