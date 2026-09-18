import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

const { structureMock, retrieveMock } = vi.hoisted(() => ({
  structureMock: vi.fn(),
  retrieveMock: vi.fn()
}))

vi.mock('@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter', () => {
  class EntityManageMock {
    constructor(conf) {
      this.conf = conf
      this.name = typeof conf === 'string' ? conf : (conf && conf.name) || null
      this.prefix = '/api'
      this.plural = 'mocks'
    }
    structure() { return structureMock() }
    retrieve(id) { return retrieveMock(id) }
    create(data) { return Promise.resolve({ data }) }
    update(id, data) { return Promise.resolve({ data }) }
  }
  return { default: EntityManageMock }
})

vi.mock('@/configs/entities', () => ({ default: {}}))
vi.mock('@/components/Tinymce', () => ({
  default: { name: 'Tinymce', template: '<div class="tinymce-stub" />' }
}))
vi.mock('@/utils/request', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

import FormAdmin from '@/easyadmin/ui/vue/FormAdmin.vue'
import StoreContactSchema from '@/configs/collections/store/StoreContact.json'

const localStructure = {
  name: { metadata: { type: 'text', nullable: false }, translation: 'Name' }
}

const stubs = {
  'el-row': { template: '<div><slot /></div>' },
  'el-col': { template: '<div><slot /></div>' },
  'el-tabs': { template: '<div><slot /></div>' },
  'el-tab-pane': { template: '<div><slot /></div>' },
  'el-form': { template: '<div><slot /></div>', methods: { validate: cb => cb(true) }},
  'el-form-item': { template: '<div><slot /></div>' },
  'el-button': { template: '<button><slot /></button>' },
  'el-icon': { template: '<span><slot /></span>' },
  'el-icon-info': { template: '<span />' },
  'el-input': { template: '<input />' },
  'el-input-number': { template: '<input />' },
  'el-select': { template: '<div><slot /></div>' },
  'el-option': { template: '<div />' },
  'el-date-picker': { template: '<div />' },
  'el-switch': { template: '<div />' }
}

function mountForm({ props = {}, provide } = {}) {
  return mount(FormAdmin, {
    props: {
      entityConf: { name: 'Product' },
      fields: ['name'],
      structureOverride: localStructure,
      embedded: true,
      ...props
    },
    global: {
      ...(provide !== undefined ? { provide } : {}),
      mocks: {
        $t: key => key,
        $route: { meta: { title: 'Product' }},
        $router: { go: vi.fn() },
        $message: { error: vi.fn() }
      },
      directives: { loading: {}},
      stubs
    }
  })
}

async function settled(wrapper) {
  await flushPromises()
  await nextTick()
  await wrapper.vm.$nextTick().catch(() => {})
}

beforeEach(() => {
  vi.clearAllMocks()
  structureMock.mockResolvedValue({})
  retrieveMock.mockResolvedValue({ data: {}})
})

describe('form nesting depth guard', () => {
  it('treats a top-level form as depth 1 and renders normally', async() => {
    const wrapper = mountForm()
    await settled(wrapper)

    expect(wrapper.vm.nestingDepth).toBe(1)
    expect(wrapper.vm.nestingLimitExceeded).toBe(false)
    expect(wrapper.find('.form-nesting-guard').exists()).toBe(false)
    expect(wrapper.vm.form).toEqual({ name: null })
    wrapper.unmount()
  })

  it('counts depth through a provided ancestor', async() => {
    const wrapper = mountForm({ provide: { easyadminFormDepth: 7 }})
    await settled(wrapper)

    expect(wrapper.vm.nestingDepth).toBe(8)
    expect(wrapper.vm.nestingLimitExceeded).toBe(false)
    expect(wrapper.find('.form-nesting-guard').exists()).toBe(false)
    wrapper.unmount()
  })

  it('still renders at exactly the maximum depth', async() => {
    const wrapper = mountForm({ provide: { easyadminFormDepth: 9 }})
    await settled(wrapper)

    expect(wrapper.vm.nestingDepth).toBe(10)
    expect(wrapper.find('.form-nesting-guard').exists()).toBe(false)
    expect(wrapper.vm.form).toEqual({ name: null })
    wrapper.unmount()
  })

  it('renders a placeholder without fetching structure past the limit', async() => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mountForm({ provide: { easyadminFormDepth: 10 }})
    await settled(wrapper)

    expect(wrapper.vm.nestingDepth).toBe(11)
    expect(wrapper.vm.nestingLimitExceeded).toBe(true)
    expect(wrapper.find('.form-nesting-guard').exists()).toBe(true)
    expect(wrapper.find('.form-nesting-guard').text()).toContain('circular form references')
    expect(structureMock).not.toHaveBeenCalled()
    expect(retrieveMock).not.toHaveBeenCalled()
    expect(wrapper.vm.properties).toEqual([])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nesting depth 11'))
    warn.mockRestore()
    wrapper.unmount()
  })

  it('increments depth through a real nested json_schema plugin', async() => {
    const wrapper = mount(FormAdmin, {
      props: {
        entityConf: { name: 'Store' },
        id: 0,
        fields: [
          { property: 'contact', type: 'json_schema', type_options: { schema: StoreContactSchema }}
        ]
      },
      global: {
        mocks: {
          $t: key => key,
          $route: { meta: { title: 'Store' }},
          $router: { go: vi.fn() },
          $message: { error: vi.fn() }
        },
        directives: { loading: {}},
        stubs
      }
    })
    for (let i = 0; i < 10; i++) {
      await flushPromises()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      const nested = wrapper.findAllComponents({ name: 'FormAdmin' })
      if (nested.length >= 1 && (nested[0].vm.properties || []).length > 0) break
    }
    await flushPromises()
    await nextTick()

    expect(wrapper.vm.nestingDepth).toBe(1)
    const nested = wrapper.findAllComponents({ name: 'FormAdmin' })
    expect(nested.length).toBeGreaterThanOrEqual(1)
    expect(nested[0].vm.nestingDepth).toBe(2)
    expect(nested[0].vm.nestingLimitExceeded).toBe(false)
    wrapper.unmount()
  })
})
