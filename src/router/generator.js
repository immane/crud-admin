/* Layout */
/**
 * Easy admin route generator
 * g: generator
 * r: redirect
 */
const inflect = require('i')(true)

// eslint-disable-next-line no-unused-vars
export const r = (entityName, title, meta = { title: title, icon: 'el-icon-caret-right' }) => {
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
    meta: meta
  }
  ]
}
// eslint-disable-next-line no-unused-vars
export const g = (entityName, title, meta = { title: title, icon: 'el-icon-caret-right' }, component = null) => {
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
    meta: meta
  }
  ]
}
