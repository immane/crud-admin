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

vi.mock('@/configs/entities', () => ({ default: {} }))
vi.mock('@/components/Tinymce', () => ({
  default: { name: 'Tinymce', template: '<div class="tinymce-stub" />' }
}))
vi.mock('@/utils/request', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

import FormAdmin from '@/easyadmin/ui/vue/FormAdmin.vue'
import StoreContactSchema from '@/configs/collections/store/StoreContact.json'
import StoreAddressSchema from '@/configs/collections/store/StoreAddress.json'

const stubs = {
  'el-row': { template: '<div><slot /></div>' },
  'el-col': { template: '<div><slot /></div>' },
  'el-tabs': { template: '<div><slot /></div>' },
  'el-tab-pane': { template: '<div><slot /></div>' },
  'el-form': { template: '<div><slot /></div>', methods: { validate: cb => cb(true) } },
  'el-form-item': { template: '<div><slot /></div>' },
  'el-button': { template: '<button><slot /></button>' },
  'el-icon': { template: '<span><slot /></span>' },
  'el-icon-info': { template: '<span />' },
  'el-input': { template: '<input />' },
  'el-select': { template: '<div><slot /></div>' },
  'el-option': { template: '<div />' },
  'el-date-picker': { template: '<div />' },
  'el-switch': { template: '<div />' }
}

function mountStoreForm(props = {}) {
  return mount(FormAdmin, {
    props: {
      entityConf: { name: 'Store' },
      id: 0,
      fields: [
        { property: 'contact', type: 'json_schema', type_options: { schema: StoreContactSchema } },
        { property: 'address', type: 'json_schema', type_options: { schema: StoreAddressSchema } }
      ],
      ...props
    },
    global: {
      mocks: {
        $t: key => key,
        $route: { meta: { title: 'Store' } },
        $router: { go: vi.fn() },
        $message: { error: vi.fn() }
      },
      directives: { loading: {} },
      stubs
    }
  })
}

async function settle(wrapper, rounds = 8) {
  for (let i = 0; i < rounds; i++) {
    await flushPromises()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    const nested = wrapper.findAllComponents({ name: 'FormAdmin' })
    if (nested.length >= 2 && nested.every(n => (n.vm.properties || []).length > 0)) {
      const address = nested.find(n => (n.props('fields') || []).some(f => f.property === 'province'))
      if (address && Object.keys(address.vm.form || {}).length >= 13) break
    }
  }
  await flushPromises()
  await nextTick()
}

beforeEach(() => {
  vi.clearAllMocks()
  structureMock.mockResolvedValue({})
  retrieveMock.mockResolvedValue({ data: {} })
})

describe('form with two json_schema fields', () => {
  it('populates both nested forms on create without recursive updates', async () => {
    const onError = vi.fn()
    const wrapper = mountStoreForm()
    // Surface unexpected Vue errors (e.g. recursive updates) as test failures.
    wrapper.vm.$.appContext.config.errorHandler = onError
    await settle(wrapper)

    const nested = wrapper.findAllComponents({ name: 'FormAdmin' })
    expect(nested).toHaveLength(2)

    const contact = nested.find(n => (n.props('fields') || []).some(f => f.property === 'phone'))
    const address = nested.find(n => (n.props('fields') || []).some(f => f.property === 'province'))
    expect(contact).toBeTruthy()
    expect(address).toBeTruthy()
    expect(Object.keys(contact.vm.form)).toEqual(
      expect.arrayContaining(['phone', 'email', 'managerName', 'tags'])
    )
    // Second schema must render all of its fields, not an empty object.
    expect(Object.keys(address.vm.form)).toHaveLength(13)
    expect(address.vm.properties).toHaveLength(13)
    expect(wrapper.vm.form.contact).toMatchObject({ tags: [] })
    expect(wrapper.vm.form.address).toMatchObject({ province: null, city: null })
    expect(onError).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
