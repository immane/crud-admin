/* Layout */
/**
 * Easy admin route generator
 * g: generator
 * r: redirect
 */
import inflectFactory from 'i'

const inflect = inflectFactory(true)
const viewComponents = import.meta.glob('../views/**/*.vue')

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
  const formComponent = viewComponents[`../views/${entityPath}/form.vue`]
  const listComponent = viewComponents[`../views/${entityPath}/list.vue`]
  return [{
    path: `/${entityPath}/create`,
    name: `${entityName}Create`,
    hidden: true,
    component: component || formComponent
  },
  {
    path: `/${entityPath}/:id/update`,
    name: `${entityName}Update`,
    hidden: true,
    component: formComponent
  },
  {
    path: `/${entityPath}/list`,
    name: `${entityName}List`,
    component: listComponent,
    meta: meta
  }
  ]
}
