import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Easy admin route generator
 * g: generator
 * r: redirect
 */
const inflect = require('i')(true)
const r = (entityName, title, icon = 'el-icon-caret-right') => {
  const entityPath = inflect.dasherize(inflect.underscore(entityName))
  return [{
    path: `/dummy/${entityPath}/create`,
    redirect: `/${entityPath}/create`,
    name: `${entityName}Create`,
    hidden: true
  },
  {
    path: `/dummy/${entityPath}/:id/update`,
    redirect: `/${entityPath}/:id/update`,
    name: `${entityName}Update`,
    hidden: true
  },
  {
    path: `/dummy/${entityPath}/list`,
    redirect: `/${entityPath}/list`,
    name: `${entityName}List`,
    meta: {
      title: title,
      icon: icon
    }
  }
  ]
}
const g = (entityName, title, icon = 'el-icon-caret-right', component = null) => {
  const entityPath = inflect.dasherize(inflect.underscore(entityName))
  return [{
    path: `/${entityPath}/create`,
    name: `${entityName}Create`,
    hidden: true,
    component: async() => component || await require('../views/' + entityPath + '/form.vue') // cannot use import(`@/view/${entityPath}/form`) instead
  },
  {
    path: `/${entityPath}/:id/update`,
    name: `${entityName}Update`,
    hidden: true,
    component: async() => await require('../views/' + entityPath + '/form.vue')
  },
  {
    path: `/${entityPath}/list`,
    name: `${entityName}List`,
    component: async() => await require('../views/' + entityPath + '/list.vue'),
    meta: {
      title: title,
      icon: icon
    }
  }
  ]
}

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
    children: [{
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('@/views/dashboard/index'),
      meta: {
        title: '控制台',
        icon: 'dashboard'
      }
    }]
  }
]

/**
 * Customer Menu
 *
 * Change current section and define your menu and relations here.
 */
export const normalRoutes = [
  // Publish manage
  /*
  {
    path: '/publish', name: 'PublishManage', component: Layout,
    meta: { title: 'Post manage', icon: 'el-icon-upload' },
    children: [
      ...g('Post', 'Post title'), // g for Generate custom page handler.
      ...r('Comment', 'Comment title') // r for Redirect default page handler.
    ]
  },
  */
]

export const lastRoutes = [
  // default admin route
  {
    path: '',
    component: Layout,
    children: [{
      path: `/:entityParam/create`,
      name: `EasyAdminCreate`,
      hidden: true,
      component: () => import('@/views/admin/form')
    },
    {
      path: `/:entityParam/:id/update`,
      name: `EasyAdminUpdate`,
      hidden: true,
      component: () => import('@/views/admin/form')
    },
    {
      path: `/:entityParam/list`,
      name: `EasyAdminList`,
      component: () => import('@/views/admin/list'),
      hidden: true
    }
    ]
  },

  // 404,page,must be placed at the end !!!
  {
    path: '*',
    redirect: '/404',
    hidden: true
  }
]

const createRouter = () => new Router({
  mode: 'history', // require service support
  base: 'admin',
  scrollBehavior: () => ({
    y: 0
  }),
  routes: [...constantRoutes, ...normalRoutes, ...lastRoutes]
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
