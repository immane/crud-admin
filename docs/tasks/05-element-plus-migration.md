# Task 05: Element Plus 迁移

## 目标

将 Element UI 2 迁移到 Element Plus，保证登录、布局、表单、表格、弹窗、消息提示和加载反馈可用。

## 范围

- `src/main.ts`
- `src/permission.js`
- `src/utils/request.ts`
- `src/components/EasyAdmin/ui/feedback.ts`
- `src/views/**/*.vue`
- `src/layout/**/*.vue`
- `src/components/**/*.vue`
- `src/styles/*`

## 前置检查

- Task 02 已完成。
- 已安装 `element-plus`。
- 已确认图标迁移策略。

## 实施步骤

1. 将 `element-ui` import 替换为 `element-plus`。
2. 将 `element-ui/lib/theme-chalk/index.css` 替换为 `element-plus/dist/index.css`。
3. 将 `Message` 替换为 `ElMessage`。
4. 将 `Loading.service` 替换为 `ElLoading.service`。
5. 替换 `.sync` 语法。
6. 替换 `.native` 事件修饰符。
7. 替换旧 slot 语法：`slot="..."`、`slot-scope="..."`。
8. 替换 Popconfirm 的 `@onConfirm` 为 Element Plus 事件。
9. 检查 Dialog、Pagination、Upload、Form、Select、DatePicker 的 prop 和事件差异。
10. 处理 `el-icon-*` 图标兼容或迁移到 `@element-plus/icons-vue`。

## 重点替换清单

- `:visible.sync="dialog.show"` -> `v-model="dialog.show"`
- `:current-page.sync="pager.page"` -> `v-model:current-page="pager.page"`
- `:filter.sync="filter"` -> `v-model:filter="filter"`
- `@click.native="handler"` -> `@click="handler"`
- `<span slot="footer">` -> `<template #footer>`
- `<template slot-scope="scope">` -> `<template #default="scope">`
- `<i slot="prefix" ... />` -> `<template #prefix><i ... /></template>`

## 验收标准

- 登录页表单校验可用。
- Navbar 下拉菜单可用。
- Sidebar 菜单可用。
- Dialog 可打开、关闭并触发对应事件。
- Message 和 Loading 可用。
- Table、Pagination、Form、Upload 无明显 runtime error。

## 风险

- Element Plus 的部分组件事件名和 slot 名称与 Element UI 不完全一致。
- 图标迁移可能影响菜单和按钮视觉。
- 旧样式中针对 `.el-*` 的覆盖可能需要重新校正。
