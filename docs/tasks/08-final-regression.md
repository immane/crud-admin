# Task 08: 最终回归和发布准备

## 目标

完成 Vue3 + TSX + Vite 迁移后的端到端人工回归、构建验证和发布准备。

## 范围

- 全项目
- 部署配置
- 接口代理配置
- 静态资源路径
- 登录和权限流程
- CRUD 主流程

## 前置检查

- Task 01 到 Task 07 已完成。
- 本地开发环境可启动。
- 构建和测试命令可执行。

## 回归步骤

1. 执行 `npm run lint`。
2. 执行 `npm run type-check`。
3. 执行 `npm run test`。
4. 执行 `npm run build`。
5. 执行 `npm run preview`。
6. 验证 `/admin/` base path 下静态资源路径正确。
7. 验证未登录访问受保护页面跳转登录页。
8. 验证登录成功后获取用户信息和 roles。
9. 验证动态路由和菜单生成正确。
10. 验证刷新页面后动态路由恢复正确。
11. 验证登出后 token、roles、动态路由、tags view 清理正确。
12. 验证 Dashboard、404、Login 页面。
13. 验证 Sidebar、Breadcrumb、Navbar。
14. 验证 EasyAdmin 列表、筛选、分页、排序。
15. 验证 EasyAdmin 新增、编辑、删除。
16. 验证上传、富文本、JSON、代码编辑、关系字段等特殊表单插件。
17. 验证导出功能。
18. 验证移动端布局和侧边栏行为。

## 发布准备

- 确认生产 `.env.production` 使用 `VITE_*` 变量。
- 确认后端 Nginx 或静态服务支持 history fallback。
- 确认 `/admin/` 子路径部署可用。
- 确认接口代理只用于开发环境，生产使用正确 API base。
- 确认构建产物不包含旧 Vue CLI 注入变量。

## 验收标准

- 所有自动化检查通过。
- 核心人工回归通过。
- 生产 preview 无静态资源 404。
- 控制台无阻断级 runtime error。
- 登录、权限、CRUD 主流程可用。

## 风险

- history 模式在 `/admin/` 子路径下需要服务端 fallback 配置。
- 静态资源 base path 错误会导致生产白屏。
- 动态路由问题可能只在刷新或登出后暴露。
