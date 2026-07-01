# Task 04: Vuex 4 Store 迁移

## 目标

将 Vuex 3 迁移到 Vuex 4，保留现有状态模块、权限状态、用户状态和 getters 行为。

## 范围

- `src/store/index.js`
- `src/store/getters.js`
- `src/store/modules/*.js`
- 使用 `$store` 的组件

## 前置检查

- Task 03 已完成或 Router 迁移方案已确定。
- 确认本阶段不迁 Pinia。

## 实施步骤

1. 安装并使用 `vuex@4`。
2. 使用 `createStore` 替换 `new Vuex.Store`。
3. 删除 `Vue.use(Vuex)`。
4. 将 `require.context('./modules', true, /\.js$/)` 改为 `import.meta.glob('./modules/*.js', { eager: true })`。
5. 保留现有 module namespace。
6. 检查所有 action 返回值，确保登录、登出、获取用户信息、生成路由仍返回 Promise 或 async 结果。
7. 检查组件中的 `this.$store` 是否可用。
8. 如果 TypeScript 报错，补充最小类型声明，不在本阶段大规模类型化 store。

## 验收标准

- Store 能被 `app.use(store)` 正常注册。
- `store.getters.token`、`store.getters.roles` 可用。
- `user/login`、`user/getInfo`、`user/logout` 可用。
- `permission/generateRoutes` 可用。
- 所有 store module 都能被自动加载。

## 风险

- `import.meta.glob` 的模块默认导出读取方式和 `require.context` 不同。
- Vuex 4 API 基本兼容，但 TypeScript 类型暴露方式不同。
- 如果同时迁 Pinia，会放大权限回归风险，因此本阶段不做。
