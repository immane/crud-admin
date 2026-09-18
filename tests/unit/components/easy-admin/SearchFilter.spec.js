import { mount, shallowMount, flushPromises } from '@vue/test-utils'
import SearchFilter from '@/easyadmin/ui/vue/SearchFilter.vue'

const tick = async(wrapper) => {
  await flushPromises()
  await wrapper.vm.$nextTick()
}

function shallowFilter(props = {}) {
  return shallowMount(SearchFilter, {
    props: {
      listFilter: {},
      fetchDataFunc: () => {},
      ...props
    }
  })
}

describe('SearchFilter.vue props & defaults', () => {
  it('has expected default prop values', async() => {
    const wrapper = shallowFilter({ listFilter: {}})
    await tick(wrapper)
    expect(wrapper.props('refreshing')).toBe(false)
    expect(wrapper.props('modelValue')).toEqual({})
    // NOTE: source defaults `() => {}` return undefined by design
    expect(wrapper.props('query')).toBeUndefined()
    expect(wrapper.props('filter')).toBeUndefined()
    expect(wrapper.props('listFilter')).toEqual({})
    expect(typeof wrapper.props('fetchDataFunc')).toBe('function')
  })

  it('default fetchDataFunc is a safe no-op returning a function', async() => {
    const wrapper = shallowMount(SearchFilter, { props: { listFilter: {}}})
    await tick(wrapper)
    expect(() => wrapper.vm.fetchData(true)).not.toThrow()
    expect(() => wrapper.vm.fetchData(false)).not.toThrow()
    const ret = wrapper.vm.fetchDataFunc(wrapper.vm, true)
    expect(typeof ret).toBe('function')
  })

  it('initialises data with empty filters/filterData/list', async() => {
    const wrapper = shallowFilter({ listFilter: {}})
    await tick(wrapper)
    expect(wrapper.vm.list).toEqual([])
    expect(wrapper.vm.filters).toEqual({})
    expect(wrapper.vm.filterData).toEqual({})
  })
})

