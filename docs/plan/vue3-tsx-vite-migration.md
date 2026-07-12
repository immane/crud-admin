# Vue3 + TSX + Vite Migration Plan

## Goal

Migrate the current Vue2 + Vue CLI + Element UI admin dashboard to Vue3 + TSX + Vite, while maintaining existing business behavior, route permissions, CRUD config system, and API protocol stability.

This migration does not recommend a one-time rewrite. The project is not large, but it has runtime behaviors such as dynamic routing, dynamic component loading, Element UI component system, Vuex permission state, and EasyAdmin config-driven CRUD — making it suitable for phased in-place migration.

## Migration Status

Completed on branch `upgrade/vue3`.

- Vue 3.5, Vue Router 4, Vuex 4 and Element Plus are now the runtime stack.
- The temporary `@vue/compat` bridge was used only for the first boot milestone and has been removed.
- EasyAdmin list, form and detail components now use Vue 3 component models,
  slots and `defineAsyncComponent` plugin loaders.
- `r()` redirects preserve route params under Vue Router 4; generic EasyAdmin
  routes are registered at boot to support direct URLs without a router warning.
- Jest has been replaced by Vitest. The migrated suite has 38 passing tests.
- `npm run lint`, `npm run type-check`, `npm run test` and `npm run build` pass.

## Current Project Assessment

Pre-migration stack:

- `vue@2.6.11`
- `vue-router@3.0.6`
- `vuex@3.1.0`
- `element-ui@2.13.2`
- `@vue/cli-service@4.4.4`
- `jest` + `vue-jest` + `@vue/test-utils@1`
- Mixed `js/ts`, entry is `src/main.js` with `src/main.ts` as a bridge

Core directories:

- `src/main.js`: App entry and global plugin registration
- `src/router/index.js`: Base routes, dynamic routes, permission routes
- `src/router/generator.js`: EasyAdmin route generators
- `src/store/index.js`: Vuex auto-loading module
- `src/permission.js`: Auth, roles, dynamic route guard
- `src/components/EasyAdmin/*`: Config-driven CRUD core components
- `src/configs/*`: Entity, route, and collection configs
- `src/icons/index.js`: Webpack SVG sprite registration
- `src/utils/request.ts`: Axios wrapper and UI error notifications

Current runtime stack:

- `vue@3.5`
- `vue-router@4`
- `vuex@4`
- `element-plus@2`
- `@vitejs/plugin-vue` + `@vitejs/plugin-vue-jsx`
- `vitest` + `@vue/test-utils@2`
- `jsoneditor` direct integration; the Vue 2 wrapper is removed

## Recommended Target Stack

Target stack:

- `vue@3.5`
- `vite`
- `typescript`
- `@vitejs/plugin-vue`
- `@vitejs/plugin-vue-jsx`
- `vue-router@4`
- `vuex@4`
- `element-plus@2`
- `vitest`
- `@vue/test-utils@2`

## Overall Migration Strategy

Proceed in 7 phases:

1. Build infrastructure migration to Vite
2. Vue3 app entry and global plugin migration
3. Router 4 and dynamic permission route migration
4. Vuex 4 transition migration
5. Element Plus component migration
6. EasyAdmin specialized migration
7. Testing, types, build, and regression validation

Each phase should at least pass build; ideally launch the local page for smoke testing.

## Phase 1: Vite Infrastructure Migration

Goal: Replace Vue CLI/Webpack build chain with minimal business logic changes.

Files to add or modify:

- Add `vite.config.ts`
- Modify root `index.html`
- Adjust `package.json` scripts and dependencies
- Adjust `.env.*` variable names
- Adjust `tsconfig.json`

Key changes:

- `vue.config.js` `publicPath` → Vite `base`.
- Production path is `/admin/`, configure Vite as `base: mode === 'development' ? '/' : '/admin/'`.
- Migrate `devServer.proxy` to `server.proxy`, keep `/api` and `/system` proxies.
- `@` alias continues to point to `src`.
- `public/index.html` → Vite root `index.html`.
- `process.env.VUE_APP_*` → `import.meta.env.VITE_*`.

