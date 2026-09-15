import { mount, shallowMount, flushPromises } from '@vue/test-utils'
import SearchFilter from '@/components/EasyAdmin/SearchFilter.vue'

const tick = async (wrapper) => {
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

describe('SearchFilter.vue gaps', () => {
  describe('date placeholder label fallback (line 18)', () => {
    it('uses the label when present', async () => {
      const wrapper = mountTemplate({
        when: { expression: 'entity.getWhen() >= ":value"', label: 'When', type: 'date', default: null }
      })
      await tick(wrapper)
      expect(wrapper.find('.stub-date').exists()).toBe(true)
      expect(wrapper.find('.stub-date').attributes('placeholder')).toBe('When')
    })

    it('falls back to the filter key when the label is empty', async () => {
      const wrapper = mountTemplate({
        when: { expression: 'entity.getWhen() >= ":value"', label: '', type: 'date', default: null }
      })
      await tick(wrapper)
      expect(wrapper.find('.stub-date').exists()).toBe(true)
      expect(wrapper.find('.stub-date').attributes('placeholder')).toBe('when')
    })

    it('falls back to the filter key when no label key exists', async () => {
      const wrapper = mountTemplate({
        when: { expression: 'entity.getWhen() >= ":value"', type: 'datetime', default: null }
      })
      await tick(wrapper)
      expect(wrapper.find('.stub-date').exists()).toBe(true)
      expect(wrapper.find('.stub-date').attributes('placeholder')).toBe('when')
    })
  })

  describe('template v-model update handlers', () => {
    it('writes input updates into filterData', async () => {
      const wrapper = mountTemplate({
        name: { expression: 'entity.getName() matches ":value"', label: 'Name', type: 'input', default: null }
      })
      await tick(wrapper)
      wrapper.findComponent('.stub-input').vm.$emit('update:modelValue', 'hello')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.filterData.name).toBe('hello')
    })

    it('writes select updates into filterData', async () => {
      const wrapper = mountTemplate({
        status: {
          expression: 'entity.getStatus() == ":value"',
          label: 'Status',
          type: 'select',
          data: [{ value: 'a', label: 'A' }],
          default: null
        }
      })
      await tick(wrapper)
      wrapper.findComponent('.stub-select').vm.$emit('update:modelValue', 'a')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.filterData.status).toBe('a')
    })

    it('writes date-picker updates into filterData', async () => {
      const wrapper = mountTemplate({
        when: { expression: 'entity.getWhen() >= ":value"', label: 'When', type: 'date', default: null }
      })
      await tick(wrapper)
      wrapper.findComponent('.stub-date').vm.$emit('update:modelValue', '2024-01-01')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.filterData.when).toBe('2024-01-01')
    })

    it('writes switch updates into filterData', async () => {
      const wrapper = mountTemplate({
        enabled: { expression: 'entity.getEnabled() == :value', label: 'Enabled', type: 'boolean', default: false }
      })
      await tick(wrapper)
      wrapper.findComponent('.stub-switch').vm.$emit('update:modelValue', true)
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.filterData.enabled).toBe(true)
    })

    it('writes custom-component updates into filterData', async () => {
      const Custom = { name: 'CustomGap', props: ['modelValue'], template: '<div class="custom-gap" />' }
      const wrapper = mountTemplate({
        custom: { expression: 'entity.getX() == ":value"', label: 'X', component: Custom, default: null }
      })
      await tick(wrapper)
      expect(wrapper.find('.custom-gap').exists()).toBe(true)
      wrapper.findComponent('.custom-gap').vm.$emit('update:modelValue', 'v')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.filterData.custom).toBe('v')
    })
  })
})
