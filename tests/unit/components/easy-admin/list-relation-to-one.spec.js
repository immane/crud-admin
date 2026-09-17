import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import RelationToOne from '@/easyadmin/ui/vue/plugins/list/RelationToOne.vue'
import { loadRelationRecords } from '@/utils/relation'

vi.mock('@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter', () => ({ default: class { async list() { return [] } } }))
vi.mock('@/configs/entities', () => ({ default: {} }))
vi.mock('@/utils/relation', async (importOriginal) => {
  const mod = await importOriginal()
  return { ...mod, loadRelationRecords: vi.fn(async () => []) }
})

const RouterLinkStub = {
  props: ['to'],
  template: '<a class="stub-router-link"><slot /></a>'
}

function mountCell({ value = null, field = { property: 'authorUuid', relation: { target: 'Author', valueKey: 'id' } }, hasRoute = true } = {}) {
  const hasRouteFn = vi.fn(() => hasRoute)
  const wrapper = mount(RelationToOne, {
    props: { value, field, scope: {}, em: {}, struct: {} },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key, $router: { hasRoute: hasRouteFn } },
      stubs: { 'router-link': RouterLinkStub }
    }
  })
  return { wrapper, hasRouteFn }
}

describe('list/RelationToOne.vue', () => {
  beforeEach(() => {
    vi.mocked(loadRelationRecords).mockReset()
    vi.mocked(loadRelationRecords).mockResolvedValue([])
  })

  it('renders empty span for null values with no link', () => {
    const { wrapper } = mountCell({ value: null })
    expect(wrapper.find('span').exists()).toBe(true)
    expect(wrapper.find('.stub-router-link').exists()).toBe(false)
    expect(wrapper.vm.displayValue).toBe('')
  })

  it('renders empty string and undefined values as blank', () => {
    expect(mountCell({ value: '' }).wrapper.vm.displayValue).toBe('')
    expect(mountCell({ value: undefined }).wrapper.vm.displayValue).toBe('')
  })

  it('renders raw primitive id values as plain text without a link', () => {
    const { wrapper } = mountCell({ value: 42 })
    expect(wrapper.vm.displayValue).toBe('42')
    expect(wrapper.text()).toBe('42')
    expect(wrapper.find('.stub-router-link').exists()).toBe(false)
    expect(wrapper.vm.detailRoute).toBeNull()
  })

  it('renders object records as links when the detail route exists', () => {
    const { wrapper, hasRouteFn } = mountCell({ value: { id: 3, name: 'Ada' }, hasRoute: true })
    expect(wrapper.vm.displayValue).toBe('Ada')
    const link = wrapper.find('.stub-router-link')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Ada')
    expect(wrapper.vm.detailRoute).toEqual({ name: 'AuthorDetail', params: { id: 3 } })
    expect(hasRouteFn).toHaveBeenCalledWith('AuthorDetail')
  })

  it('renders plain span when the detail route is missing', () => {
    const { wrapper } = mountCell({ value: { id: 3, name: 'Ada' }, hasRoute: false })
    expect(wrapper.vm.detailRoute).toBeNull()
    expect(wrapper.find('.stub-router-link').exists()).toBe(false)
    expect(wrapper.find('span').text()).toBe('Ada')
  })

  it('prefers __toString, then title/username fallbacks for labels', () => {
    expect(mountCell({ value: { id: 1, __toString: 'Pretty' } }).wrapper.vm.displayValue).toBe('Pretty')
    expect(mountCell({ value: { id: 1, title: 'Titled' } }).wrapper.vm.displayValue).toBe('Titled')
    expect(mountCell({ value: { id: 1, username: 'uname' } }).wrapper.vm.displayValue).toBe('uname')
  })

  it('yields no detail route for records without identifiers', () => {
    const { wrapper } = mountCell({ value: { name: 'Ghost' } })
    expect(wrapper.vm.detailRoute).toBeNull()
    expect(wrapper.find('.stub-router-link').exists()).toBe(false)
    expect(wrapper.text()).toBe('Ghost')
  })

  it('resolves uuid string values through loadRelationRecords', async () => {
    vi.mocked(loadRelationRecords).mockResolvedValue([{ uuid: 'u-1', name: 'Bob' }])
    const field = { property: 'authorUuid', relation: { target: 'Author', valueKey: 'uuid' } }
    const { wrapper } = mountCell({ value: 'u-1', field, hasRoute: true })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(loadRelationRecords).toHaveBeenCalled()
    expect(wrapper.vm.displayValue).toBe('Bob')
    expect(wrapper.vm.detailRoute).toEqual({ name: 'AuthorDetail', params: { id: 'u-1' } })
    expect(wrapper.find('.stub-router-link').text()).toBe('Bob')
  })

  it('falls back to the raw uuid when no record matches', async () => {
    vi.mocked(loadRelationRecords).mockResolvedValue([{ uuid: 'other', name: 'X' }])
    const field = { property: 'authorUuid', relation: { target: 'Author', valueKey: 'uuid' } }
    const { wrapper } = mountCell({ value: 'unknown-uuid', field, hasRoute: true })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.displayValue).toBe('unknown-uuid')
    expect(wrapper.vm.detailRoute).toBeNull()
    expect(wrapper.find('.stub-router-link').exists()).toBe(false)
  })

  it('skips record loading for empty uuid strings', async () => {
    const field = { property: 'authorUuid', relation: { target: 'Author', valueKey: 'uuid' } }
    mountCell({ value: '', field })
    await flushPromises()
    expect(loadRelationRecords).not.toHaveBeenCalled()
  })

  it('re-resolves when the value prop changes', async () => {
    vi.mocked(loadRelationRecords).mockResolvedValue([{ uuid: 'u-2', name: 'Zed' }])
    const field = { property: 'authorUuid', relation: { target: 'Author', valueKey: 'uuid' } }
    const { wrapper } = mountCell({ value: 'u-1', field })
    await flushPromises()
    const calls = vi.mocked(loadRelationRecords).mock.calls.length
    await wrapper.setProps({ value: 'u-2' })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(vi.mocked(loadRelationRecords).mock.calls.length).toBeGreaterThan(calls)
    expect(wrapper.vm.displayValue).toBe('Zed')
  })
})
