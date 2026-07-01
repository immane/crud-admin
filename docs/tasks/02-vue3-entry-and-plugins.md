# Task 02: Vue3 入口和全局插件迁移

## 目标

将应用启动方式迁移到 Vue3 `createApp`，并完成全局插件、全局属性和全局组件的基础迁移。

## 范围

- `src/main.js`
- `src/main.ts`
- `src/App.vue`
- `src/icons/index.js`
- `src/shims-vue.d.ts`
- `src/utils/request.ts`
- 全局样式入口

## 前置检查

- Task 01 已完成。
- 已确认目标 UI 库使用 `element-plus`。
- 已确认 `vue-baidu-map`、`v-fit-columns`、`vue-json-editor`、`vue-prism-editor` 的 Vue3 替代策略。

## 实施步骤

1. 将实际入口统一为 `src/main.ts`。
2. 删除 `src/main.ts` 中仅转发 `src/main.js` 的写法。
3. 使用 `createApp(App)` 创建应用实例。
4. 将 `new Vue({ ... }).$mount` 或 `el: '#app'` 替换为 `app.mount('#app')`。
5. 将 `Vue.use(...)` 替换为 `app.use(...)`。
6. 将 `Vue.prototype.$getValue` 替换为 `app.config.globalProperties.$getValue`。
7. 将 `Vue.prototype.axios` 替换为 `app.config.globalProperties.axios`，或改为显式 import。
8. 将全局 `svg-icon` 注册改为 `app.component(...)`。
9. 替换 Element UI 初始化为 Element Plus 初始化。
10. 替换全局 CSS import 路径，确保样式在 Vite 中可加载。

## 验收标准

- 应用入口不再引用 `Vue` 构造函数。
- 入口不再使用 `Vue.use`、`Vue.prototype`、`new Vue`。
- 全局样式正常加载。
- `App.vue` 能被 Vue3 正常挂载。
- 控制台无入口级 runtime error。

## 风险

- Vue2 插件可能无法直接 `app.use`。
- Vue3 已移除 filters，依赖 filters 的页面仍需后续任务处理。
- 部分全局属性在 TypeScript 中需要补充类型声明。
