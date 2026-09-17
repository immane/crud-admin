import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElTransfer } from 'element-plus'
import TransferField from '@/components/EasyAdmin/plugins/form/transfer.vue'
import RelationToMany from '@/components/EasyAdmin/plugins/form/RelationToMany.vue'

const { listMock, loadMock, constructed } = vi.hoisted(() => ({
  listMock: vi.fn(),
  loadMock: vi.fn(),
  constructed: []
}))

vi.mock('@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter', () => ({
  default: class EntityManageMock {
    constructor(conf) {
      this.conf = conf
      constructed.push(conf)
    }

    list(filter) {
      return listMock(filter)
    }
  }
}))

vi.mock('@/configs/entities', () => ({
  default: { Tag: {}, User: {} }
}))

vi.mock('@/utils/relation', async(importOriginal) => {
  const mod = await importOriginal()
  return { ...mod, loadRelationRecords: (...args) => loadMock(...args) }
})

const tagsField = () => ({ property: 'tags', relation: { entity: 'Tag', valueKey: 'id' } })

function mountTransfer({ form, field = tagsField() } = {}) {
  return mount(TransferField, {
    props: { form: form ?? {}, field, struct: {}, emPrefix: '' },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key }
    }
  })
}

describe('form/transfer.vue', () => {
  beforeEach(() => {
    listMock.mockReset()
    loadMock.mockReset()
    constructed.length = 0
    listMock.mockResolvedValue({ data: [] })
    loadMock.mockResolvedValue([])
  })

  it('extends RelationToMany', () => {
    expect(TransferField.extends).toBe(RelationToMany)
  })

  it('normalizes a missing value to an empty array on created', async() => {
    const form = {}
    mountTransfer({ form })
    await flushPromises()

    expect(form.tags).toEqual([])
  })

  it('maps fetched records into transfer data with value/label keys', async() => {
    listMock.mockResolvedValue({
      data: [
        { id: 1, __toString: 'Red' },
        { id: 2, __toString: 'Blue' }
      ]
    })
    const form = { tags: [] }
    const wrapper = mountTransfer({ form })
    await flushPromises()

    expect(wrapper.vm.options).toEqual([
      { value: 1, label: 'Red' },
      { value: 2, label: 'Blue' }
    ])

    const transfer = wrapper.findComponent(ElTransfer)
    expect(transfer.exists()).toBe(true)
    expect(transfer.props('data')).toEqual(wrapper.vm.options)
    expect(transfer.props('props')).toEqual({ key: 'value', label: 'label' })
    expect(transfer.props('modelValue')).toEqual([])
    expect(transfer.props('filterable')).toBe(true)
    expect(transfer.props('titles')).toEqual(['Available', 'Selected'])
    expect(constructed[0]).toMatchObject({ name: 'Tag' })
  })

  it('keeps selected placeholders inside transfer data', async() => {
    const form = { tags: [7] }
    const wrapper = mountTransfer({ form })
    await flushPromises()

    expect(wrapper.findComponent(ElTransfer).props('data')).toContainEqual({ value: 7, label: '7' })
  })

  it('writes transfer changes back to form[field.property]', async() => {
    listMock.mockResolvedValue({ data: [{ id: 1, __toString: 'Red' }] })
    const form = { tags: [] }
    const wrapper = mountTransfer({ form })
    await flushPromises()

    await wrapper.findComponent(ElTransfer).vm.$emit('update:modelValue', [1])
    expect(form.tags).toEqual([1])
  })

  it('adds late-arriving edit values through the watcher', async() => {
    const wrapper = mountTransfer({ form: { tags: [] } })
    await flushPromises()
    expect(wrapper.findComponent(ElTransfer).props('data')).toEqual([])

    await wrapper.setProps({ form: { tags: [21] } })
    await flushPromises()

    expect(wrapper.findComponent(ElTransfer).props('data')).toContainEqual({ value: 21, label: '21' })
  })

  it('skips preload when type_options.remote is true and searches remotely', async() => {
    const wrapper = mountTransfer({
      form: {},
      field: { property: 'tags', relation: { entity: 'Tag', valueKey: 'id' }, type_options: { remote: true } }
    })
    await flushPromises()
    expect(listMock).not.toHaveBeenCalled()

    listMock.mockResolvedValue({ data: [{ id: 9, __toString: 'Remote' }] })
    await wrapper.vm.remoteSearch('rem')
    await flushPromises()

    expect(listMock).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(ElTransfer).props('data')).toContainEqual({ value: 9, label: 'Remote' })

    await wrapper.vm.remoteSearch('')
    expect(wrapper.findComponent(ElTransfer).props('data')).toEqual([])
  })

  it('replaces :value placeholders in @filter with the query', async() => {
    const wrapper = mountTransfer({ form: {} })
    await flushPromises()
    listMock.mockClear()

    await wrapper.vm.fetchData('Tag', { '@filter': 'entity.getSlug() == ":value"' }, 'red')

    expect(listMock.mock.calls[0][0]['@filter']).toBe('entity.getSlug() == "red"')
    expect(listMock.mock.calls[0][0]['@display']).toBe('reduce')
  })

  it('hydrates uuid labels through loadRelationRecords', async() => {
    loadMock.mockResolvedValue([{ uuid: 'u-1', name: 'Alice' }])
    const wrapper = mountTransfer({ form: { userUuids: ['u-1'] }, field: { property: 'userUuids' } })
    await flushPromises()
    await flushPromises()

    expect(loadMock).toHaveBeenCalled()
    expect(wrapper.vm.options).toContainEqual({ value: 'u-1', label: 'Alice' })
  })

  it('swallows list errors without throwing', async() => {
    const wrapper = mountTransfer({ form: {} })
    await flushPromises()
    listMock.mockRejectedValueOnce(new Error('boom'))

    await expect(wrapper.vm.fetchData('Tag', {})).resolves.toBeUndefined()
  })
})