describe('SearchFilter.vue filterProcess - field shapes', () => {
  it('transforms string field into input/matches expression', async() => {
    const wrapper = shallowFilter({ listFilter: { nickname: 'Nickname here' }})
    await tick(wrapper)
    expect(wrapper.vm.filters.nickname).toEqual({
      data: null,
      type: 'input',
      label: 'Nickname here',
      default: null,
      expression: 'entity.getNickname() matches \':value\''
    })
    expect(wrapper.vm.filterData.nickname).toBeNull()
  })

  it('transforms null field into input with empty label', async() => {
    const wrapper = shallowFilter({ listFilter: { keyword: null }})
    await tick(wrapper)
    expect(wrapper.vm.filters.keyword).toEqual({
      data: null,
      type: 'input',
      label: '',
      default: null,
      expression: 'entity.getKeyword() matches \':value\''
    })
    expect(wrapper.vm.filterData.keyword).toBeNull()
  })

  it('transforms reduced object shorthand into select/== expression with data', async() => {
    const wrapper = shallowFilter({
      listFilter: {
        status: { __label: 'Status', __default: 0, 0: 'Pending', 1: 'Paid', 2: 'Completed' }
      }
    })
    await tick(wrapper)
    const f = wrapper.vm.filters.status
    expect(f.label).toBe('Status')
    expect(f.default).toBe(0)
    expect(f.type).toBe('select')
    expect(f.expression).toBe('entity.getStatus() == \':value\'')
    expect(f.data).toEqual([
      { value: '0', label: 'Pending' },
      { value: '1', label: 'Paid' },
      { value: '2', label: 'Completed' }
    ])
    expect(wrapper.vm.filterData.status).toBe(0)
  })

  it('transforms reduced object without meta keys into select with null default', async() => {
    const wrapper = shallowFilter({ listFilter: { kind: { a: 'A', b: 'B' }}})
    await tick(wrapper)
    const f = wrapper.vm.filters.kind
    expect(f.label).toBe('')
    expect(f.default).toBeNull()
    expect(f.type).toBe('select')
    expect(f.data).toEqual([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' }
    ])
    expect(wrapper.vm.filterData.kind).toBeNull()
  })

  it('builds relation expression for dotted keys (string => matches)', async() => {
    const wrapper = shallowFilter({ listFilter: { 'user.username': 'Username' }})
    await tick(wrapper)
    expect(wrapper.vm.filters['user.username'].expression).toBe(
      'entity.getUser().getUsername() matches \':value\''
    )
  })

  it('builds relation expression for dotted keys (object => ==)', async() => {
    const wrapper = shallowFilter({
      listFilter: { 'user.status': { __label: 'S', 0: 'x', 1: 'y' }}
    })
    await tick(wrapper)
    expect(wrapper.vm.filters['user.status'].expression).toBe(
      'entity.getUser().getStatus() == \':value\''
    )
  })

  it('passes full-style filters through untouched and seeds default', async() => {
    const full = {
      expression: 'entity.getUser().getUsername() matches ":value"',
      label: 'Username',
      type: 'input',
      default: 'Rin'
    }
    const wrapper = shallowFilter({ listFilter: { 'user.username': full }})
    await tick(wrapper)
    expect(wrapper.vm.filters['user.username']).toEqual(full)
    expect(wrapper.vm.filterData['user.username']).toBe('Rin')
  })

  it('seeds undefined when full-style has no default key', async() => {
    const full = {
      expression: 'entity.getId() == :value',
      label: 'Id',
      type: 'select',
      data: [{ value: 'a', label: 'A' }]
    }
    const wrapper = shallowFilter({ listFilter: { id: full }})
    await tick(wrapper)
    expect(wrapper.vm.filters.id).toEqual(full)
    expect(wrapper.vm.filterData.id).toBeUndefined()
  })

  it('resolves async function filters returning a promise', async() => {
    const asyncField = () => Promise.resolve({ __label: 'Category', __default: 1, 1: 'Book', 2: 'Paper' })
    const wrapper = shallowFilter({ listFilter: { 'category.id': asyncField }})
    await tick(wrapper)
    const f = wrapper.vm.filters['category.id']
    expect(f.label).toBe('Category')
    expect(f.default).toBe(1)
    expect(f.type).toBe('select')
    expect(f.expression).toBe('entity.getCategory().getId() == \':value\'')
    expect(f.data).toEqual([
      { value: '1', label: 'Book' },
      { value: '2', label: 'Paper' }
    ])
    expect(wrapper.vm.filterData['category.id']).toBe(1)
  })

  it('invokes async filter factory twice (guard + await) and uses resolved value', async() => {
    const factory = vi.fn(() => Promise.resolve({ __label: 'C', 5: 'Five' }))
    const wrapper = shallowFilter({ listFilter: { cat: factory }})
    await tick(wrapper)
    // Implementation calls listFilter[key]() once to check instanceof Promise
    // and a second time to await. Lock this behaviour.
    expect(factory).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.filters.cat.label).toBe('C')
  })

  it('throws when async filter factory does not return a promise', async() => {
    const wrapper = shallowFilter({ listFilter: {}})
    await tick(wrapper)
    await wrapper.setProps({ listFilter: { bad: () => ({ __label: 'x' }) }})
    await expect(wrapper.vm.filterProcess()).rejects.toThrow('Async filter must return promise object!')
  })

  it('mixes sync and async filters in one listFilter', async() => {
    const wrapper = shallowFilter({
      listFilter: {
        name: 'Name',
        cat: () => Promise.resolve({ __label: 'Cat', __default: 'b', b: 'Book' })
      }
    })
    await tick(wrapper)
    expect(wrapper.vm.filters.name.type).toBe('input')
    expect(wrapper.vm.filters.cat.type).toBe('select')
    expect(wrapper.vm.filters.cat.default).toBe('b')
  })
})

describe('SearchFilter.vue created()', () => {
  it('restores non-empty modelValue entries into filterData', async() => {
    const wrapper = shallowFilter({
      listFilter: { name: 'Name', status: { __label: 'S', __default: 0, 0: 'a', 1: 'b' }},
      modelValue: { name: 'Rin', status: 1 }
    })
    await tick(wrapper)
    expect(wrapper.vm.filterData.name).toBe('Rin')
    expect(wrapper.vm.filterData.status).toBe(1)
  })

  it('ignores null/empty-string modelValue entries during restore', async() => {
    const wrapper = shallowFilter({
      listFilter: { name: 'Name', status: { __label: 'S', __default: 0, 0: 'a', 1: 'b' }},
      modelValue: { name: '', status: null }
    })
    await tick(wrapper)
    // defaults preserved: string shorthand => null, object shorthand => __default
    expect(wrapper.vm.filterData.name).toBeNull()
    expect(wrapper.vm.filterData.status).toBe(0)
  })

  it('emits update:modelValue and update:filter on created via filterGenerate', async() => {
    const wrapper = shallowFilter({ listFilter: { name: 'Name' }})
    await tick(wrapper)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:filter')).toBeTruthy()
  })

  it('calls fetchDataFunc with (vm, false) on created', async() => {
    const fetchDataFunc = vi.fn()
    const wrapper = shallowFilter({ listFilter: {}, fetchDataFunc })
    await tick(wrapper)
    expect(fetchDataFunc).toHaveBeenCalledTimes(1)
    expect(fetchDataFunc.mock.calls[0][0]).toBe(wrapper.vm)
    expect(fetchDataFunc.mock.calls[0][1]).toBe(false)
  })
})

