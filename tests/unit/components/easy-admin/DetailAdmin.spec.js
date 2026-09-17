import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DetailAdmin from '@/components/EasyAdmin/DetailAdmin.vue'

vi.mock('@/utils/entity', () => {
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

function findButton(wrapper, text) {
  const found = wrapper.findAll('button').filter((b) => b.text().includes(text))
  return found.length ? found[0] : null
}

describe('DetailAdmin.vue', () => {
  describe('creation / properties', () => {
    it('maps string and object fields to properties and builds the entity manager', async () => {
      const { wrapper } = mountDetail({ fields: ['name', { property: 'age', label: 'Age' }] })
      expect(wrapper.vm.em.name).toBe('User')
      expect(wrapper.vm.properties).toEqual([{ property: 'name' }, { property: 'age', label: 'Age' }])
      await flush()
    })

    it('drops __all__ markers from the initial properties', async () => {
      const { wrapper } = mountDetail({ fields: ['name', '__all__'] })
      expect(wrapper.vm.properties).toEqual([{ property: 'name' }])
      await flush()
    })

    it('starts in loading state', () => {
      const { wrapper } = mountDetail()
      expect(wrapper.vm.loading).toBe(true)
    })
  })

  describe('fetchData', () => {
    it('loads structure and record on success', async () => {
      const { wrapper } = mountDetail({ fields: ['name'] })
      wrapper.vm.em.structure.mockResolvedValue({ name: { translation: 'Name' } })
      wrapper.vm.em.retrieve.mockResolvedValue({ data: { id: 1, name: 'Ada' } })
      wrapper.vm.fetchData()
      expect(wrapper.vm.loading).toBe(true)
      await flush()
      expect(wrapper.vm.em.structure).toHaveBeenCalled()
      expect(wrapper.vm.em.retrieve).toHaveBeenCalledWith(1)
      expect(wrapper.vm.structure).toEqual({ name: { translation: 'Name' } })
      expect(wrapper.vm.record).toEqual({ id: 1, name: 'Ada' })
      expect(wrapper.vm.loading).toBe(false)
    })

    it('expands __all__ fields from the loaded structure', async () => {
      const { wrapper } = mountDetail({ fields: '__all__' })
      wrapper.vm.em.structure.mockResolvedValue({ id: {}, name: {} })
      wrapper.vm.em.retrieve.mockResolvedValue({ data: { id: 1 } })
      wrapper.vm.fetchData()
      await flush()
      expect(wrapper.vm.properties).toEqual([{ property: 'id' }, { property: 'name' }])
      expect(wrapper.vm.loading).toBe(false)
    })

    it('keeps explicit object fields first when mixing __all__ with configured fields', async () => {
      const explicit = { property: 'name', label: 'Custom' }
      const { wrapper } = mountDetail({ fields: [explicit, '__all__'] })
      wrapper.vm.em.structure.mockResolvedValue({ id: {}, name: {} })
      wrapper.vm.em.retrieve.mockResolvedValue({ data: { id: 1 } })
      wrapper.vm.fetchData()
      await flush()
      expect(wrapper.vm.properties).toEqual([explicit, { property: 'id' }])
    })

    it('reports retrieve failures and stops loading', async () => {
      const { wrapper, mocks } = mountDetail({ fields: ['name'] })
      wrapper.vm.em.structure.mockResolvedValue({})
      wrapper.vm.em.retrieve.mockRejectedValue(new Error('not found'))
      wrapper.vm.fetchData()
      await flush()
      expect(mocks.$message.error).toHaveBeenCalledWith('not found')
      expect(wrapper.vm.loading).toBe(false)
    })

    it('falls back to a default message when the error has no message', async () => {
      const { wrapper, mocks } = mountDetail({ fields: ['name'] })
      wrapper.vm.em.structure.mockResolvedValue({})
      wrapper.vm.em.retrieve.mockRejectedValue({})
      wrapper.vm.fetchData()
      await flush()
      expect(mocks.$message.error).toHaveBeenCalledWith('Failed to load record')
      expect(wrapper.vm.loading).toBe(false)
    })
  })

  describe('labels / plugin types', () => {
    it('getLabel prefers explicit labels, then structure translations', () => {
      const { wrapper } = mountDetail()
      expect(wrapper.vm.getLabel({ property: 'name', label: 'L' })).toBe('L')
      expect(wrapper.vm.getLabel({ property: 'name', field_options: { label: 'FL' } })).toBe('FL')
      wrapper.vm.structure = { name: { translation: 'T' } }
      expect(wrapper.vm.getLabel({ property: 'name' })).toBe('T')
      expect(wrapper.vm.getLabel({ property: 'other' })).toBe('other')
    })

    it('getListPluginType resolves relations, scalar and json types', () => {
      const { wrapper } = mountDetail()
      expect(
        wrapper.vm.getListPluginType({ property: 'author', relation: { target: 'User' } }, {}, {})
      ).toBe('RelationToOne')
      expect(
        wrapper.vm.getListPluginType({ property: 'tags', relation: { target: 'Tag', multiple: true } }, {}, {})
      ).toBe('RelationToMany')
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'boolean' }, {}, null)).toBe('boolean')
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'json' }, {}, null)).toBe('json')
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'json_schema' }, {}, null)).toBe('json_schema')
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'ManyToOne' }, {}, null)).toBe('RelationToOne')
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'OneToMany' }, {}, null)).toBe('RelationToMany')
      expect(wrapper.vm.getListPluginType({ property: 'a', type: 'weird' }, {}, null)).toBeNull()
      expect(wrapper.vm.getListPluginType({ property: 'a' }, {}, [1])).toBe('RelationToMany')
      expect(wrapper.vm.getListPluginType({ property: 'a' }, {}, 1)).toBeNull()
    })

    it('loadPlugin resolves detail plugins, list fallbacks and aliases', () => {
      const { wrapper } = mountDetail()
      expect(wrapper.vm.loadPlugin('image')).toBeDefined()
      expect(wrapper.vm.loadPlugin('json')).toBeDefined()
      expect(wrapper.vm.loadPlugin('json_schema')).toBeDefined()
      expect(wrapper.vm.loadPlugin('boolean')).toBeDefined()
      expect(wrapper.vm.loadPlugin('datetime_immutable')).toBeDefined()
      expect(wrapper.vm.loadPlugin('ManyToOne')).toBeDefined()
    })
  })

  describe('value helpers', () => {
    it('extractField resolves dotted paths null-safely', () => {
      const { wrapper } = mountDetail()
      expect(wrapper.vm.extractField({ a: { b: 2 } }, 'a.b')).toBe(2)
      expect(wrapper.vm.extractField({ a: 1 }, 'a.missing')).toBeUndefined()
      expect(wrapper.vm.extractField(null, 'a')).toBeNull()
      expect(wrapper.vm.extractField({}, 'a.b')).toBeNull()
    })

    it('formatValue covers empty, object and html fallbacks', () => {
      const { wrapper } = mountDetail()
      expect(wrapper.vm.formatValue(null)).toBe('-')
      expect(wrapper.vm.formatValue(undefined)).toBe('-')
      expect(wrapper.vm.formatValue('')).toBe('-')
      expect(wrapper.vm.formatValue({ __toString: 'X' })).toBe('X')
      expect(wrapper.vm.formatValue({ a: 1 })).toBe(JSON.stringify({ a: 1 }))
      expect(wrapper.vm.formatValue('<b>hi</b>')).toBe('hi')
      expect(wrapper.vm.formatValue(42)).toBe('42')
      expect(wrapper.vm.formatValue(0)).toBe('0')
    })
  })

  describe('navigation', () => {
    it('goToUpdate pushes the entity update route with the record id', () => {
      const { wrapper, mocks } = mountDetail({ id: 9 })
      wrapper.vm.goToUpdate()
      expect(mocks.$router.push).toHaveBeenCalledWith({ name: 'UserUpdate', params: { id: 9 } })
    })

    it('Back button navigates back', async () => {
      const { wrapper, mocks } = mountDetail()
      await flush()
      const button = findButton(wrapper, 'Back')
      expect(button).not.toBeNull()
      await button.trigger('click')
      expect(mocks.$router.go).toHaveBeenCalledWith(-1)
    })

    it('Edit button opens the update route when editable', async () => {
      const { wrapper, mocks } = mountDetail({ id: 3 })
      await flush()
      const button = findButton(wrapper, 'Edit')
      expect(button).not.toBeNull()
      await button.trigger('click')
      expect(mocks.$router.push).toHaveBeenCalledWith({ name: 'UserUpdate', params: { id: 3 } })
    })

    it('hides the Edit button when editable is false', async () => {
      const { wrapper } = mountDetail({ editable: false })
      await flush()
      expect(findButton(wrapper, 'Edit')).toBeNull()
    })
  })

  describe('rendering', () => {
    it('renders title, record id and field values', async () => {
      const { wrapper } = mountDetail({ fields: ['name'], title: 'User detail' })
      wrapper.vm.em.structure.mockResolvedValue({ name: { translation: 'Name' } })
      wrapper.vm.em.retrieve.mockResolvedValue({ data: { id: 1, name: '<b>Ada</b>' } })
      wrapper.vm.fetchData()
      await flush()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('User detail')
      expect(wrapper.text()).toContain('#1')
      expect(wrapper.text()).toContain('Ada')
      expect(wrapper.text()).not.toContain('<b>')
    })

    it('renders a dash for empty values', async () => {
      const { wrapper } = mountDetail({ fields: ['nickname'] })
      wrapper.vm.em.structure.mockResolvedValue({})
      wrapper.vm.em.retrieve.mockResolvedValue({ data: { id: 1, nickname: '' } })
      wrapper.vm.fetchData()
      await flush()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('-')
    })
  })
})
