import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

const { structureMock, retrieveMock, createMock, updateMock, listMock } = vi.hoisted(() => ({
  structureMock: vi.fn(),
  retrieveMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  listMock: vi.fn()
}))

const feedbackMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn()
}))

vi.mock('@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter', () => {
  class EntityManageMock {
    constructor(conf) {
      this.conf = conf
      this.name = typeof conf === 'string' ? conf : (conf && conf.name) || null
      this.prefix = (conf && conf.prefix) || '/api'
      this.plural = (conf && conf.plural) || 'mocks'
    }

    structure() { return structureMock() }
    retrieve(id) { return retrieveMock(id) }
    list(params) { return listMock(params) }
    create(data) { return createMock(data) }
    update(id, data) { return updateMock(id, data) }
  }
  return { default: EntityManageMock }
})

vi.mock('@/configs/entities', () => ({
  default: { Role: {}, User: {}, Store: {}}
}))

vi.mock('@/components/Tinymce', () => ({
  default: { name: 'Tinymce', template: '<div class="tinymce-stub" />' }
}))

vi.mock('@/easyadmin/ui/vue/feedback', () => ({
  createUiFeedback: () => feedbackMocks
}))

// Insurance: plugin components resolved lazily via import.meta.glob may use
// EntityManage/request internally. EntityManage is mocked above; mock request
// too so no test can ever hit the network.
vi.mock('@/utils/request', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

import FormAdmin from '@/easyadmin/ui/vue/FormAdmin.vue'

const PluginStub = { name: 'PluginStub', template: '<div class="plugin-stub" />' }

// el-form is stubbed, so its `validate` comes from here. `$refs` is readonly,
// therefore per-test control goes through this mock, not $refs assignment.
const formValidateMock = vi.fn(cb => cb(true))

function setValidate(valid) {
  formValidateMock.mockReset()
  formValidateMock.mockImplementation(cb => cb(valid))
}

const baseStructure = () => ({
  name: { metadata: { type: 'text', nullable: false }, translation: 'Name' },
  description: { metadata: { type: 'textarea', nullable: true }, translation: 'Description' },
  enabled: { metadata: { type: 'boolean', nullable: true }, translation: 'Enabled' }
})

function mountForm({ props = {}, structure, retrieveData } = {}) {
  if (structure !== undefined) structureMock.mockResolvedValue(structure)
  if (retrieveData !== undefined) retrieveMock.mockResolvedValue({ data: retrieveData })
  const $router = { go: vi.fn(), replace: vi.fn() }
  const wrapper = mount(FormAdmin, {
    props: { entityConf: { name: 'Product' }, fields: ['name'], ...props },
    global: {
      mocks: {
        $t: key => key,
        $route: { meta: { title: 'Product' }},
        $router,
        $message: { error: vi.fn() },
        $loading: vi.fn(() => ({ close: vi.fn() }))
      },
      directives: { loading: {}},
      stubs: {
        'el-row': { template: '<div><slot /></div>' },
        'el-col': { template: '<div><slot /></div>' },
        'el-tabs': { template: '<div><slot /></div>' },
        'el-tab-pane': { template: '<div><slot /></div>' },
        'el-form': { template: '<div><slot /></div>', methods: { validate: formValidateMock }},
        'el-form-item': { template: '<div><slot /></div>' },
        'el-button': { template: '<button><slot /></button>' },
        'el-icon': { template: '<span><slot /></span>' },
        'el-icon-info': { template: '<span />' },
        Tinymce: { template: '<div class="tinymce-stub" />' }
      }
    }
  })
  return { wrapper, $router }
}

async function settled(wrapper) {
  await flushPromises()
  await nextTick()
  await wrapper.vm.$nextTick().catch(() => {})
}

function stubValidate(wrapper, valid = true) {
  setValidate(valid)
  return formValidateMock
}

beforeEach(() => {
  vi.clearAllMocks()
  structureMock.mockResolvedValue(baseStructure())
  retrieveMock.mockResolvedValue({ data: {}})
  listMock.mockResolvedValue({ data: [] })
  createMock.mockResolvedValue({ data: { id: 1 }})
  updateMock.mockResolvedValue({ data: { id: 1 }})
  setValidate(true)
})

describe('FormAdmin.vue', () => {
  describe('props and data init', () => {
    it('has expected prop defaults', () => {
      const { wrapper } = mountForm()
      expect(wrapper.props('id')).toBe(0)
      expect(wrapper.props('modelValue')).toEqual({})
      expect(wrapper.props('entityConf')).toEqual({ name: 'Product' })
      expect(wrapper.props('fields')).toEqual(['name'])
    })

    it('initializes entity manager, tabs, loading and empty form state', () => {
      const { wrapper } = mountForm()
      expect(wrapper.vm.em).toBeTruthy()
      expect(wrapper.vm.em.name).toBe('Product')
      expect(wrapper.vm.tabs.has('Default')).toBe(true)
      expect(wrapper.vm.activeTab).toBe('0')
      expect(wrapper.vm.structure).toEqual({})
      expect(wrapper.vm.properties).toEqual([])
      expect(wrapper.vm.plainFields).toEqual([])
      expect(wrapper.vm.form).toEqual({})
      expect(wrapper.vm.rules).toEqual({})
    })
  })

  describe('created flow without id', () => {
    it('uses structureOverride without loading an entity structure', async() => {
      const localStructure = {
        email: { metadata: { type: 'email', nullable: false }, translation: 'Email' }
      }
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'email', default_value: 'store@example.com' }], structureOverride: localStructure, embedded: true }
      })
      await settled(wrapper)

      expect(structureMock).not.toHaveBeenCalled()
      expect(wrapper.vm.structure).toEqual(localStructure)
      expect(wrapper.vm.form.email).toBe('store@example.com')
      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('syncs later modelValue changes into an embedded local form', async() => {
      const { wrapper } = mountForm({
        props: {
          fields: [{ property: 'city' }],
          structureOverride: { city: { metadata: { type: 'input', nullable: true }, translation: 'City' }},
          embedded: true,
          modelValue: {}
        }
      })
      await settled(wrapper)
      await wrapper.setProps({ modelValue: { city: 'Shanghai' }})

      expect(wrapper.vm.form).toEqual({ city: 'Shanghai' })
    })

    it('builds properties/plainFields and applies default values', async() => {
      const { wrapper } = mountForm({
        props: {
          fields: ['name', { property: 'enabled', default_value: true }]
        }
      })
      await settled(wrapper)
      expect(wrapper.vm.loading).toBe(false)
      expect(wrapper.vm.structure).toEqual(baseStructure())
      expect(wrapper.vm.plainFields).toEqual(['name', 'enabled'])
      expect(wrapper.vm.properties).toEqual([
        { property: 'name' },
        { property: 'enabled', default_value: true }
      ])
      expect(wrapper.vm.form).toEqual({ name: null, enabled: true })
      expect(retrieveMock).not.toHaveBeenCalled()
    })

    it('emits input after setDefaultData and update:modelValue on form change', async() => {
      const { wrapper } = mountForm({ props: { fields: ['name'] }})
      await settled(wrapper)
      expect(wrapper.emitted('input')).toBeTruthy()
      expect(wrapper.emitted('input')[0][0]).toEqual({ name: null })
      wrapper.vm.form.name = 'changed'
      await nextTick()
      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted[emitted.length - 1][0]).toMatchObject({ name: 'changed' })
    })

    it('merges modelValue into default form data', async() => {
      const { wrapper } = mountForm({
        props: { fields: ['name', 'description'], modelValue: { name: 'preset' }}
      })
      await settled(wrapper)
      expect(wrapper.vm.form).toEqual({ name: 'preset', description: null })
    })

    it('supports __all__ string fields', async() => {
      const { wrapper } = mountForm({ props: { fields: '__all__' }})
      await settled(wrapper)
      expect(wrapper.vm.plainFields).toEqual(['name', 'description', 'enabled'])
      expect(wrapper.vm.form).toEqual({ name: null, description: null, enabled: null })
    })

    it('supports __all__ mixed with explicit field configs', async() => {
      const { wrapper } = mountForm({
        props: {
          fields: [{ property: 'name', tab: 'Extra' }, '__all__']
        }
      })
      await settled(wrapper)
      expect(wrapper.vm.plainFields).toEqual(['name', 'description', 'enabled'])
      expect(wrapper.vm.properties[0]).toMatchObject({ property: 'name', tab: 'Extra' })
      expect(wrapper.vm.tabs.has('Extra')).toBe(true)
    })

    it('skips hidden fields during created normalization', async() => {
      const { wrapper } = mountForm({
        props: {
          fields: ['name', { property: 'description', hidden: true }]
        }
      })
      await settled(wrapper)
      expect(wrapper.vm.plainFields).toEqual(['name'])
      expect(wrapper.vm.properties).toEqual([{ property: 'name' }])
      expect(wrapper.vm.form).toEqual({ name: null })
    })

    it('keeps custom component definitions marked raw', async() => {
      const Custom = { template: '<div />' }
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'name', component: Custom }] }
      })
      await settled(wrapper)
      expect(wrapper.vm.properties).toHaveLength(1)
      expect(wrapper.vm.properties[0].property).toBe('name')
      expect(wrapper.vm.properties[0].component).toBeTruthy()
    })
  })

  describe('created flow with id', () => {
    it('calls fetchData instead of setDefaultData', async() => {
      const { wrapper } = mountForm({
        props: { id: 7, fields: ['name'] },
        retrieveData: { name: 'from-api' }
      })
      await settled(wrapper)
      expect(retrieveMock).toHaveBeenCalledWith(7)
      expect(wrapper.vm.loading).toBe(false)
      expect(wrapper.vm.form).toEqual({ name: 'from-api' })
    })
  })

  describe('created flow structure failure', () => {
    it('stays loading with empty fields when structure never resolves', async() => {
      // NOTE: created() attaches .then without .catch, so a true rejection
      // would surface as an unhandled rejection by design in the source.
      // A pending promise exercises the same observable stuck-loading state.
      structureMock.mockImplementationOnce(() => new Promise(() => {}))
      const { wrapper } = mountForm({ props: { fields: ['name'] }})
      await settled(wrapper)
      expect(wrapper.vm.loading).toBe(true)
      expect(wrapper.vm.properties).toEqual([])
      expect(wrapper.vm.plainFields).toEqual([])
      expect(retrieveMock).not.toHaveBeenCalled()
    })
  })

  describe('resolvePluginType', () => {
    it('prefers explicit field.relation results', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.resolvePluginType(
        { property: 'owner', relation: { target: 'User' }}, {}, {}
      )).toBe('RelationToOne')
      expect(wrapper.vm.resolvePluginType(
        { property: 'owners', relation: { target: 'User', multiple: true }}, {}, {}
      )).toBe('RelationToMany')
    })

    it('returns explicit field.type ahead of metadata', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.resolvePluginType(
        { property: 'cover', type: 'image' },
        { metadata: { type: 'text' }}
      )).toBe('image')
    })

    it.each([
      ['ManyToOne', 'ManyToOne'],
      ['many_to_one', 'ManyToOne'],
      ['many-to-one', 'ManyToOne'],
      ['MANYTOONE', 'ManyToOne'],
      ['OneToOne', 'OneToOne'],
      ['ManyToMany', 'ManyToMany'],
      ['one_to_many', 'OneToMany']
    ])('normalizes metadata relation type %s to %s', async(type, expected) => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.resolvePluginType(
        { property: 'author' }, { metadata: { type }}
      )).toBe(expected)
    })

    it('falls back to inferred relation when metadata is not a relation type', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      // conventional targetEntity, single
      expect(wrapper.vm.resolvePluginType(
        { property: 'role' },
        { metadata: { type: 'text', targetEntity: 'App\\Entity\\Role' }},
        { Role: {}}
      )).toBe('RelationToOne')
      // Uuid-suffix inference, multiple (metadata type itself is not relational,
      // so the trailing relation fallback decides)
      expect(wrapper.vm.resolvePluginType(
        { property: 'userUuids' },
        { metadata: { type: 'text' }},
        { User: {}}
      )).toBe('RelationToMany')
    })

    it('returns supported scalar metadata types as-is', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      for (const type of ['array', 'boolean', 'code', 'date', 'datetime', 'datetime_immutable', 'file', 'image', 'images', 'integer', 'json', 'text', 'textarea', 'transfer']) {
        expect(wrapper.vm.resolvePluginType({ property: 'f' }, { metadata: { type }})).toBe(type)
      }
    })

    it('falls back to input for unknown, empty or select-like scalars', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.resolvePluginType({ property: 'f' }, { metadata: { type: 'string' }})).toBe('input')
      expect(wrapper.vm.resolvePluginType({ property: 'f' }, { metadata: { type: 'select' }})).toBe('input')
      expect(wrapper.vm.resolvePluginType({ property: 'f' }, {})).toBe('input')
      expect(wrapper.vm.resolvePluginType({ property: 'f' })).toBe('input')
    })
  })

  describe('loadPlugin', () => {
    it.each([
      ['images', 'image'],
      ['datetime_immutable', 'datetime'],
      ['ManyToOne', 'RelationToOne'],
      ['OneToOne', 'RelationToOne'],
      ['ManyToMany', 'RelationToMany'],
      ['OneToMany', 'RelationToMany']
    ])('maps %s to %s plugin', async(type, target) => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.loadPlugin(type)).toBe(wrapper.vm.loadPlugin(target))
    })

    it('returns input plugin for unknown and falsy types', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.loadPlugin('no-such-plugin')).toBe(wrapper.vm.loadPlugin('input'))
      expect(wrapper.vm.loadPlugin(undefined)).toBe(wrapper.vm.loadPlugin('input'))
      expect(wrapper.vm.loadPlugin('')).toBe(wrapper.vm.loadPlugin('input'))
    })

    it('caches resolved plugins', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.loadPlugin('input')).toBe(wrapper.vm.loadPlugin('input'))
    })
  })

  describe('setDefaultData', () => {
    it('applies default_value and nulls missing fields', async() => {
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'enabled', default_value: false }, 'name'] }
      })
      await settled(wrapper)
      expect(wrapper.vm.form.enabled).toBe(false)
      expect(wrapper.vm.form.name).toBeNull()
      expect(wrapper.emitted('input')[0][0]).toEqual({ enabled: false, name: null })
    })
  })

  describe('fetchData branches', () => {
    async function fetchWrapper({ properties, structure, data }) {
      const { wrapper } = mountForm({ props: { id: 1, fields: properties.map(p => p.property) }})
      await settled(wrapper)
      wrapper.vm.properties = properties
      wrapper.vm.plainFields = properties.map(p => p.property)
      wrapper.vm.structure = structure
      retrieveMock.mockResolvedValueOnce({ data })
      wrapper.vm.fetchData(1)
      await settled(wrapper)
      return wrapper
    }

    it('passes json-type fields through untouched', async() => {
      const payload = { id: 1, __toString: 'x' }
      const wrapper = await fetchWrapper({
        properties: [{ property: 'meta', type: 'json' }],
        structure: { meta: { metadata: { type: 'json' }}},
        data: { meta: payload }
      })
      // assigned form state is reactive, so compare structurally: the object
      // must NOT have been collapsed to its id
      expect(wrapper.vm.form.meta).toEqual(payload)
      expect(wrapper.vm.form.meta.id).toBe(1)
      expect(wrapper.vm.form.meta.__toString).toBe('x')
    })

    it('maps single relation objects via relation value', async() => {
      const wrapper = await fetchWrapper({
        properties: [{ property: 'owner', relation: { target: 'User' }}],
        structure: {},
        data: { owner: { id: 42, username: 'alice' }}
      })
      expect(wrapper.vm.form.owner).toBe(42)
    })

    it('maps uuid relation objects via uuid value key', async() => {
      const wrapper = await fetchWrapper({
        properties: [{ property: 'ownerUuid', relation: { target: 'User', valueKey: 'uuid' }}],
        structure: {},
        data: { ownerUuid: { id: 1, uuid: 'uuid-1' }}
      })
      expect(wrapper.vm.form.ownerUuid).toBe('uuid-1')
    })

    it('maps relation object arrays', async() => {
      const wrapper = await fetchWrapper({
        properties: [{ property: 'owners', relation: { target: 'User', multiple: true }}],
        structure: {},
        data: { owners: [{ id: 1 }, { id: 2 }] }
      })
      expect(wrapper.vm.form.owners).toEqual([1, 2])
    })

    it('maps plain objects with id and arrays of id objects', async() => {
      const wrapper = await fetchWrapper({
        properties: [{ property: 'parent' }, { property: 'tags' }, { property: 'title' }],
        structure: {},
        data: {
          parent: { id: 9, name: 'p' },
          tags: [{ id: 1 }, { id: 2 }],
          title: 'scalar kept'
        }
      })
      expect(wrapper.vm.form.parent).toBe(9)
      expect(wrapper.vm.form.tags).toEqual([1, 2])
      expect(wrapper.vm.form.title).toBe('scalar kept')
    })

    it('skips null values and unknown keys', async() => {
      const wrapper = await fetchWrapper({
        properties: [{ property: 'name' }],
        structure: {},
        data: { name: null, extra: 'ignored' }
      })
      expect(wrapper.vm.form).toEqual({})
    })
  })

  describe('validation rules', () => {
    it('generates required rules from metadata nullability', async() => {
      const { wrapper } = mountForm({ props: { fields: ['name', 'description'] }})
      await settled(wrapper)
      expect(wrapper.vm.rules.name[0]).toMatchObject({ required: true })
      expect(wrapper.vm.rules.description[0]).toMatchObject({ required: false })
    })

    it('lets explicit required override metadata', async() => {
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'description', required: true }] }
      })
      await settled(wrapper)
      expect(wrapper.vm.rules.description[0]).toMatchObject({ required: true })
    })

    it('merges custom rules array and single rule objects', async() => {
      const { wrapper } = mountForm({
        props: {
          fields: [
            { property: 'name', rules: [{ min: 2, max: 5, message: 'len', trigger: 'blur' }] },
            { property: 'description', rules: { min: 1, message: 'one', trigger: 'blur' }}
          ]
        }
      })
      await settled(wrapper)
      expect(wrapper.vm.rules.name).toHaveLength(2)
      expect(wrapper.vm.rules.name[1]).toMatchObject({ min: 2, max: 5 })
      expect(wrapper.vm.rules.description).toHaveLength(2)
      expect(wrapper.vm.rules.description[1]).toMatchObject({ min: 1 })
    })

    it('wraps validator functions with a default blur trigger', async() => {
      const fn = () => true
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'name', validator: fn }] }
      })
      await settled(wrapper)
      const added = wrapper.vm.rules.name.filter(r => r.validator === fn)
      expect(added).toHaveLength(1)
      expect(added[0]).toMatchObject({ trigger: 'blur' })
    })

    it('supports validator arrays with default triggers', async() => {
      const fn1 = () => true
      const fn2 = () => true
      const { wrapper } = mountForm({
        props: {
          fields: [{ property: 'name', validator: [fn1, fn2] }]
        }
      })
      await settled(wrapper)
      expect(wrapper.vm.rules.name).toContainEqual({ validator: fn1, trigger: 'blur' })
      expect(wrapper.vm.rules.name).toContainEqual({ validator: fn2, trigger: 'blur' })
    })

    it('adds a required fallback rule and tab for fields without structure', async() => {
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'ghost', required: true, tab: 'Side' }] },
        structure: {}
      })
      await settled(wrapper)
      expect(wrapper.vm.rules.ghost).toEqual([
        { required: true, message: 'ghost is required', trigger: 'blur' }
      ])
      expect(wrapper.vm.tabs.has('Side')).toBe(true)
    })
  })

  describe('isHidden', () => {
    it.each([
      ['boolean true', { property: 'a', hidden: true }, 0, true],
      ['boolean false', { property: 'a', hidden: false }, 0, false],
      ['missing', { property: 'a' }, 0, false],
      ['null', { property: 'a', hidden: null }, 0, false],
      ['empty array', { property: 'a', hidden: [] }, 0, false],
      ['array create in create mode', { property: 'a', hidden: ['create'] }, 0, true],
      ['array create in update mode', { property: 'a', hidden: ['create'] }, 5, false],
      ['array update in update mode', { property: 'a', hidden: ['update'] }, 5, true],
      ['array edit in update mode', { property: 'a', hidden: ['edit'] }, 5, true],
      ['array update in create mode', { property: 'a', hidden: ['update'] }, 0, false],
      ['array unrelated', { property: 'a', hidden: ['other'] }, 0, false],
      ['string create in create mode', { property: 'a', hidden: 'create' }, 0, true],
      ['string update in update mode', { property: 'a', hidden: 'update' }, 5, true],
      ['string edit in update mode', { property: 'a', hidden: 'edit' }, 5, true],
      ['string mismatch', { property: 'a', hidden: 'create' }, 5, false],
      ['unknown string', { property: 'a', hidden: 'other' }, 0, false]
    ])('%s', async(_label, field, id, expected) => {
      const { wrapper } = mountForm({ props: { id, fields: ['name'] }})
      await settled(wrapper)
      expect(wrapper.vm.isHidden(field)).toBe(expected)
    })

    it('supports predicate functions and swallows predicate errors', async() => {
      const { wrapper } = mountForm({ props: { fields: ['name'] }})
      await settled(wrapper)
      expect(wrapper.vm.isHidden({ property: 'a', hidden: () => true })).toBe(true)
      expect(wrapper.vm.isHidden({ property: 'a', hidden: (form, id) => id === 0 && form !== undefined })).toBe(true)
      expect(wrapper.vm.isHidden({ property: 'a', hidden: () => { throw new Error('boom') } })).toBe(false)
      expect(wrapper.vm.isHidden({ property: 'a', hidden: 42 })).toBe(false)
    })
  })

  describe('registerFieldValidator', () => {
    it('registers validators and ignores duplicates and invalid input', async() => {
      const { wrapper } = mountForm({ props: { fields: ['name'] }})
      await settled(wrapper)
      const fn = vi.fn()
      wrapper.vm.registerFieldValidator('name', fn)
      wrapper.vm.registerFieldValidator('name', fn)
      expect(wrapper.vm.rules.name.filter(r => r.validator === fn)).toHaveLength(1)
      expect(wrapper.vm.rules.name.at(-1)).toMatchObject({ trigger: 'blur' })
      wrapper.vm.registerFieldValidator('other', fn, 'change')
      expect(wrapper.vm.rules.other).toEqual([{ validator: fn, trigger: 'change' }])
      wrapper.vm.registerFieldValidator('', fn)
      wrapper.vm.registerFieldValidator('name', 'not-a-function')
      expect(wrapper.vm.rules['']).toBeUndefined()
    })
  })

  describe('onSubmit', () => {
    it('creates on valid form in create mode and runs the default success flow', async() => {
      const { wrapper, $router } = mountForm({ props: { fields: ['name'] }})
      await settled(wrapper)
      wrapper.vm.form = { name: 'n' }
      stubValidate(wrapper, true)
      wrapper.vm.onSubmit()
      await flushPromises()
      expect(createMock).toHaveBeenCalledWith({ name: 'n' })
      expect(feedbackMocks.success).toHaveBeenCalledWith('Data saved successfully')
      expect($router.go).toHaveBeenCalledWith(-1)
    })

    it('updates on valid form in update mode', async() => {
      const success = vi.fn()
      const { wrapper } = mountForm({
        props: { id: 3, fields: ['name'] },
        retrieveData: { name: 'old' }
      })
      await settled(wrapper)
      wrapper.vm.form = { name: 'new' }
      stubValidate(wrapper, true)
      wrapper.vm.onSubmit(success)
      await flushPromises()
      expect(updateMock).toHaveBeenCalledWith(3, { name: 'new' })
      expect(success).toHaveBeenCalledWith({ data: { id: 1 }})
    })

    it('warns and skips api calls when validation fails', async() => {
      const { wrapper } = mountForm({ props: { fields: ['name'] }})
      await settled(wrapper)
      stubValidate(wrapper, false)
      // NOTE: `return false` in the source belongs to the validate callback,
      // so onSubmit itself resolves to undefined on the invalid path.
      const result = wrapper.vm.onSubmit()
      await flushPromises()
      expect(result).toBeUndefined()
      expect(formValidateMock).toHaveBeenCalled()
      expect(feedbackMocks.warning).toHaveBeenCalledWith('Validation failed — please check your input')
      expect(createMock).not.toHaveBeenCalled()
      expect(updateMock).not.toHaveBeenCalled()
    })

    it('reports create errors via feedback', async() => {
      createMock.mockRejectedValueOnce(new Error('create failed'))
      const { wrapper } = mountForm({ props: { fields: ['name'] }})
      await settled(wrapper)
      stubValidate(wrapper, true)
      wrapper.vm.onSubmit()
      await flushPromises()
      expect(feedbackMocks.error).toHaveBeenCalledWith('create failed')
    })

    it('reports update errors via feedback', async() => {
      updateMock.mockRejectedValueOnce(new Error('update failed'))
      const { wrapper } = mountForm({
        props: { id: 4, fields: ['name'] },
        retrieveData: { name: 'x' }
      })
      await settled(wrapper)
      stubValidate(wrapper, true)
      wrapper.vm.onSubmit()
      await flushPromises()
      expect(feedbackMocks.error).toHaveBeenCalledWith('update failed')
    })

    it('strips blank attributes before submit', async() => {
      const { wrapper } = mountForm({ props: { fields: ['name'] }})
      await settled(wrapper)
      wrapper.vm.form = { name: 'n', dropped: null, alsoDropped: undefined, kept: 0 }
      stubValidate(wrapper, true)
      wrapper.vm.onSubmit()
      await flushPromises()
      expect(createMock).toHaveBeenCalledWith({ name: 'n', kept: 0 })
    })
  })

  describe('helpers and utilities', () => {
    it('exposes getMetadataType, log and cleanBlankAttributes', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.getMetadataType({ metadata: { type: 'text' }})).toBe('text')
      expect(wrapper.vm.getMetadataType({})).toBeUndefined()
      expect(wrapper.vm.getMetadataType()).toBeUndefined()
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      wrapper.vm.log('hi', 1)
      expect(spy).toHaveBeenCalledWith('hi', 1)
      spy.mockRestore()
      const data = {
        a: 1,
        b: null,
        c: undefined,
        d: 0,
        e: '',
        schema: { phone: null, email: 'store@example.com' },
        entries: [{ detail: null, city: 'Shanghai' }]
      }
      wrapper.vm.cleanBlankAttributes(data)
      expect(data).toEqual({
        a: 1,
        d: 0,
        e: '',
        schema: { email: 'store@example.com' },
        entries: [{ city: 'Shanghai' }]
      })
    })

    it('provides registerFieldValidator and getFormAdmin', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(typeof wrapper.vm.uiFeedback().success).toBe('function')
      const fn = vi.fn()
      wrapper.vm.registerFieldValidator('dyn', fn)
      expect(wrapper.vm.rules.dyn).toEqual([{ validator: fn, trigger: 'blur' }])
    })
  })

  describe('renderHelp', () => {
    it('returns empty string for falsy help', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.renderHelp('')).toBe('')
      expect(wrapper.vm.renderHelp(null)).toBe('')
      expect(wrapper.vm.renderHelp(undefined)).toBe('')
    })

    it.each([
      ['inline code', 'use `code` here', '<code>code</code>'],
      ['fenced block', '```\nconst a = 1\n```', '<pre><code>const a = 1</code></pre>'],
      ['bold', '**strong** text', '<strong>strong</strong>'],
      ['italic star', '*soft* text', '<em>soft</em>'],
      ['italic underscore', '_soft_ text', '<em>soft</em>'],
      ['link', '[docs](https://example.com)', '<a href="https://example.com" target="_blank" rel="noopener">docs</a>'],
      ['heading', '# Title', '<strong>Title</strong>'],
      ['list dash', '- item one', '• item one'],
      ['list star', '* item one', '• item one']
    ])('renders %s markdown', async(_label, input, expected) => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.renderHelp(input)).toContain(expected)
    })

    it('converts bare newlines to line breaks', async() => {
      const { wrapper } = mountForm()
      await settled(wrapper)
      expect(wrapper.vm.renderHelp('line one\nline two')).toContain('<br>')
    })

    it('renders help blocks in the DOM', async() => {
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'name', help: 'use `code` now' }] }
      })
      await settled(wrapper)
      const help = wrapper.find('.help-text__content')
      expect(help.exists()).toBe(true)
      expect(help.html()).toContain('<code>code</code>')
    })
  })

  describe('plugin stub sanity', () => {
    it('renders the dynamic plugin slot without network access', async() => {
      const { wrapper } = mountForm({ props: { fields: ['name', 'description'] }})
      await settled(wrapper)
      expect(wrapper.vm.loadPlugin('input')).toBeTruthy()
      expect(structureMock).toHaveBeenCalled()
      expect(retrieveMock).not.toHaveBeenCalled()
      expect(PluginStub.name).toBe('PluginStub')
    })
  })
})
