import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import ElementPlus, { ElOption, ElSelect } from 'element-plus'
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
  default: { Role: {}, User: {}, Region: {}}
}))

vi.mock('@/utils/relation', async(importOriginal) => {
  const mod = await importOriginal()
  return { ...mod, loadRelationRecords: (...args) => loadMock(...args) }
})

const RouterLinkStub = {
  props: ['to'],
  template: '<a class="stub-router-link"><slot /></a>'
}

const roleField = () => ({ property: 'role', relation: { entity: 'Role', valueKey: 'id' }})

function mountOne({ form = {}, field = roleField(), struct = {}, emPrefix = '' } = {}) {
  return mount(RelationToOne, {
    props: { form, field, struct, emPrefix },
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key },
      stubs: { 'router-link': RouterLinkStub }
    }
  })
}

describe('form/RelationToOne.vue', () => {
  beforeEach(() => {
    listMock.mockReset()
    loadMock.mockReset()
    constructed.length = 0
    listMock.mockResolvedValue({ data: [] })
    loadMock.mockResolvedValue([])
  })

  it('preloads options on created when not remote', async() => {
    listMock.mockResolvedValue({
      data: [
        { id: 1, __toString: 'Admin' },
        { id: 2, __toString: 'User' }
      ]
    })
    const form = {}
    const field = { property: 'role', relation: { entity: 'Role', valueKey: 'id' }, relation_filter: { '@order': 'entity.id|ASC' }}
    const wrapper = mountOne({ form, field })
    await flushPromises()

    expect(listMock).toHaveBeenCalledTimes(1)
    const params = listMock.mock.calls[0][0]
    expect(params['@display']).toBe('reduce')
    expect(params.limit).toBe(1e10)
    expect(constructed[0]).toMatchObject({ name: 'Role' })
    expect(constructed[0].prefix).toBeUndefined()
    expect(wrapper.vm.entity).toBe('Role')
    expect(wrapper.vm.options).toEqual([
      { value: 1, label: 'Admin' },
      { value: 2, label: 'User' }
    ])
    const rendered = wrapper.findAllComponents(ElOption)
    expect(rendered).toHaveLength(2)
    expect(rendered[0].props('value')).toBe(1)
    expect(rendered[0].props('label')).toBe('Admin')
  })

  it('skips preload on created when type_options.remote is true', async() => {
    const wrapper = mountOne({
      field: { property: 'role', relation: { entity: 'Role', valueKey: 'id' }, type_options: { remote: true }}
    })
    await flushPromises()

    expect(listMock).not.toHaveBeenCalled()
    expect(wrapper.vm.entity).toBe('Role')
    expect(wrapper.vm.options).toEqual([])
  })

  it('resolves the entity from type_options.entity_name', async() => {
    listMock.mockResolvedValue({ data: [{ id: 3, __toString: 'North' }] })
    const wrapper = mountOne({ field: { property: 'region', type_options: { entity_name: 'Region' }}})
    await flushPromises()

    expect(wrapper.vm.entity).toBe('Region')
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.options).toEqual([{ value: 3, label: 'North' }])
  })

  it('resolves the entity from struct metadata', async() => {
    const struct = { metadata: { type: 'ManyToOne', targetEntity: 'App\\Entity\\Role' }}
    const wrapper = mountOne({ field: { property: 'role' }, struct })
    await flushPromises()

    expect(wrapper.vm.entity).toBe('Role')
    expect(listMock).toHaveBeenCalledTimes(1)
  })

  it('skips fetching when no relation resolves', async() => {
    const wrapper = mountOne({ field: { property: 'whatever' }})
    await flushPromises()

    expect(wrapper.vm.entity).toBeNull()
    expect(listMock).not.toHaveBeenCalled()
    expect(wrapper.vm.options).toEqual([])
  })

  it('seeds placeholder options for selected values missing from fetched options', async() => {
    const wrapper = mountOne({ form: { role: 7 }, field: roleField() })
    await flushPromises()

    expect(wrapper.vm.options).toContainEqual({ value: 7, label: '7' })
  })

  it('ignores nullish and empty selected values when seeding placeholders', async() => {
    const nullish = mountOne({ form: { role: null }, field: roleField() })
    await flushPromises()
    expect(nullish.vm.options).toEqual([])

    const empty = mountOne({ form: { role: '' }, field: roleField() })
    await flushPromises()
    expect(empty.vm.options).toEqual([])

    const missing = mountOne({ form: {}, field: roleField() })
    await flushPromises()
    expect(missing.vm.options).toEqual([])
  })

  it('hydrates late-arriving edit values via the selected-values watcher', async() => {
    const wrapper = mountOne({ form: {}, field: roleField() })
    await flushPromises()
    expect(wrapper.vm.options).toEqual([])

    await wrapper.setProps({ form: { role: 42 }})
    await flushPromises()

    expect(wrapper.vm.options).toContainEqual({ value: 42, label: '42' })
  })

  it('hydrates uuid labels through loadRelationRecords', async() => {
    loadMock.mockResolvedValue([
      { uuid: 'u-1', __toString: 'Alice' },
      { uuid: 'u-9', __toString: 'Nobody' }
    ])
    const wrapper = mountOne({ form: { userUuid: 'u-1' }, field: { property: 'userUuid' }})
    await flushPromises()
    await flushPromises()

    expect(loadMock).toHaveBeenCalled()
    expect(wrapper.vm.options).toContainEqual({ value: 'u-1', label: 'Alice' })
    expect(wrapper.vm.options.find(option => option.value === 'u-1').label).toBe('Alice')
    expect(wrapper.vm.options.some(option => option.value === 'u-9')).toBe(false)
  })

  it('skips record hydration for id-based relations', async() => {
    const wrapper = mountOne({ form: { role: 3 }, field: roleField() })
    await flushPromises()
    await flushPromises()

    expect(loadMock).not.toHaveBeenCalled()
    expect(wrapper.vm.options).toContainEqual({ value: 3, label: '3' })
  })

  it('skips hydration when nothing is selected', async() => {
    mountOne({ form: {}, field: { property: 'userUuid' }})
    await flushPromises()
    await flushPromises()

    expect(loadMock).not.toHaveBeenCalled()
  })

  it('uses the username fallback for labels when __toString is missing', async() => {
    listMock.mockResolvedValue({ data: [{ id: 1, username: 'alice' }] })
    const wrapper = mountOne({ form: {}, field: roleField() })
    await flushPromises()

    expect(wrapper.vm.options).toEqual([{ value: 1, label: 'alice' }])
  })

  it('remoteSearch fetches with the query and toggles loading', async() => {
    let resolveList
    listMock.mockImplementationOnce(() => new Promise((resolve) => { resolveList = resolve }))
    const wrapper = mountOne({
      field: { property: 'role', relation: { entity: 'Role', valueKey: 'id' }, type_options: { remote: true }}
    })
    await flushPromises()
    expect(listMock).not.toHaveBeenCalled()

    const pending = wrapper.vm.remoteSearch('adm')
    expect(wrapper.vm.loading).toBe(true)
    resolveList({ data: [{ id: 1, __toString: 'Admin' }] })
    await pending
    await flushPromises()

    expect(wrapper.vm.loading).toBe(false)
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.options).toContainEqual({ value: 1, label: 'Admin' })
  })

  it('remoteSearch with an empty query clears options without fetching', async() => {
    const wrapper = mountOne({
      field: { property: 'role', relation: { entity: 'Role', valueKey: 'id' }, type_options: { remote: true }}
    })
    await flushPromises()
    wrapper.vm.options = [{ value: 1, label: 'Admin' }]

    await wrapper.vm.remoteSearch('')
    expect(listMock).not.toHaveBeenCalled()
    expect(wrapper.vm.options).toEqual([])
  })

  it('wires remoteSearch as the select remote-method', () => {
    const wrapper = mountOne({ field: roleField() })
    expect(wrapper.findComponent(ElSelect).props('remoteMethod')).toBe(wrapper.vm.remoteSearch)
  })

  it('replaces every :value placeholder in @filter with the query', async() => {
    const wrapper = mountOne({ field: roleField() })
    await flushPromises()
    listMock.mockClear()

    await wrapper.vm.fetchData(
      'Region',
      { '@filter': 'entity.getLevel() == ":value" or entity.getCode() == ":value"', '@order': 'entity.name|ASC' },
      '3'
    )

    const params = listMock.mock.calls[0][0]
    expect(params['@filter']).toBe('entity.getLevel() == "3" or entity.getCode() == "3"')
    expect(params['@display']).toBe('reduce')
    expect(params.limit).toBe(1e10)
  })

  it('keeps the base filter untouched when no query is given', async() => {
    const wrapper = mountOne({ field: roleField() })
    await flushPromises()
    listMock.mockClear()

    const baseFilter = { '@filter': 'entity.getLevel() == ":value"' }
    await wrapper.vm.fetchData('Region', baseFilter)

    expect(listMock.mock.calls[0][0]['@filter']).toBe('entity.getLevel() == ":value"')
    expect(baseFilter).toEqual({ '@filter': 'entity.getLevel() == ":value"' })
  })

  it('merges fetched options while preserving selected placeholders', async() => {
    const wrapper = mountOne({ form: { role: 7 }, field: roleField() })
    await flushPromises()
    listMock.mockResolvedValue({ data: [{ id: 1, __toString: 'Admin' }] })

    await wrapper.vm.fetchData('Role', {})

    const byValue = new Map(wrapper.vm.options.map(option => [option.value, option.label]))
    expect(byValue.get(7)).toBe('7')
    expect(byValue.get(1)).toBe('Admin')
  })

  it('drops records with nullish values when mapping labels', async() => {
    listMock.mockResolvedValue({
      data: [
        { id: null, __toString: 'Ghost' },
        { __toString: 'NoId' },
        { id: 5, __toString: 'Five' }
      ]
    })
    const wrapper = mountOne({ form: {}, field: roleField() })
    await flushPromises()

    expect(wrapper.vm.options).toEqual([{ value: 5, label: 'Five' }])
  })

  it('swallows list errors without throwing', async() => {
    const wrapper = mountOne({ form: {}, field: roleField() })
    await flushPromises()
    listMock.mockRejectedValueOnce(new Error('boom'))

    await expect(wrapper.vm.fetchData('Role', {})).resolves.toBeUndefined()
    expect(wrapper.vm.options).toEqual([])
  })

  it('passes explicit relation plural/prefix through to EntityManage', async() => {
    const wrapper = mountOne({
      field: {
        property: 'scopeUuid',
        relation: { entity: { name: 'User', plural: 'users', prefix: '/api/v1/manage' }, valueKey: 'uuid' }
      }
    })
    await flushPromises()

    expect(constructed[0]).toEqual({ name: 'User', plural: 'users', prefix: '/api/v1/manage' })
    expect(wrapper.vm.entity).toBe('User')
  })

  it('shows a creation link only when field.creationUrl is set', () => {
    const withUrl = mountOne({ field: { ...roleField(), creationUrl: '/roles/create' }})
    const link = withUrl.find('.stub-router-link')
    expect(link.exists()).toBe(true)
    expect(withUrl.findComponent(RouterLinkStub).props('to')).toEqual({ path: '/roles/create' })

    const without = mountOne({ field: roleField() })
    expect(without.find('.stub-router-link').exists()).toBe(false)
  })

  it('writes a user selection back to form[field.property]', async() => {
    const form = { role: null }
    const wrapper = mountOne({ form, field: roleField() })
    await flushPromises()

    await wrapper.findComponent(ElSelect).vm.$emit('update:modelValue', 2)
    expect(form.role).toBe(2)
  })

  it('reflects external form mutations in the select', async() => {
    const form = reactive({ role: 1 })
    const wrapper = mountOne({ form, field: roleField() })
    await flushPromises()

    form.role = 2
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ElSelect).props('modelValue')).toBe(2)
  })
})
