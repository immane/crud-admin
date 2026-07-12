import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import ElementPlus from 'element-plus'
import Breadcrumb from '@/components/Breadcrumb/index.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'dashboard', meta: { title: 'Dashboard' }, component: { template: '<div />' } },
  {
    path: '/menu',
    name: 'menu',
    component: { template: '<router-view />' },
    children: [{
      path: 'menu1',
      name: 'menu1',
      meta: { title: 'menu1' },
      component: { template: '<router-view />' },
      children: [{
        path: 'menu1-1',
        name: 'menu1-1',
        meta: { title: 'menu1-1' },
        component: { template: '<div />' }
      }, {
        path: 'menu1-2',
        name: 'menu1-2',
        redirect: 'noredirect',
        meta: { title: 'menu1-2' },
        component: { template: '<router-view />' },
        children: [{ path: 'menu1-2-1', name: 'menu1-2-1', meta: { title: 'menu1-2-1' }, component: { template: '<div />' } }, { path: 'menu1-2-2', name: 'menu1-2-2', component: { template: '<div />' } }]
      }]
    }]
  }
]

describe('Breadcrumb.vue', () => {
  const router = createRouter({ history: createMemoryHistory(), routes })
  const wrapper = mount(Breadcrumb, { global: { plugins: [router, ElementPlus] } })

  async function navigate(path) {
    await router.push(path)
    await router.isReady()
    await wrapper.vm.$nextTick()
  }

  it('renders dashboard breadcrumb', async() => {
    await navigate('/dashboard')
    expect(wrapper.findAll('.el-breadcrumb__inner')).toHaveLength(1)
  })

  it('renders nested route breadcrumbs', async() => {
    await navigate('/menu/menu1/menu1-2/menu1-2-1')
    expect(wrapper.findAll('.el-breadcrumb__inner')).toHaveLength(4)
    expect(wrapper.findAll('.el-breadcrumb__inner').at(3).find('a').exists()).toBe(false)
  })

  it('omits routes without meta.title', async() => {
    await navigate('/menu/menu1/menu1-2/menu1-2-2')
    expect(wrapper.findAll('.el-breadcrumb__inner')).toHaveLength(3)
  })
})