## Phase 2: Vue3 Entry Migration

Goal: Start the app with Vue3 `createApp`.

Files: `src/main.js`, `src/main.ts`, `src/App.vue`, `src/icons/index.js`, `src/shims-vue.d.ts`

Key changes:

- `new Vue({ render: h => h(App) })` → `createApp(App).mount('#app')`
- `Vue.use(...)` → `app.use(...)`
- `Vue.prototype.xxx` → `app.config.globalProperties.xxx`
- `Vue.component('svg-icon', SvgIcon)` → `app.component('SvgIcon', SvgIcon)`

## Phase 3: Vue Router 4 Migration

Goal: Preserve permission routing behavior, migrate Router API.

Files: `src/router/index.js`, `src/router/generator.js`, `src/permission.js`, `src/store/modules/user.js`

Key changes:

- `new Router(...)` → `createRouter(...)`
- `mode: 'history'` → `history: createWebHistory('/admin/')`
- `path: '*'` → `path: '/:pathMatch(.*)*'`
- `router.addRoutes(accessRoutes)` → recursive `router.addRoute(route)`
- `resetRouter()` → maintain dynamic route names and call `router.removeRoute(name)`
- Route guard continues with `beforeEach`, but migrate from `next` to return style gradually

## Phase 4: Vuex 4 Transition Migration

Goal: Minimum cost to preserve existing state model.

Files: `src/store/index.js`, `src/store/modules/*.js`, `src/store/getters.js`

Key changes:

- `new Vuex.Store(...)` → `createStore(...)`
- Remove `Vue.use(Vuex)`
- `require.context(...)` → `import.meta.glob('./modules/*.js', { eager: true })`
- Existing namespaced modules, actions, mutations, getters can largely remain

## Phase 5: Element Plus Migration

Goal: Replace Element UI 2, ensure page component behavior works.

Files: `src/main.js`, `src/permission.js`, `src/utils/request.ts`, `src/components/EasyAdmin/ui/feedback.ts`, all `.vue` files using `el-*`

API changes:

- `import ElementUI from 'element-ui'` → `import ElementPlus from 'element-plus'`
- `Message` → `ElMessage`
- `Loading.service` → `ElLoading.service`
- `:visible.sync="dialog.show"` → `v-model="dialog.show"`
- `slot="footer"` → `#footer`
- `slot-scope="scope"` → `#default="scope"`

## Phase 6: EasyAdmin Specialized Migration

Goal: Migrate config-driven CRUD runtime capabilities.

Files: `ListAdmin.vue`, `FormAdmin.vue`, `SearchFilter.vue`, all plugins, `feedback.ts`

Must handle:

- `value/input` v-model → `modelValue/update:modelValue`
- `this.$set(...)` → direct assignment
- Dynamic `require()` → static `import.meta.glob`
- Vue2 JSX `scopedSlots` → Vue3 slots
- Filters → methods or utility functions

## Phase 7: Testing and Quality Assurance

Goal: Replace Vue2 test toolchain, establish regression guarantees.

Files: All `tests/unit/` files

Migration:

- `jest` → `vitest`
- `@vue/test-utils@1` → `@vue/test-utils@2`
- `jest.config.js` → `vitest.config.ts`

## File-Level Modification Checklist

P0 — Build and boot:
- `package.json`, `vite.config.ts`, `index.html`, `.env.*`, `tsconfig.json`, `src/main.ts`, `src/router/index.js`, `src/store/index.js`, `src/icons/index.js`

P1 — Page rendering:
- `src/permission.js`, `src/store/modules/user.js`, `src/router/generator.js`, `src/utils/request.ts`, `src/api/prefix.ts`, `src/components/SvgIcon/index.vue`, `src/layout/**/*.vue`, `src/views/login/index.vue`

P2 — CRUD functionality:
- `src/components/EasyAdmin/ListAdmin.vue`, `FormAdmin.vue`, `SearchFilter.vue`, `plugins/**/*.vue`, `src/configs/entities.js`, `src/configs/routes.js`

