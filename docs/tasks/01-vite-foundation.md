# Task 01: Vite 基建迁移

## 目标

将项目从 Vue CLI/Webpack 构建链路迁移到 Vite，为后续 Vue3 迁移建立可启动、可构建的基础环境。

## 范围

- `package.json`
- `vite.config.ts`
- `index.html`
- `.env.development`
- `.env.production`
- `.env.staging`
- `tsconfig.json`
- `public/`
- `vue.config.js`

## 前置检查

- 记录当前 `npm run lint`、`npm run type-check`、`npm run test:unit`、`npm run build:prod` 的结果。
- 确认 `src/background.js` 是否仍需支持 Electron。
- 确认生产部署 base path 是否继续使用 `/admin/`。

## 实施步骤

1. 新增 `vite.config.ts`。
2. 配置 `@vitejs/plugin-vue` 和 `@vitejs/plugin-vue-jsx`。
3. 配置 `@` alias 指向 `src`。
4. 配置 Vite `base`，开发环境使用 `/`，生产环境使用 `/admin/`。
5. 将 `vue.config.js` 中的 `/api`、`/system` proxy 迁移到 `server.proxy`。
6. 将 `public/index.html` 迁移为根目录 `index.html`。
7. 替换 HTML 中的 Vue CLI 模板变量，例如 `<%= BASE_URL %>` 和 `<%= webpackConfig.name %>`。
8. 将环境变量从 `VUE_APP_*` 改为 `VITE_*`。
9. 更新 `package.json` scripts：`dev`、`build`、`preview`、`type-check`。
10. 移除 Vue CLI/Webpack 专属依赖。
11. 新增 Vite、Vue 插件、Vue TS 检查相关依赖。

## 验收标准

- `npm run dev` 能启动 Vite dev server。
- `index.html` 能正确挂载 `#app`。
- Vite 能识别 `@/` 路径别名。
- `/api` 和 `/system` 代理仍然可用。
- `npm run build` 至少进入 Vite 构建流程，不再依赖 `vue-cli-service`。

## 风险

- 旧的 Webpack 特性暂时仍会报错，例如 `require.context`、动态 `require()`。
- 本任务只迁构建基础，不要求业务页面全部可运行。
