import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import DateTimeCell from '@/easyadmin/ui/vue/plugins/list/datetime.vue'

function mountCell(value) {
  return mount(DateTimeCell, {
    props: { value, field: {}, scope: {}, em: {}, struct: {}},
    global: {
      plugins: [ElementPlus],
      mocks: { $t: (key) => key },
      stubs: { 'el-icon-time': { template: '<i class="stub-time-icon" />' }}
    }
  })
}

function expectedDateTime(value) {
  const date = new Date(value)
  const datePart = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  const timePart = [date.getHours(), date.getMinutes(), date.getSeconds()].map((item) => String(item).padStart(2, '0')).join(':')
  return `${datePart} ${timePart}`
}

describe('list/datetime.vue', () => {
  it('renders nothing for empty values', () => {
    for (const value of [null, undefined, '']) {
      const wrapper = mountCell(value)
      expect(wrapper.find('span').exists()).toBe(false)
      expect(wrapper.text()).toBe('')
    }
  })

  it('renders date and time parts for ISO strings', () => {
    const value = '2024-03-05T10:20:30.000Z'
    const wrapper = mountCell(value)
    expect(wrapper.find('span').exists()).toBe(true)
    expect(wrapper.text()).toContain(expectedDateTime(value))
  })

  it('zero-pads all time segments', () => {
    const value = new Date(2024, 0, 2, 3, 4, 5).getTime()
    expect(mountCell(value).text()).toContain(expectedDateTime(value))
    expect(expectedDateTime(value)).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
  })

  it('supports numeric timestamps', () => {
    const ts = Date.now()
    expect(mountCell(ts).text()).toContain(expectedDateTime(ts))
  })

  it('renders empty text for invalid date strings (but keeps the span)', () => {
    const wrapper = mountCell('not-a-date')
    expect(wrapper.find('span').exists()).toBe(true)
    expect(wrapper.vm.formatDateTime('not-a-date')).toBe('')
    expect(wrapper.text().trim()).toBe('')
  })

  it('renders the time icon alongside the datetime', () => {
    const wrapper = mountCell('2024-03-05T10:20:30.000Z')
    expect(wrapper.find('.stub-time-icon').exists()).toBe(true)
  })

  it('formatDateTime separates date and time with a space', () => {
    const wrapper = mountCell('2024-03-05T10:20:30.000Z')
    const out = wrapper.vm.formatDateTime('2024-12-25T08:09:07Z')
    expect(out).toBe(expectedDateTime('2024-12-25T08:09:07Z'))
    expect(out).toContain(' ')
  })
})
