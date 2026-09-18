import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElOption, ElSelect } from 'element-plus'
import RelationToMany from '@/easyadmin/ui/vue/plugins/form/RelationToMany.vue'
import RelationToOne from '@/easyadmin/ui/vue/plugins/form/RelationToOne.vue'

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
  default: { Role: {}, User: {}, Tag: {}}
}))

vi.mock('@/utils/relation', async(importOriginal) => {
  const mod = await importOriginal()
  return { ...mod, loadRelationRecords: (...args) => loadMock(...args) }
})

const RouterLinkStub = {
  props: ['to'],
  template: '<a class="stub-router-link"><slot /></a>'
}

const rolesField = () => ({ property: 'roles', relation: { entity: 'Role', valueKey: 'id' }})

function mountMany({ form, field = rolesField(), struct = {}} = {}) {
  return mount(RelationToMany, {
    props: { form: form ?? {}, field, struct, emPrefix: '' },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key },
      stubs: { 'router-link': RouterLinkStub }
    }
  })
}

describe('form/RelationToMany.vue', () => {
  beforeEach(() => {
    listMock.mockReset()
    loadMock.mockReset()
    constructed.length = 0
    listMock.mockResolvedValue({ data: [] })
    loadMock.mockResolvedValue([])
  })

  it('extends RelationToOne', () => {
    expect(RelationToMany.extends).toBe(RelationToOne)
  })

  it('normalizes a missing value to an empty array on created', async() => {
    const form = {}
    mountMany({ form, field: rolesField() })
    await flushPromises()

    expect(form.roles).toEqual([])
  })

  it('normalizes non-array values to an empty array on created', async() => {
    const scalar = { roles: 5 }
    mountMany({ form: scalar, field: rolesField() })
    await flushPromises()
    expect(scalar.roles).toEqual([])

    const nil = { roles: null }
    mountMany({ form: nil, field: rolesField() })
    await flushPromises()
    expect(nil.roles).toEqual([])
  })

  it('preserves existing arrays on created', async() => {
    const form = { roles: [1, 2] }
    mountMany({ form, field: rolesField() })
    await flushPromises()

    expect(form.roles).toEqual([1, 2])
  })

  it('renders a multiple select bound to the form array', async() => {
    const form = { roles: [1] }
    const wrapper = mountMany({ form, field: rolesField() })
    await flushPromises()

    const select = wrapper.findComponent(ElSelect)
    expect(select.props('multiple')).toBe(true)
    expect(select.props('modelValue')).toEqual([1])

    await select.vm.$emit('update:modelValue', [1, 2])
    expect(form.roles).toEqual([1, 2])
  })

  it('preloads options on created when not remote', async() => {
    listMock.mockResolvedValue({
      data: [
        { id: 1, __toString: 'Admin' },
        { id: 2, __toString: 'User' }
      ]
    })
    const wrapper = mountMany({ form: { roles: [] }, field: rolesField() })
    await flushPromises()

    expect(listMock).toHaveBeenCalledTimes(1)
    expect(constructed[0]).toMatchObject({ name: 'Role' })
    expect(wrapper.vm.options).toEqual([
      { value: 1, label: 'Admin' },
      { value: 2, label: 'User' }
    ])
    const rendered = wrapper.findAllComponents(ElOption)
    expect(rendered).toHaveLength(2)
    expect(rendered[1].props('value')).toBe(2)
    expect(rendered[1].props('label')).toBe('User')
  })

  it('skips preload on created when type_options.remote is true', async() => {
    const wrapper = mountMany({
      form: {},
      field: { property: 'roles', relation: { entity: 'Role', valueKey: 'id' }, type_options: { remote: true }}
    })
    await flushPromises()

    expect(listMock).not.toHaveBeenCalled()
    expect(wrapper.vm.options).toEqual([])
  })

  it('seeds placeholders for every selected id', async() => {
    const wrapper = mountMany({ form: { roles: [4, 9] }, field: rolesField() })
    await flushPromises()

    expect(wrapper.vm.options).toContainEqual({ value: 4, label: '4' })
    expect(wrapper.vm.options).toContainEqual({ value: 9, label: '9' })
  })

  it('adds late-arriving edit values through the watcher', async() => {
    const wrapper = mountMany({ form: { roles: [] }, field: rolesField() })
    await flushPromises()
    expect(wrapper.vm.options).toEqual([])

    await wrapper.setProps({ form: { roles: [11, 12] }})
    await flushPromises()

    expect(wrapper.vm.options).toContainEqual({ value: 11, label: '11' })
    expect(wrapper.vm.options).toContainEqual({ value: 12, label: '12' })
  })

  it('hydrates uuid labels through loadRelationRecords', async() => {
    loadMock.mockResolvedValue([
      { uuid: 'u-1', name: 'Alice' },
      { uuid: 'u-2', name: 'Bob' }
    ])
    const wrapper = mountMany({ form: { userUuids: ['u-1', 'u-2'] }, field: { property: 'userUuids' }})
    await flushPromises()
    await flushPromises()

    expect(loadMock).toHaveBeenCalled()
    expect(wrapper.vm.options).toContainEqual({ value: 'u-1', label: 'Alice' })
    expect(wrapper.vm.options).toContainEqual({ value: 'u-2', label: 'Bob' })
  })

  it('remoteSearch fetches with the query and clears on empty query', async() => {
    const wrapper = mountMany({
      form: {},
      field: { property: 'roles', relation: { entity: 'Role', valueKey: 'id' }, type_options: { remote: true }}
    })
    await flushPromises()

    listMock.mockResolvedValue({ data: [{ id: 3, __toString: 'Manager' }] })
    await wrapper.vm.remoteSearch('man')
    expect(wrapper.vm.loading).toBe(false)
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.options).toContainEqual({ value: 3, label: 'Manager' })

    await wrapper.vm.remoteSearch('')
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.options).toEqual([])
  })

  it('replaces :value placeholders in @filter with the query', async() => {
    const wrapper = mountMany({ form: {}, field: rolesField() })
    await flushPromises()
    listMock.mockClear()

    await wrapper.vm.fetchData('Role', { '@filter': 'entity.getName() == ":value"' }, 'ops')

    const params = listMock.mock.calls[0][0]
    expect(params['@filter']).toBe('entity.getName() == "ops"')
    expect(params['@display']).toBe('reduce')
    expect(params.limit).toBe(1e10)
  })

  it('merges fetched options, drops nullish values and swallows errors', async() => {
    const wrapper = mountMany({ form: { roles: [7] }, field: rolesField() })
    await flushPromises()

    listMock.mockResolvedValue({
      data: [
        { id: null, __toString: 'Ghost' },
        { id: 1, __toString: 'Admin' }
      ]
    })
    await wrapper.vm.fetchData('Role', {})

    const byValue = new Map(wrapper.vm.options.map(option => [option.value, option.label]))
    expect(byValue.get(7)).toBe('7')
    expect(byValue.get(1)).toBe('Admin')
    expect(byValue.has(null)).toBe(false)

    listMock.mockRejectedValueOnce(new Error('boom'))
    await expect(wrapper.vm.fetchData('Role', {})).resolves.toBeUndefined()
  })

  it('shows a creation link only when field.creationUrl is set', () => {
    const withUrl = mountMany({ form: {}, field: { ...rolesField(), creationUrl: '/roles/create' }})
    expect(withUrl.find('.stub-router-link').exists()).toBe(true)

    const without = mountMany({ form: {}, field: rolesField() })
    expect(without.find('.stub-router-link').exists()).toBe(false)
  })
})
