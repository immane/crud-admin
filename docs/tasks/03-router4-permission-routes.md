# Task 03: Router 4 和权限路由迁移

## 目标

将 Vue Router 3 迁移到 Vue Router 4，并保持登录态校验、角色权限、动态路由和路由重置行为稳定。

## 范围

- `src/router/index.js`
- `src/router/generator.js`
- `src/permission.js`
- `src/store/modules/permission.js`
- `src/store/modules/user.js`
- `src/configs/routes.js`

## 前置检查

- Task 02 已完成。
- 已确认生产 base path 是否继续为 `/admin/`。
- 已列出所有动态 route name，避免路由重置时遗漏。

## 实施步骤

1. 使用 `createRouter` 替换 `new Router`。
2. 使用 `createWebHistory('/admin/')` 替换 `mode: 'history'` 和 `base: 'admin'`。
3. 将通配路由 `path: '*'` 改为 `path: '/:pathMatch(.*)*'`。
4. 删除 `Vue.use(Router)`。
5. 将 `router.addRoutes(accessRoutes)` 改为 `router.addRoute(...)`。
6. 实现递归动态路由添加工具函数。
7. 重写 `resetRouter()`，使用 `router.removeRoute(name)` 清理动态路由。
8. 在 `src/router/generator.js` 中用 `import.meta.glob` 替代动态 `require()`。
9. 检查 `src/permission.js` 中 `beforeEach` 逻辑，必要时从 `next` 风格逐步迁到 return 风格。
10. 更新 `src/store/modules/user.js` 中的切换角色和登出路由重置逻辑。

## 验收标准

- 未登录访问受保护页面会跳转登录页。
- 登录成功后能根据 roles 添加动态路由。
- 刷新页面后动态路由能恢复。
- 登出后动态路由被清理。
- 访问不存在路径跳转 404。
- `router.addRoutes` 不再出现。

## 风险

- 父子动态路由添加顺序错误会导致子路由不可访问。
- 动态路由 name 缺失会导致 `removeRoute` 无法清理。
- Vite 无法处理运行时拼接路径的 `import()`，必须使用 `import.meta.glob` 映射。