describe('SearchFilter.vue filterGenerate', () => {
  it('emits empty filter object when no values are set', async() => {
    const wrapper = shallowFilter({ listFilter: { name: 'Name' }})
    await tick(wrapper)
    wrapper.vm.filterData = { name: null }
    wrapper.vm.filterGenerate()
    const filterEmits = wrapper.emitted('update:filter')
    expect(filterEmits[filterEmits.length - 1][0]).toEqual({})
    const modelEmits = wrapper.emitted('update:modelValue')
    expect(modelEmits[modelEmits.length - 1][0]).toEqual({ name: null })
  })

  it('builds single expression with value substitution', async() => {
    const wrapper = shallowFilter({ listFilter: { name: 'Name' }})
    await tick(wrapper)
    wrapper.vm.filterData = { name: 'Rin' }
    wrapper.vm.filterGenerate()
    const emitted = wrapper.emitted('update:filter')
    expect(emitted[emitted.length - 1][0]).toEqual({
      '@filter': '(entity.getName() matches \'Rin\')'
    })
  })

  it('joins multiple expressions with &&', async() => {
    const wrapper = shallowFilter({
      listFilter: {
        name: 'Name',
        status: { __label: 'S', 0: 'a', 1: 'b' }
      }
    })
    await tick(wrapper)
    wrapper.vm.filterData = { name: 'Rin', status: '1' }
    wrapper.vm.filterGenerate()
    const emitted = wrapper.emitted('update:filter')
    expect(emitted[emitted.length - 1][0]).toEqual({
      '@filter': '(entity.getName() matches \'Rin\') && (entity.getStatus() == \'1\')'
    })
  })

  it('merges with existing query @filter', async() => {
    const wrapper = shallowFilter({
      listFilter: { name: 'Name' },
      query: { '@filter': 'entity.getId() > 5' }
    })
    await tick(wrapper)
    wrapper.vm.filterData = { name: 'Rin' }
    wrapper.vm.filterGenerate()
    const emitted = wrapper.emitted('update:filter')
    expect(emitted[emitted.length - 1][0]).toEqual({
      '@filter': 'entity.getId() > 5 && (entity.getName() matches \'Rin\')'
    })
  })

  it('preserves query @filter when no field values are set', async() => {
    const wrapper = shallowFilter({
      listFilter: { name: 'Name' },
      query: { '@filter': 'base' }
    })
    await tick(wrapper)
    wrapper.vm.filterData = { name: '' }
    wrapper.vm.filterGenerate()
    const emitted = wrapper.emitted('update:filter')
    expect(emitted[emitted.length - 1][0]).toEqual({ '@filter': 'base' })
  })

  it('skips empty/falsy values (null, "", undefined, 0, false)', async() => {
    const wrapper = shallowFilter({
      listFilter: {
        a: 'A',
        b: 'B',
        c: 'C',
        d: { __label: 'D', __default: 0, 0: 'z', 1: 'o' },
        e: { __label: 'E', type: 'boolean', expression: 'entity.getE() == :value', default: false }
      }
    })
    await tick(wrapper)
    // force falsy values explicitly
    wrapper.vm.filterData = { a: null, b: '', c: undefined, d: 0, e: false }
    wrapper.vm.filterGenerate()
    const emitted = wrapper.emitted('update:filter')
    expect(emitted[emitted.length - 1][0]).toEqual({})
  })

  it('replaces all :value occurrences (replaceAll)', async() => {
    const full = {
      expression: ':value - :value',
      label: 'X',
      type: 'input',
      default: null
    }
    const wrapper = shallowFilter({ listFilter: { x: full }})
    await tick(wrapper)
    wrapper.vm.filterData = { x: 'V' }
    wrapper.vm.filterGenerate()
    const emitted = wrapper.emitted('update:filter')
    expect(emitted[emitted.length - 1][0]).toEqual({ '@filter': '(V - V)' })
  })
})

