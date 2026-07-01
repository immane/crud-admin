# Vue3 + TSX + Vite 迁移方案

## 目标

将当前 Vue2 + Vue CLI + Element UI 管理后台迁移到 Vue3 + TSX + Vite，同时尽量保持现有业务行为、路由权限、CRUD 配置体系和接口协议稳定。

本次迁移不建议一次性重写。项目体量不大，但存在动态路由、动态组件加载、Element UI 组件体系、Vuex 权限状态、EasyAdmin 配置化 CRUD 等运行时行为，适合分阶段原地迁移。

## 当前项目判断

当前技术栈：

- `vue@2.6.11`
- `vue-router@3.0.6`
- `vuex@3.1.0`
- `element-ui@2.13.2`
- `@vue/cli-service@4.4.4`
- `jest` + `vue-jest` + `@vue/test-utils@1`
- 混合 `js/ts`，入口实际是 `src/main.js`，`src/main.ts` 只是转发

核心目录：

- `src/main.js`：应用入口和全局插件注册
- `src/router/index.js`：基础路由、动态路由、权限路由入口
- `src/router/generator.js`：EasyAdmin 路由生成器
- `src/store/index.js`：Vuex 自动加载模块
- `src/permission.js`：登录态、角色、动态路由守卫
- `src/components/EasyAdmin/*`：配置化 CRUD 核心组件
- `src/configs/*`：实体、路由和集合配置
- `src/icons/index.js`：Webpack svg sprite 注册
- `src/utils/request.ts`：Axios 封装和 UI 错误提示

需要先确认的遗留点：

- `src/background.js` 看起来是 Electron 入口，但 `package.json` 没有 Electron 构建脚本和依赖。若当前不使用 Electron，建议本轮迁移排除或清理；若要保留，需要单独引入 Vite Electron 构建方案。

## 推荐目标栈

第一阶段目标：

- `vue@3`
- `vite`
- `typescript`
- `@vitejs/plugin-vue`
- `@vitejs/plugin-vue-jsx`
- `vue-router@4`
- `vuex@4`
- `element-plus`
- `vitest`
- `@vue/test-utils@2`

说明：

- Store 第一阶段建议迁到 `vuex@4`，不要同时迁 Pinia，降低权限和动态路由回归风险。
- TSX 不建议一次性替换全部 `.vue`。先让 Vue3 + Vite 稳定运行，再把动态渲染复杂的局部组件逐步抽成 TSX。
- UI 库建议从 `element-ui` 迁到 `element-plus`，因为现有模板大量使用 `el-*` 组件，迁移成本最低。

## 总体迁移策略

采用 7 个阶段推进：

1. 构建基建迁移到 Vite
2. Vue3 应用入口和全局插件迁移
3. Router 4 和动态权限路由迁移
4. Vuex 4 过渡迁移
5. Element Plus 组件体系迁移
6. EasyAdmin 专项迁移
7. 测试、类型、构建和回归验收

每个阶段都应保证至少能通过构建，最好能启动本地页面做烟测。

## 阶段一：Vite 基建迁移

目标：替换 Vue CLI/Webpack 构建链路，但尽量不改业务逻辑。

新增或调整文件：

- 新增 `vite.config.ts`
- 调整根目录 `index.html`
- 调整 `package.json` scripts 和依赖
- 调整 `.env.*` 变量名
- 调整 `tsconfig.json`

关键改造：

- `vue.config.js` 中的 `publicPath` 对应 Vite `base`。
- 当前生产路径是 `/admin/`，建议 Vite 配置为 `base: mode === 'development' ? '/' : '/admin/'`。
- `devServer.proxy` 迁移到 `server.proxy`，保留 `/api` 和 `/system` 代理。
- `@` alias 继续指向 `src`。
- `public/index.html` 改为 Vite 根目录 `index.html`，标题不再使用 `<%= webpackConfig.name %>`。
- `process.env.VUE_APP_*` 改为 `import.meta.env.VITE_*`。

依赖替换建议：

- 移除 `@vue/cli-service`、`@vue/cli-plugin-*`、`vue-template-compiler`、Webpack 专属插件。
- 新增 `vite`、`@vitejs/plugin-vue`、`@vitejs/plugin-vue-jsx`、`vue-tsc`。
- `sass` 可保留并升级到较新版本。

