# Task 06: EasyAdmin 专项迁移

## 目标

迁移配置化 CRUD 核心能力，保证列表、筛选、分页、排序、新增、编辑、删除、表单插件和导出功能可用。

## 范围

- `src/components/EasyAdmin/ListAdmin.vue`
- `src/components/EasyAdmin/FormAdmin.vue`
- `src/components/EasyAdmin/SearchFilter.vue`
- `src/components/EasyAdmin/plugins/form/*.vue`
- `src/components/EasyAdmin/plugins/list/editable-plain.vue`
- `src/components/EasyAdmin/ui/feedback.ts`
- `src/views/admin/*.vue`
- `src/views/user/*.vue`

## 前置检查

- Task 05 已完成。
- Element Plus 基础组件已可用。
- Router 和 Store 迁移已完成。

## 实施步骤

1. 迁移 `SearchFilter.vue`。
2. 将 `SearchFilter` 的 `value/input` 协议改成 `modelValue/update:modelValue`。
3. 将 `SearchFilter` 的 `this.$set` 改成直接赋值。
4. 将 `filter.sync` 改为 `v-model:filter`。
5. 迁移 `FormAdmin.vue`。
6. 将 `FormAdmin` 的 `value/input` 协议改成 `modelValue/update:modelValue`。
7. 用 `import.meta.glob` 替换 `FormAdmin` 中的动态插件 `require()`。
8. 迁移 `ListAdmin.vue`。
9. 移除 `ListAdmin.vue` 中的 Vue filters，改为 methods 或工具函数。
10. 替换 `ListAdmin.vue` 中的 slot、Dialog、Pagination、Popconfirm 旧语法。
11. 迁移 `ListAdmin.vue` 中 Vue2 JSX 的 `scopedSlots` 写法。
12. 迁移 `plugins/form/*.vue` 的 v-model 协议和 Element Plus 差异。
13. 迁移 `plugins/list/editable-plain.vue` 的 `.native` 事件。
14. 检查 `src/views/admin/*.vue` 和 `src/views/user/*.vue` 调用 EasyAdmin 的 v-model 协议。

## TSX 拆分建议

- 不要一次性把 `ListAdmin.vue` 整体改为 TSX。
- 优先把动态 action 渲染抽成 TSX 子组件。
- 优先把 dialog form action 渲染抽成 TSX 子组件。
- 保留普通页面和简单模板为 SFC。

## 验收标准

- `admin/list` 页面能加载并显示数据。
- `admin/form` 页面能新增和编辑数据。
- `user/list` 页面能显示用户并打开角色弹窗。
- 筛选条件能生成正确 `@filter`。
- 分页、排序能触发重新请求。
- 动态表单插件能根据字段类型加载。
- 图片、文件、日期、布尔、关系字段可用。
- 删除确认可用。
- 导出功能可用。

## 风险

- EasyAdmin 依赖运行时动态组件加载，Vite 下必须改成静态可分析映射。
- Vue3 移除 filters，会直接影响列表字段显示。
- Vue3 slot 和 TSX 插槽写法不同，容易出现内容不渲染但无明显报错的情况。
- 表单 v-model 协议变化会影响父子组件数据同步。
