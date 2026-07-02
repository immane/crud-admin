# Task 05: Element Plus Migration

## Goal

Migrate from Element UI 2 to Element Plus, ensuring login, layout, forms, tables, dialogs, notifications, and loading feedback work correctly.

## Scope

- `src/main.ts`
- `src/permission.js`
- `src/utils/request.ts`
- `src/components/EasyAdmin/ui/feedback.ts`
- `src/views/**/*.vue`
- `src/layout/**/*.vue`
- `src/components/**/*.vue`
- `src/styles/*`

## Pre-checks

- Task 02 is complete.
- `element-plus` is installed.
- Icon migration strategy is confirmed.

## Implementation Steps

1. Replace `element-ui` imports with `element-plus`.
2. Replace `element-ui/lib/theme-chalk/index.css` with `element-plus/dist/index.css`.
3. Replace `Message` with `ElMessage`.
4. Replace `Loading.service` with `ElLoading.service`.
5. Replace `.sync` syntax.
6. Replace `.native` event modifiers.
7. Replace old slot syntax: `slot="..."`, `slot-scope="..."`.
8. Replace `@onConfirm` on Popconfirm with Element Plus events.
9. Check prop and event differences for Dialog, Pagination, Upload, Form, Select, DatePicker.
10. Handle `el-icon-*` icon compatibility or migrate to `@element-plus/icons-vue`.

## Key Replacement Checklist

- `:visible.sync="dialog.show"` → `v-model="dialog.show"`
- `:current-page.sync="pager.page"` → `v-model:current-page="pager.page"`
- `:filter.sync="filter"` → `v-model:filter="filter"`
- `@click.native="handler"` → `@click="handler"`
- `<span slot="footer">` → `<template #footer>`
- `<template slot-scope="scope">` → `<template #default="scope">`
- `<i slot="prefix" ... />` → `<template #prefix><i ... /></template>`

## Acceptance Criteria

- Login page form validation works.
- Navbar dropdown menu works.
- Sidebar menu works.
- Dialogs open, close, and trigger corresponding events.
- Message and Loading work.
- Table, Pagination, Form, Upload have no obvious runtime errors.

## Risks

- Some Element Plus component event names and slot names differ from Element UI.
- Icon migration may affect menu and button visuals.
- Old style overrides targeting `.el-*` may need recalibration.