脚本建议：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit"
  }
}
```

环境变量映射：

- `VUE_APP_BASE_API` -> `VITE_BASE_API`
- `VUE_APP_API_PREFIX` -> `VITE_API_PREFIX`
- `VUE_APP_AUTH_API_PREFIX` -> `VITE_AUTH_API_PREFIX`
- `VUE_APP_SYSTEM_API_PREFIX` -> `VITE_SYSTEM_API_PREFIX`
- `VUE_APP_TINYMCE_SRC` -> `VITE_TINYMCE_SRC`

## 阶段二：Vue3 入口迁移

目标：让应用使用 Vue3 `createApp` 启动。

重点文件：

- `src/main.js`
- `src/main.ts`
- `src/App.vue`
- `src/icons/index.js`
- `src/shims-vue.d.ts`

关键改造：

- 将实际入口统一到 `src/main.ts`。
- `new Vue({ render: h => h(App) })` 改为 `createApp(App).mount('#app')`。
- `Vue.use(...)` 改为 `app.use(...)`。
- `Vue.prototype.xxx` 改为 `app.config.globalProperties.xxx`。
- 全局组件 `Vue.component('svg-icon', SvgIcon)` 改为 `app.component('SvgIcon', SvgIcon)`。

需要关注的全局插件：

- `element-ui` 替换为 `element-plus`。
- `vue-baidu-map` 是 Vue2 插件，需要确认 Vue3 兼容替代库或封装为局部组件。
- `v-fit-columns` 需要确认 Vue3 兼容性，不兼容则替换为自定义 directive。
- `@vuejs-community/vue-filter-date-format` 不建议保留，Vue3 已移除 filters，改为本地格式化函数。
- `vue-json-editor`、`vue-prism-editor` 需要确认 Vue3 兼容替代包。

## 阶段三：Vue Router 4 迁移

目标：保留权限路由行为，迁移 Router API。

重点文件：

- `src/router/index.js`
- `src/router/generator.js`
- `src/permission.js`
- `src/store/modules/user.js`

关键改造：

- `new Router(...)` 改为 `createRouter(...)`。
- `mode: 'history'` 改为 `history: createWebHistory('/admin/')`。
- `path: '*'` 改为 `path: '/:pathMatch(.*)*'`。
- `router.addRoutes(accessRoutes)` 改为递归执行 `router.addRoute(route)`。
- `resetRouter()` 不能再替换 `router.matcher`，需要维护动态路由 name 列表并调用 `router.removeRoute(name)`。
- 路由守卫可以继续使用 `beforeEach`，但 `next` 风格建议逐步改成 return 风格。

动态路由加载风险：

- `src/router/generator.js` 里使用 `require('../views/' + entityPath + '/form.vue')`，Vite 不支持这种运行时拼接 require。
- 建议用 `import.meta.glob('../views/**/*.vue')` 建立组件映射，再按路径取组件。

动态路由添加建议：

```ts
function addDynamicRoutes(routes) {
  routes.forEach(route => {
    router.addRoute(route)
  })
}
```

如果存在 children，需要保证父路由先添加，或直接添加完整 route tree。

## 阶段四：Vuex 4 过渡迁移

目标：最小成本保留现有状态模型。

重点文件：

- `src/store/index.js`
- `src/store/modules/*.js`
- `src/store/getters.js`

关键改造：

- `new Vuex.Store(...)` 改为 `createStore(...)`。
- `Vue.use(Vuex)` 删除。
- `require.context('./modules', true, /\.js$/)` 改为 `import.meta.glob('./modules/*.js', { eager: true })`。
- 现有 namespaced modules、actions、mutations、getters 可以大体保留。

建议：

- 先不要迁 Pinia。
- Vue3 跑稳后，如需现代化再单独做 Vuex -> Pinia。

## 阶段五：Element Plus 迁移

目标：替换 Element UI 2，保证页面组件行为可用。

重点文件：

- `src/main.js` 或 `src/main.ts`
- `src/permission.js`
- `src/utils/request.ts`
- `src/components/EasyAdmin/ui/feedback.ts`
- 所有使用 `el-*` 的 `.vue` 文件

API 替换：

- `import ElementUI from 'element-ui'` -> `import ElementPlus from 'element-plus'`
- `import 'element-ui/lib/theme-chalk/index.css'` -> `import 'element-plus/dist/index.css'`
- `Message` -> `ElMessage`
- `Loading.service` -> `ElLoading.service`

模板语法替换：

- `:visible.sync="dialog.show"` -> `v-model="dialog.show"`
- `:current-page.sync="pager.page"` -> `v-model:current-page="pager.page"`
- `:filter.sync="filter"` -> `v-model:filter="filter"`
- `@click.native="handler"` -> `@click="handler"`
- `slot="footer"` -> `#footer`
- `slot="prefix"` -> `#prefix`
- `slot-scope="scope"` -> `#default="scope"`
- `@onConfirm` -> `@confirm`

图标风险：

- 当前大量使用 `el-icon-*` 字符串，例如 `el-icon-goods`、`el-icon-edit`。
- Element Plus 推荐 `@element-plus/icons-vue` 组件图标。
- 为降低风险，第一阶段可以保留 class 字符串并补兼容样式；第二阶段逐步替换为图标组件。

## 阶段六：EasyAdmin 专项迁移

目标：迁移配置化 CRUD 运行时能力。

这是整个升级中风险最高的部分，建议独立分支或独立 PR 处理。

重点文件：

- `src/components/EasyAdmin/ListAdmin.vue`
- `src/components/EasyAdmin/FormAdmin.vue`
- `src/components/EasyAdmin/SearchFilter.vue`
- `src/components/EasyAdmin/plugins/form/*.vue`
- `src/components/EasyAdmin/plugins/list/editable-plain.vue`
- `src/components/EasyAdmin/ui/feedback.ts`

必须处理的问题：

- Vue2 filters：`boolFilter`、`boolDisplay`、`htmlStrip`、`dateFormat` 都要改成 methods 或工具函数。
- `value/input` v-model 协议改成 `modelValue/update:modelValue`。
- `this.$set(...)` 改成直接赋值。
- 动态 `require()` 改成静态可分析的 `import.meta.glob`。
- Vue2 JSX 的 `scopedSlots` 改成 Vue3 slots 写法。
- `nativeOnClick`、`slot='reference'` 等 Vue2 JSX 写法要改成 Vue3 TSX 写法。

建议拆分顺序：

1. 先迁 `SearchFilter.vue`，因为它依赖少，但包含 `.sync`、`$set` 和 v-model 协议。
2. 再迁 `FormAdmin.vue`，重点是动态表单插件加载和 `modelValue`。
3. 再迁 `ListAdmin.vue`，重点是 slots、filters、dialog、pagination、动态 action。
4. 最后迁 `plugins/form/*.vue` 和 `plugins/list/*.vue`。

动态插件加载建议：

```ts
const formPlugins = import.meta.glob('./plugins/form/*.vue', { eager: true })

function resolveFormPlugin(type) {
  const typeMapping = {
    images: 'image',
    ManyToOne: 'RelationToOne',
    OneToOne: 'RelationToOne',
    ManyToMany: 'RelationToMany',
    OneToMany: 'RelationToMany'
  }
  const targetType = typeMapping[type] || type
  return formPlugins[`./plugins/form/${targetType}.vue`]?.default || formPlugins['./plugins/form/input.vue'].default
}
```

TSX 引入建议：

- 不建议把 `ListAdmin.vue` 一次性整体改成 TSX。
- 优先把动态列渲染、动态 action、dialog form action 抽成小型 TSX 子组件。
- `src/layout/components/Sidebar/Item.vue` 已使用 JSX render，可作为第一批 TSX 改造对象。
- 对业务页面如 `src/views/admin/list.vue`、`src/views/user/list.vue`，先保留 SFC 模板。

## 阶段七：测试和质量保障

目标：替换 Vue2 测试工具链，建立升级后的回归保障。

当前测试文件：

- `tests/unit/components/*.spec.js`
- `tests/unit/utils/*.spec.js`

建议迁移：

- `jest` -> `vitest`
- `@vue/test-utils@1` -> `@vue/test-utils@2`
- `vue-jest` -> 不再需要，由 Vite/Vitest 插件处理
- `jest.config.js` -> `vitest.config.ts` 或复用 `vite.config.ts` test 配置

优先迁移顺序：

1. 工具函数测试：`validate`、`formatTime`、`parseTime`、`param2Obj`、`entity`。
2. 基础组件测试：`Hamburger`、`Breadcrumb`、`SvgIcon`。
3. EasyAdmin 烟测：筛选生成、表格渲染、表单默认值、表单提交、动态插件解析。
4. 请求封装测试：`request.ts` 中 `ElMessage` mock 和 axios interceptor。

## 文件级改造清单

优先级 P0：启动和构建必改

- `package.json`
- `vite.config.ts`
- `index.html`
- `.env.development`
- `.env.production`
- `tsconfig.json`
- `src/main.ts`
- `src/router/index.js`
- `src/store/index.js`
- `src/icons/index.js`

优先级 P1：页面可运行必改

- `src/permission.js`
- `src/store/modules/user.js`
- `src/router/generator.js`
- `src/utils/request.ts`
- `src/api/prefix.ts`
- `src/utils/simple-image-process.js`
- `src/components/SvgIcon/index.vue`
- `src/layout/**/*.vue`
- `src/views/login/index.vue`

优先级 P2：CRUD 功能必改

- `src/components/EasyAdmin/ListAdmin.vue`
- `src/components/EasyAdmin/FormAdmin.vue`
- `src/components/EasyAdmin/SearchFilter.vue`
- `src/components/EasyAdmin/plugins/**/*.vue`
- `src/configs/entities.js`
- `src/configs/routes.js`

优先级 P3：后续现代化

- Vuex -> Pinia
- Options API -> Composition API
- 局部动态渲染 -> TSX 子组件
- 图标 class -> `@element-plus/icons-vue`
- Jest -> Vitest 全量覆盖

## 回归验收清单

本地启动：

- `npm run dev` 能启动 Vite dev server。
- `/admin/` 或开发环境根路径能正确打开。
- 控制台无 Vue runtime error。
- HMR 正常。

构建：

- `npm run type-check` 通过。
- `npm run build` 通过。
- `npm run preview` 能访问构建产物。
- 静态资源路径在 `/admin/` base 下正确。

登录和权限：

- 未登录访问受保护页面跳转登录页。
- 登录成功后获取用户信息和 roles。
- 根据 roles 添加动态路由。
- 刷新页面后动态路由仍能恢复。
- 登出后 token、roles、动态路由、tags view 清理正确。

布局和导航：

- Sidebar 菜单渲染正确。
- Breadcrumb 正确显示和跳转。
- Navbar 返回、清缓存、登出可用。
- 移动端侧边栏行为可用。

EasyAdmin：

- 列表页能加载结构和数据。
- 筛选条件能生成正确 query。
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