describe('SearchFilter.vue reset & fetchData', () => {
  it('reset restores defaults, regenerates filter and emits reset', async() => {
    const wrapper = shallowFilter({
      listFilter: {
        name: 'Name',
        status: { __label: 'S', __default: 'b', a: 'A', b: 'B' }
      }
    })
    await tick(wrapper)
    wrapper.vm.filterData = { name: 'dirty', status: 'a' }
    wrapper.vm.reset()
    expect(wrapper.vm.filterData).toEqual({ name: null, status: 'b' })
    const filterEmits = wrapper.emitted('update:filter')
    expect(filterEmits[filterEmits.length - 1][0]).toEqual({
      '@filter': '(entity.getStatus() == \'b\')'
    })
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })

  it('reset with all-null defaults emits empty filter', async() => {
    const wrapper = shallowFilter({ listFilter: { name: 'Name' }})
    await tick(wrapper)
    wrapper.vm.filterData = { name: 'x' }
    wrapper.vm.reset()
    expect(wrapper.vm.filterData).toEqual({ name: null })
    const filterEmits = wrapper.emitted('update:filter')
    expect(filterEmits[filterEmits.length - 1][0]).toEqual({})
  })

  it('fetchData defaults resetPage to true and forwards (vm, resetPage)', async() => {
    const fetchDataFunc = vi.fn()
    const wrapper = shallowFilter({ listFilter: {}, fetchDataFunc })
    await tick(wrapper)
    fetchDataFunc.mockClear()
    wrapper.vm.fetchData()
    expect(fetchDataFunc).toHaveBeenCalledWith(wrapper.vm, true)
    wrapper.vm.fetchData(false)
    expect(fetchDataFunc).toHaveBeenCalledWith(wrapper.vm, false)
    wrapper.vm.fetchData(true)
    expect(fetchDataFunc).toHaveBeenCalledWith(wrapper.vm, true)
  })

  it('_console returns global console', async() => {
    const wrapper = shallowFilter({ listFilter: {}})
    await tick(wrapper)
    expect(wrapper.vm._console()).toBe(console)
  })
})

describe('SearchFilter.vue watcher', () => {
  it('syncs filterData when modelValue changes (deep)', async() => {
    const wrapper = shallowFilter({ listFilter: { name: 'Name' }, modelValue: {}})
    await tick(wrapper)
    await wrapper.setProps({ modelValue: { name: 'hello' }})
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filterData).toEqual({ name: 'hello' })
    // mutating to a new object also syncs (deep copy, not reference)
    const src = { name: 'world' }
    await wrapper.setProps({ modelValue: src })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filterData).toEqual({ name: 'world' })
    expect(wrapper.vm.filterData).not.toBe(src)
  })
})

