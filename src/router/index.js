import { createRouter, createWebHistory } from 'vue-router'

/* Layout */
import Layout from '@/layout'
import admin from '@/config'

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  // Constant routes
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index'),
        meta: {
          title: 'Dashboard',
          icon: 'el-icon-s-home'
        }
      }
    ]
  }
]

export const lastRoutes = [
  {
    path: '/:entityParam/create',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',
        name: `EasyAdminCreate`,
        component: () => import('@/views/admin/form')
      }
    ]
  },
  {
    path: '/:entityParam/:id/update',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',
        name: `EasyAdminUpdate`,
        component: () => import('@/views/admin/form')
      }
    ]
  },
  {
    path: '/:entityParam/:id/detail',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',
        name: `EasyAdminDetail`,
        component: () => import('@/views/admin/detail')
      }
    ]
  },
  {
    path: '/:entityParam/list',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',
        name: `EasyAdminList`,
        component: () => import('@/views/admin/list')
      }
    ]
  }
]

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */
export const asyncRoutes = [
  ...admin.routes,
  // 404,page,must be placed at the end !!!
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    hidden: true
  }
]

const createAppRouter = () =>
  createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior: () => ({
      y: 0
    }),
    routes: [...constantRoutes, ...lastRoutes]
  })

const router = createAppRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const staticRouteNames = new Set()
  const collectNames = routes => routes.forEach(route => {
    if (route.name) staticRouteNames.add(route.name)
    if (route.children) collectNames(route.children)
  })
  collectNames([...constantRoutes, ...lastRoutes])
  router.getRoutes().forEach(route => {
    if (route.name && !staticRouteNames.has(route.name)) router.removeRoute(route.name)
  })
}

export default router
