# Task 07: 测试和质量保障迁移

## 目标

将测试链路从 Jest + Vue2 Test Utils 迁移到 Vitest + Vue3 Test Utils，并建立 Vue3 迁移后的回归保障。

## 范围

- `jest.config.js`
- `tests/unit/**/*.spec.js`
- `package.json`
- `vite.config.ts`
- `.eslintrc.js` 或后续 ESLint 配置
- `tsconfig.json`

## 前置检查

- Task 01 到 Task 06 的主要代码迁移已完成。
- 应用可以本地启动。
- 应用可以进入构建流程。

## 实施步骤

1. 安装 `vitest`、`@vue/test-utils@2`、`jsdom`。
2. 在 `vite.config.ts` 或 `vitest.config.ts` 中配置 test 环境。
3. 移除或停用 `jest.config.js`。
4. 替换 Jest 全局 API 或启用 Vitest globals。
5. 迁移工具函数测试。
6. 迁移基础组件测试：`Hamburger`、`Breadcrumb`、`SvgIcon`。
7. 迁移 `request.ts` 测试，mock axios 和 `ElMessage`。
8. 为 EasyAdmin 增加核心烟测。
9. 更新 `package.json` 的 `test`、`test:unit`、`test:ci` scripts。
10. 检查 lint 和 type-check 是否覆盖 `.vue`、`.ts`、`.tsx`。

## 建议测试优先级

优先级 P0：

- `tests/unit/utils/validate.spec.js`
- `tests/unit/utils/formatTime.spec.js`
- `tests/unit/utils/parseTime.spec.js`
- `tests/unit/utils/param2Obj.spec.js`
- `tests/unit/utils/entity.spec.js`

优先级 P1：

- `tests/unit/components/Hamburger.spec.js`
- `tests/unit/components/Breadcrumb.spec.js`
- `tests/unit/components/SvgIcon.spec.js`
- `tests/unit/utils/request.spec.js`

优先级 P2：

- EasyAdmin 筛选生成烟测
- EasyAdmin 表单默认值烟测
- EasyAdmin 动态插件解析烟测
- EasyAdmin 列表操作烟测

## 验收标准

- `npm run test` 通过。
- `npm run type-check` 通过。
- `npm run build` 通过。
- 关键组件测试不再依赖 Vue2 Test Utils API。
- CI 命令不再调用 `vue-cli-service test:unit`。

## 风险

- Vue Test Utils 2 的 mount API 和 wrapper 行为与 Vue2 版本不同。
- Element Plus 组件测试需要合理 stub。
- 旧 snapshot 可能需要重建，不应盲目保留。