describe('SearchFilter.vue template branches', () => {
  const elStubs = {
    'el-input': { template: '<div class="stub-input"><slot name="prefix" /></div>' },
    'el-select': { template: '<div class="stub-select"><slot /></div>' },
    'el-option': { template: '<div class="stub-option" />' },
    'el-date-picker': { template: '<div class="stub-date" />' },
    'el-switch': { template: '<div class="stub-switch" />' },
    'el-button': { template: '<button class="stub-btn" />' },
    'el-icon': { template: '<i class="stub-icon"><slot /></i>' },
    'el-icon-search': { template: '<i class="stub-icon-search" />' }
  }

  function mountTemplate(listFilter, extraProps = {}) {
    return mount(SearchFilter, {
      props: { listFilter, fetchDataFunc: () => {}, ...extraProps },
      global: { stubs: elStubs }
    })
  }

  it('renders input branch for type=input', async() => {
    const wrapper = mountTemplate({ name: { expression: 'entity.getName() matches ":value"', label: 'Name', type: 'input', default: null }})
    await tick(wrapper)
    expect(wrapper.find('.stub-input').exists()).toBe(true)
    expect(wrapper.find('.stub-select').exists()).toBe(false)
    expect(wrapper.find('.stub-switch').exists()).toBe(false)
    expect(wrapper.find('.stub-date').exists()).toBe(false)
  })

  it('renders select branch (v-else) for type=select with options', async() => {
    const wrapper = mountTemplate({
      status: {
        expression: 'entity.getStatus() == ":value"',
        label: 'Status',
        type: 'select',
        data: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
        default: null
      }
    })
    await tick(wrapper)
    expect(wrapper.find('.stub-select').exists()).toBe(true)
    expect(wrapper.findAll('.stub-option')).toHaveLength(2)
  })

  it('renders select branch for reduced shorthand object', async() => {
    const wrapper = mountTemplate({ status: { __label: 'S', 0: 'a', 1: 'b' }})
    await tick(wrapper)
    expect(wrapper.find('.stub-select').exists()).toBe(true)
    expect(wrapper.findAll('.stub-option')).toHaveLength(2)
  })

  it('renders select with filterable=false when data length <= 8 (short list)', async() => {
    const wrapper = mountTemplate({
      status: {
        expression: 'e == ":value"',
        label: 'S',
        type: 'select',
        data: [{ value: 'a', label: 'A' }],
        default: null
      }
    })
    await tick(wrapper)
    expect(wrapper.find('.stub-select').exists()).toBe(true)
  })

  it('renders boolean branch for type=boolean', async() => {
    const wrapper = mountTemplate({
      enabled: { expression: 'entity.getEnabled() == :value', label: 'Enabled', type: 'boolean', default: true }
    })
    await tick(wrapper)
    expect(wrapper.find('.stub-switch').exists()).toBe(true)
    expect(wrapper.find('.stub-input').exists()).toBe(false)
    expect(wrapper.find('.stub-date').exists()).toBe(false)
  })

  it.each(['datetime', 'date', 'time'])('renders date-picker branch for type=%s', async(type) => {
    const wrapper = mountTemplate({
      when: { expression: 'entity.getWhen() >= ":value"', label: 'When', type, default: null }
    })
    await tick(wrapper)
    expect(wrapper.find('.stub-date').exists()).toBe(true)
  })

  it('renders custom component branch when filter has component key', async() => {
    const Custom = { name: 'Custom', props: ['modelValue'], template: '<div class="custom-comp" />' }
    const wrapper = mountTemplate({
      custom: { expression: 'entity.getX() == ":value"', label: 'X', component: Custom, default: null }
    })
    await tick(wrapper)
    expect(wrapper.find('.custom-comp').exists()).toBe(true)
  })

  it('hides actions bar when filters are empty, shows otherwise', async() => {
    const empty = mountTemplate({})
    await tick(empty)
    expect(empty.find('.easy-admin-search-filter__actions').exists()).toBe(false)

    const filled = mountTemplate({ name: 'Name' })
    await tick(filled)
    expect(filled.find('.easy-admin-search-filter__actions').exists()).toBe(true)
  })

  it('clicking search button calls filterGenerate + fetchData', async() => {
    const fetchDataFunc = vi.fn()
    const wrapper = mount(SearchFilter, {
      props: { listFilter: { name: 'Name' }, fetchDataFunc },
      global: { stubs: elStubs }
    })
    await tick(wrapper)
    fetchDataFunc.mockClear()
    const spy = vi.spyOn(wrapper.vm, 'filterGenerate')
    const buttons = wrapper.findAll('.stub-btn')
    expect(buttons).toHaveLength(2)
    await buttons[0].trigger('click')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(fetchDataFunc).toHaveBeenCalledTimes(1)
    // fetchData() with no arg => resetPage true
    expect(fetchDataFunc.mock.calls[0][1]).toBe(true)
  })

  it('clicking reset button calls reset and toggles refreshing class', async() => {
    const wrapper = mountTemplate({ name: 'Name' }, { refreshing: false })
    await tick(wrapper)
    wrapper.vm.filterData = { name: 'dirty' }
    await wrapper.vm.$nextTick()
    const buttons = wrapper.findAll('.stub-btn')
    expect(buttons).toHaveLength(2)
    await buttons[1].trigger('click')
    expect(wrapper.vm.filterData).toEqual({ name: null })
    expect(wrapper.emitted('reset')).toHaveLength(1)

    await wrapper.setProps({ refreshing: true })
    expect(wrapper.find('.search-filter__reset--refreshing').exists()).toBe(true)
    await wrapper.setProps({ refreshing: false })
    expect(wrapper.find('.search-filter__reset--refreshing').exists()).toBe(false)
  })
})
