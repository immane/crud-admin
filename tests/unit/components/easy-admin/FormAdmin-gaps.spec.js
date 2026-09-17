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
  default: { Role: {}, User: {}, Store: {} }
}))

vi.mock('@/components/Tinymce', () => ({
  default: { name: 'Tinymce', template: '<div class="tinymce-stub" />' }
}))

vi.mock('@/easyadmin/ui/vue/feedback', () => ({
  createUiFeedback: () => feedbackMocks
}))

vi.mock('@/utils/request', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

import FormAdmin from '@/components/EasyAdmin/FormAdmin.vue'

const formValidateMock = vi.fn(cb => cb(true))

function mountForm({ props = {}, structure, retrieveData } = {}) {
  if (structure !== undefined) structureMock.mockResolvedValue(structure)
  if (retrieveData !== undefined) retrieveMock.mockResolvedValue({ data: retrieveData })
  const $router = { go: vi.fn(), replace: vi.fn() }
  const wrapper = mount(FormAdmin, {
    props: { entityConf: { name: 'Product' }, fields: ['name'], ...props },
    global: {
      mocks: {
        $t: key => key,
        $route: { meta: { title: 'Product' } },
        $router,
        $message: { error: vi.fn() },
        $loading: vi.fn(() => ({ close: vi.fn() }))
      },
      directives: { loading: {} },
      stubs: {
        'el-row': { template: '<div><slot /></div>' },
        'el-col': { template: '<div><slot /></div>' },
        'el-tabs': { template: '<div><slot /></div>' },
        'el-tab-pane': { template: '<div><slot /></div>' },
        'el-form': { template: '<div><slot /></div>', methods: { validate: formValidateMock } },
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

const baseStructure = () => ({
  name: { metadata: { type: 'text', nullable: false }, translation: 'Name' },
  description: { metadata: { type: 'textarea', nullable: true }, translation: 'Description' },
  enabled: { metadata: { type: 'boolean', nullable: true }, translation: 'Enabled' }
})

beforeEach(() => {
  vi.clearAllMocks()
  structureMock.mockResolvedValue(baseStructure())
  retrieveMock.mockResolvedValue({ data: {} })
  listMock.mockResolvedValue({ data: [] })
  createMock.mockResolvedValue({ data: { id: 1 } })
  updateMock.mockResolvedValue({ data: { id: 1 } })
  formValidateMock.mockReset()
  formValidateMock.mockImplementation(cb => cb(true))
})

describe('FormAdmin.vue gaps', () => {
  describe('fields prop default (lines 179-207)', () => {
    it('invokes the documented fields default factory', () => {
      const fields = FormAdmin.props.fields.default()
      // the default body only documents the field DSL in comments:
      // the runtime default is an empty array
      expect(fields).toEqual([])
    })

    it('invokes the remaining prop default factories', () => {
      expect(FormAdmin.props.modelValue.default()).toEqual({})
      expect(FormAdmin.props.id.default()).toBe(0)
      // entityConf/modelValue defaults return fresh values by design
      expect(FormAdmin.props.entityConf.default).toBeDefined()
    })
  })

  describe('customRules merge branches (lines 324, 327)', () => {
    it('appends custom rules when metadata rules already exist (line 324 false side)', async () => {
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'name', rules: [{ min: 2, max: 5, message: 'len', trigger: 'blur' }] }] }
      })
      await settled(wrapper)
      // base required rule from metadata + the custom rule
      expect(wrapper.vm.rules.name).toHaveLength(2)
      expect(wrapper.vm.rules.name[0]).toMatchObject({ required: true })
      expect(wrapper.vm.rules.name[1]).toMatchObject({ min: 2, max: 5 })
    })

    it('creates the rules array when no metadata rules exist (line 324 true side)', async () => {
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'ghost', rules: [{ min: 1, message: 'one', trigger: 'blur' }] }] },
        structure: {}
      })
      await settled(wrapper)
      expect(wrapper.vm.rules.ghost).toEqual([{ min: 1, message: 'one', trigger: 'blur' }])
    })

    it('adds a blur trigger to validator rules without one (line 327 true side)', async () => {
      const fn = () => true
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'name', rules: [{ validator: fn }] }] }
      })
      await settled(wrapper)
      expect(wrapper.vm.rules.name).toContainEqual({ validator: fn, trigger: 'blur' })
    })

    it('keeps explicit triggers on validator rules (line 327 false side)', async () => {
      const fn = () => true
      const { wrapper } = mountForm({
        props: { fields: [{ property: 'description', rules: [{ validator: fn, trigger: 'change' }] }] }
      })
      await settled(wrapper)
      expect(wrapper.vm.rules.description).toContainEqual({ validator: fn, trigger: 'change' })
      expect(wrapper.vm.rules.description).not.toContainEqual({ validator: fn, trigger: 'blur' })
    })
  })

  describe('fetchData branches (lines 484, 500-502)', () => {
    it('falls back to a bare property when plainFields outlive properties (line 484)', async () => {
      const { wrapper } = mountForm({ props: { id: 1, fields: ['name'] } })
      await settled(wrapper)
      wrapper.vm.plainFields = ['name', 'ghost']
      wrapper.vm.properties = [{ property: 'name' }]
      wrapper.vm.structure = {}
      retrieveMock.mockResolvedValueOnce({ data: { name: 'n', ghost: 'g' } })
      wrapper.vm.fetchData(1)
      await settled(wrapper)
      expect(wrapper.vm.form).toEqual({ name: 'n', ghost: 'g' })
    })

    it('swallows mapping errors for id-object arrays (lines 500-502)', async () => {
      const evil = {}
      Object.defineProperty(evil, 'id', {
        enumerable: true,
        configurable: true,
        get() { throw new Error('boom') }
      })
      const { wrapper } = mountForm({ props: { id: 1, fields: ['tags'] } })
      await settled(wrapper)
      wrapper.vm.properties = [{ property: 'tags' }]
      wrapper.vm.plainFields = ['tags']
      wrapper.vm.structure = {}
      retrieveMock.mockResolvedValueOnce({ data: { tags: [evil] } })
      wrapper.vm.fetchData(1)
      await settled(wrapper)
      // the throwing mapping is caught: the key is left unset, no rejection escapes
      expect('tags' in wrapper.vm.form).toBe(false)
      expect(wrapper.vm.form).toEqual({})
    })
  })
})
