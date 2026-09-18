import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import RelationToMany from '@/easyadmin/ui/vue/plugins/list/RelationToMany.vue'
import { loadRelationRecords } from '@/utils/relation'

vi.mock('@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter', () => ({ default: class { async list() { return [] } } }))
vi.mock('@/configs/entities', () => ({ default: {}}))
vi.mock('@/utils/relation', async(importOriginal) => {
  const mod = await importOriginal()
  return { ...mod, loadRelationRecords: vi.fn(async() => []) }
})

const RouterLinkStub = {
  props: ['to'],
  template: '<a class="stub-router-link"><slot /></a>'
}

const uuidField = { property: 'tagUuids', relation: { target: 'Tag', valueKey: 'uuid' }}
const idField = { property: 'tagUuids', relation: { target: 'Tag', valueKey: 'id' }}

function mountCell({ value = [], field = idField, hasRoute = true } = {}) {
  return mount(RelationToMany, {
    props: { value, field, scope: {}, em: {}, struct: {}},
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key, $router: { hasRoute: () => hasRoute }},
      stubs: { 'router-link': RouterLinkStub }
    }
  })
}

describe('list/RelationToMany.vue gaps', () => {
  beforeEach(() => {
    vi.mocked(loadRelationRecords).mockReset()
    vi.mocked(loadRelationRecords).mockResolvedValue([])
  })

  it('covers value watcher (lines 65-66) on non-uuid field', async() => {
    const wrapper = mountCell({ value: [{ id: 1, name: 'A' }], field: idField })
    await flushPromises()
    expect(loadRelationRecords).not.toHaveBeenCalled()
    await wrapper.setProps({ value: [{ id: 2, name: 'B' }] })
    await flushPromises()
    await wrapper.vm.$nextTick()
    // watcher fired resolveRecords; non-uuid relation short-circuits so still no fetch
    expect(wrapper.vm.visibleItems).toEqual([{ id: 2, name: 'B' }])
  })

  it('covers value watcher with uuid strings triggering a reload', async() => {
    vi.mocked(loadRelationRecords).mockResolvedValue([
      { uuid: 'u-1', name: 'One' },
      { uuid: 'u-2', name: 'Two' }
    ])
    const wrapper = mountCell({ value: ['u-1'], field: uuidField })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(loadRelationRecords).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ value: ['u-1', 'u-2'] })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(loadRelationRecords).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.resolvedRecords).toHaveLength(2)
  })
})
