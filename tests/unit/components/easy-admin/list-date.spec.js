import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DateCell from '@/easyadmin/ui/vue/plugins/list/date.vue'

function mountCell(value) {
  return mount(DateCell, {
    props: { value, field: {}, scope: {}, em: {}, struct: {}},
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key },
      stubs: { 'el-icon-time': { template: '<i class="stub-time-icon" />' }}
    }
  })
}

function expectedDate(value) {
  const date = new Date(value)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

describe('list/date.vue', () => {
  it('renders nothing for empty values', () => {
    for (const value of [null, undefined, '']) {
      const wrapper = mountCell(value)
      expect(wrapper.find('span').exists()).toBe(false)
      expect(wrapper.text()).toBe('')
    }
  })

  it('renders formatted date for ISO string values', () => {
    const wrapper = mountCell('2024-03-05T10:20:30.000Z')
    expect(wrapper.find('span').exists()).toBe(true)
    expect(wrapper.text()).toContain(expectedDate('2024-03-05T10:20:30.000Z'))
  })

  it('pads month and day with leading zeros', () => {
    expect(wrapper_format('2024-01-09T00:00:00.000Z')).toContain('-01-09')
  })

  function wrapper_format(v) {
    return mountCell(v).text()
  }

  it('supports numeric timestamps', () => {
    const ts = new Date(2023, 4, 7, 12, 0, 0).getTime()
    const wrapper = mountCell(ts)
    expect(wrapper.text()).toContain(expectedDate(ts))
  })

  it('renders empty text for invalid date strings (but keeps the span)', () => {
    const wrapper = mountCell('not-a-date')
    expect(wrapper.find('span').exists()).toBe(true)
    expect(wrapper.vm.formatDate('not-a-date')).toBe('')
    expect(wrapper.text().trim()).toBe('')
  })

  it('renders the time icon alongside the date', () => {
    const wrapper = mountCell('2024-03-05T10:20:30.000Z')
    expect(wrapper.find('.stub-time-icon').exists()).toBe(true)
  })

  it('formatDate is a pure YYYY-MM-DD formatter', () => {
    const wrapper = mountCell('2024-03-05T10:20:30.000Z')
    expect(wrapper.vm.formatDate('2024-12-25T00:00:00Z')).toBe(expectedDate('2024-12-25T00:00:00Z'))
    expect(wrapper.vm.formatDate('not-a-date')).toBe('')
  })
})