P3 — Future modernization:
- Vuex → Pinia, Options API → Composition API, TSX sub-components, icon classes → `@element-plus/icons-vue`, Jest → Vitest full coverage

## Regression Acceptance Checklist

Local dev:
- `npm run dev` starts Vite dev server
- `/admin/` or root path opens correctly
- No Vue runtime errors in console
- HMR works

Build:
- `npm run type-check` passes
- `npm run build` passes
- Static assets load correctly under `/admin/` base

Login and permissions:
- Unauthenticated access to protected pages → redirect to login
- After login, user info and roles fetched correctly
- Dynamic routes generated based on roles
- Dynamic routes restored after page refresh
- Logout clears token, roles, dynamic routes, and tagsView

Layout:
- Sidebar menu renders correctly
- Breadcrumb displays and navigates correctly
- Mobile sidebar behavior works

EasyAdmin:
- List page loads structure and data
- Filters generate correct query
- 分页、排序可用。
- 新增弹窗可打开。
- 编辑弹窗可打开并回填数据。
- 表单提交 create/update 可用。
- 删除确认可用。
- 图片、文件、日期、布尔、关系字段插件可用。
- 导出功能可用。

测试：

- 工具函数测试通过。
- 基础组件测试通过。
- EasyAdmin 核心烟测通过。

## 主要风险和应对

风险：第三方 Vue2 插件不兼容 Vue3。

应对：逐个确认 `vue-baidu-map`、`vue-json-editor`、`vue-prism-editor`、`v-fit-columns`，不兼容则替换或局部封装。

风险：动态 `require()` 在 Vite 中失效。

应对：统一改为 `import.meta.glob`，不要保留运行时路径拼接加载。

风险：Element Plus 行为和事件名差异导致功能可见但不可用。

应对：对 Dialog、Popconfirm、Pagination、Upload、Form、Message、Loading 建立回归清单。

风险：动态路由重置逻辑变化导致登出或切换角色后路由污染。

应对：明确记录动态路由 name，使用 `router.removeRoute(name)` 清理。

风险：Vue filters 移除导致列表显示异常。

应对：将所有 filters 替换为显式函数，尤其是 `ListAdmin.vue` 的布尔、HTML strip、日期格式化。

风险：一次性 TSX 化导致范围失控。

应对：TSX 只用于动态渲染复杂区域，页面和基础组件先保留 SFC。

## 建议里程碑

里程碑 1：Vite + Vue3 空壳启动

- 完成 Vite 配置、入口迁移、Element Plus 初始接入。
- 首页或登录页能打开。

里程碑 2：登录和权限路由可用

- 完成 Router 4、Vuex 4、权限守卫、动态路由迁移。
- 登录、刷新、登出流程可用。

里程碑 3：布局和基础页面可用

- 完成 Layout、Sidebar、Navbar、Breadcrumb、SvgIcon 迁移。
- Dashboard、404、Login 页面可用。

里程碑 4：EasyAdmin 列表和表单可用

- 完成 `ListAdmin`、`FormAdmin`、`SearchFilter`、plugins 迁移。
- CRUD 主流程可用。

里程碑 5：测试和构建收敛

- 完成 Vitest 迁移。
- `type-check`、`build`、核心测试通过。

## 不建议事项

- 不建议 Vue3、Vite、Pinia、全量 TSX、全量 Composition API 一次性完成。
- 不建议在迁移期间同时更换 UI 设计体系。
- 不建议保留 Vue2 兼容写法作为长期方案。
- 不建议继续依赖运行时 `require()` 或 Webpack 专属能力。
- 不建议在 EasyAdmin 未稳定前大规模重构业务配置。

## 推荐执行命令

迁移前记录当前状态：

```sh
npm run lint
npm run type-check
npm run test:unit
npm run build:prod
```

迁移后目标命令：

```sh
npm run lint
npm run type-check
npm run test
npm run build
```

如现有命令无法通过，应先记录失败原因，避免升级过程中混入旧问题。
