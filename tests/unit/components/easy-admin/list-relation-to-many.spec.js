import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElTag, ElTooltip } from 'element-plus'
import RelationToMany from '@/components/EasyAdmin/plugins/list/RelationToMany.vue'
import { loadRelationRecords } from '@/utils/relation'

vi.mock('@/utils/entity', () => ({ default: class { async list() { return [] } } }))
vi.mock('@/configs/entities', () => ({ default: {} }))
vi.mock('@/utils/relation', async (importOriginal) => {
  const mod = await importOriginal()
  return { ...mod, loadRelationRecords: vi.fn(async () => []) }
})

const RouterLinkStub = {
  props: ['to'],
  template: '<a class="stub-router-link"><slot /></a>'
}

const idField = { property: 'tagUuids', relation: { target: 'Tag', valueKey: 'id' } }
const uuidField = { property: 'tagUuids', relation: { target: 'Tag', valueKey: 'uuid' } }

function mountCell({ value = [], field = idField, hasRoute = true } = {}) {
  const hasRouteFn = vi.fn(() => hasRoute)
  const wrapper = mount(RelationToMany, {
    props: { value, field, scope: {}, em: {}, struct: {} },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key, $router: { hasRoute: hasRouteFn } },
      stubs: { 'router-link': RouterLinkStub }
    }
  })
  return { wrapper, hasRouteFn }
}

describe('list/RelationToMany.vue', () => {
  beforeEach(() => {
    vi.mocked(loadRelationRecords).mockReset()
    vi.mocked(loadRelationRecords).mockResolvedValue([])
  })

  it('renders one tag per object record', () => {
    const { wrapper } = mountCell({ value: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] })
    const tags = wrapper.findAllComponents(ElTag)
    expect(tags).toHaveLength(2)
    expect(tags.map((t) => t.text())).toEqual(['A', 'B'])
  })

  it('wraps tags in router links when the detail route exists', () => {
    const { wrapper, hasRouteFn } = mountCell({ value: [{ id: 1, name: 'A' }], hasRoute: true })
    expect(wrapper.find('.stub-router-link').exists()).toBe(true)
    expect(wrapper.vm.detailRoute({ id: 1, name: 'A' })).toEqual({ name: 'TagDetail', params: { id: 1 } })
    expect(hasRouteFn).toHaveBeenCalledWith('TagDetail')
  })

  it('renders plain tags when the detail route is missing', () => {
    const { wrapper } = mountCell({ value: [{ id: 1, name: 'A' }], hasRoute: false })
    expect(wrapper.find('.stub-router-link').exists()).toBe(false)
    expect(wrapper.findComponent(ElTag).text()).toBe('A')
    expect(wrapper.vm.detailRoute({ id: 1, name: 'A' })).toBeNull()
  })

  it('renders nothing for empty or non-array values', () => {
    for (const value of [[], null, undefined, 'nope']) {
      const { wrapper } = mountCell({ value })
      expect(wrapper.findAllComponents(ElTag)).toHaveLength(0)
      expect(wrapper.vm.visibleItems).toEqual([])
      expect(wrapper.vm.overflowCount).toBe(0)
    }
  })

  it('renders primitive id values as their raw text', () => {
    const { wrapper } = mountCell({ value: [7, 8] })
    expect(wrapper.findAllComponents(ElTag).map((t) => t.text())).toEqual(['7', '8'])
    expect(wrapper.find('.stub-router-link').exists()).toBe(false)
  })

  it('limits visible tags to five with an overflow tooltip', () => {
    const value = [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id, name: `N${id}` }))
    const { wrapper } = mountCell({ value })
    expect(wrapper.vm.visibleItems).toHaveLength(5)
    expect(wrapper.vm.overflowCount).toBe(2)
    expect(wrapper.findComponent(ElTooltip).exists()).toBe(true)
    expect(wrapper.text()).toContain('...')
  })

  it('shows no tooltip at exactly five items', () => {
    const value = [1, 2, 3, 4, 5].map((id) => ({ id, name: `N${id}` }))
    const { wrapper } = mountCell({ value })
    expect(wrapper.vm.overflowCount).toBe(0)
    expect(wrapper.findComponent(ElTooltip).exists()).toBe(false)
  })

  it('resolves uuid strings through loadRelationRecords', async () => {
    vi.mocked(loadRelationRecords).mockResolvedValue([
      { uuid: 'u-1', name: 'One' },
      { uuid: 'u-2', name: 'Two' }
    ])
    const { wrapper } = mountCell({ value: ['u-1', 'u-2'], field: uuidField, hasRoute: true })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(loadRelationRecords).toHaveBeenCalled()
    const tags = wrapper.findAllComponents(ElTag)
    expect(tags.map((t) => t.text())).toEqual(['One', 'Two'])
    expect(wrapper.findAll('.stub-router-link')).toHaveLength(2)
  })

  it('falls back to raw text for unresolved uuid strings', async () => {
    vi.mocked(loadRelationRecords).mockResolvedValue([])
    const { wrapper } = mountCell({ value: ['ghost'], field: uuidField })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ElTag).text()).toBe('ghost')
    expect(wrapper.find('.stub-router-link').exists()).toBe(false)
  })

  it('skips loading when there are no string values', async () => {
    mountCell({ value: [{ id: 1, name: 'A' }], field: uuidField })
    await flushPromises()
    // objects only: uuid filter is empty so no fetch happens
    expect(loadRelationRecords).not.toHaveBeenCalled()
  })

  it('yields no route for items without identifiers', () => {
    const { wrapper } = mountCell({ value: [{ name: 'Ghost' }] })
    expect(wrapper.vm.detailRoute({ name: 'Ghost' })).toBeNull()
    expect(wrapper.find('.stub-router-link').exists()).toBe(false)
  })
})
