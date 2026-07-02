# Vue Admin Skeleton

<p align="center">
  <br>
  <b>一个基于 Vue 2.7、Element UI 和 EasyAdmin 的配置驱动后台管理系统</b>
  <br><br>
  <img src="https://img.shields.io/badge/vue-2.7.16-brightgreen?logo=vue.js" alt="Vue 2.7">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/vite-5.x-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/node-%3E%3D14-green?logo=node.js" alt="Node">
  <br><br>
</p>

---

## 概述

**Vue Admin Skeleton** 是一个功能完备、可用于生产环境的后台管理系统脚手架，基于 Vue 2 构建。它提供了一整套企业级功能——认证、基于角色的权限控制、动态路由、标签页导航——以及一个强大的**配置驱动 CRUD 引擎** **EasyAdmin**。

EasyAdmin 消除了样板代码：只需将实体 Schema 定义为类似 JSON 的配置，即可自动生成列表视图（支持筛选、排序、分页、导出）、表单视图（支持验证、动态字段类型、标签页组织）和 CRUD 路由。它内置 17 种可插拔字段类型，并支持自定义渲染函数以实现最大灵活性。

本项目最初基于 [PanJiaChen](https://github.com/PanJiaChen) 的 [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin) 二次开发，已大幅扩展了 EasyAdmin 引擎、后端 API 实体自省和自定义插件系统。

---

## 功能特色

- **配置驱动 CRUD 引擎 (EasyAdmin)** — 在配置中声明实体，即可自动获得完整的列表/表单/路由
- **17+ 种即插即用表单字段** — input、textarea、select、boolean、integer、date、datetime、image、file、JSON、代码编辑器、关联选择器、穿梭框等
- **自动实体自省** — 查询后端 `/system/entities` API，自动推断字段类型、可空性和关联关系
- **基于角色的权限控制** — 通过 Vuex + 路由守卫实现按用户角色过滤的动态路由生成
- **Token 认证** — JWT Bearer token 存储在 Cookie 中，通过 Axios 拦截器自动注入 `Authorization` 请求头
- **标签页导航** — 以标签页形式打开多个页面，支持 keep-alive 缓存
- **响应式布局** — 可折叠侧边栏、面包屑导航、可选固定顶栏
- **环境感知配置** — 独立的 `.env` 文件用于开发、预发布和生产环境
- **Mock 服务器（热更新）** — 在无后端的情况下使用真实 Mock 数据进行开发
- **SVG 雪碧图图标** — 通过 Vite 配置的 SVG sprite loader 实现高性能图标使用
- **代码分割与构建优化** — Vite 驱动的 chunk 分割，支持 tree-shaking、preload 和 CSS 代码分割
- **导出 CSV/Excel** — 内置数据导出功能，支持自定义列标签
- **富文本编辑** — 集成 TinyMCE 组件
- **单元测试** — Jest + Vue Test Utils，带覆盖率报告
- **ESLint + TypeScript** — 代码质量和部分类型检查
- **Electron 支持** — 通过 `src/background.js` 实现可选的桌面端打包

---

## 技术栈

| 分类 | 技术 | 版本 |
|----------|-----------|---------|
| 框架 | Vue.js (Options API + Composition API) | 2.7.16 |
| UI 库 | Element UI | 2.13.2 |
| 状态管理 | Vuex (命名空间模块) | 3.1.0 |
| 路由 | Vue Router (history 模式) | 3.0.6 |
| HTTP | Axios | 0.21.1 |
| 构建 | Vite | 5.x |
| CSS | SCSS (Dart Sass) + PostCSS | — |
| 测试 | Jest 27 + Vue Test Utils | — |
| 代码检查 | ESLint 6 + eslint-plugin-vue | 6.7.2 |
| 语言 | JavaScript + TypeScript | 6.0 |

---

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser / Electron                     │
├─────────────────────────────────────────────────────────────┤
│  App.vue                                                     │
│  ├── permission.js  ← 路由守卫（认证 + 角色检查）             │
│  ├── Layout/        ← 外壳（侧边栏 + 导航栏 + 主内容区）      │
│  │   ├── Navbar     ← 面包屑、用户菜单、标签页                 │
│  │   └── Sidebar    ← 基于路由配置生成的动态菜单               │
│  └── Views/         ← 页面组件                                │
│      ├── admin/list.vue   ──→  ListAdmin.vue                │
│      ├── admin/form.vue   ──→  FormAdmin.vue                │
│      ├── login/                                             │
│      └── dashboard/                                         │
├─────────────────────────────────────────────────────────────┤
│  Store (Vuex)                                                │
│  ├── user        ← 认证 Token、角色、用户信息                   │
│  ├── permission  ← 动态路由生成                                │
│  ├── app         ← 侧边栏状态、设备检测                        │
│  ├── entity      ← 后端实体 Schema 缓存                        │
│  ├── tagsView    ← 已打开标签页状态                            │
│  └── settings    ← 应用配置                                    │
├─────────────────────────────────────────────────────────────┤
│  API 层                                                      │
│  ├── utils/request.ts  ← Axios 实例 + 拦截器                 │
│  ├── utils/entity.ts   ← EntityManage (CRUD 操作)            │
│  └── api/user.ts       ← 认证接口                            │
├─────────────────────────────────────────────────────────────┤
│  EasyAdmin 引擎                                              │
│  ├── FormAdmin.vue     ← 动态表单生成器                       │
│  ├── ListAdmin.vue     ← 动态表格生成器                       │
│  ├── SearchFilter.vue  ← 动态筛选构建器                        │
│  └── plugins/form/     ← 17 个字段类型插件                     │
├─────────────────────────────────────────────────────────────┤
│  配置层                                                      │
│  ├── configs/routes.js       ← 菜单/路由定义                   │
│  ├── configs/collections/    ← 实体 Schema 定义                │
│  └── configs/entities.js     ← 自动加载器                      │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

```
用户登录 → getToken() → router.beforeEach() 检查 token
  ↓
有 token？→ await store.dispatch('user/getInfo') → 获取角色
  ↓
store.dispatch('permission/generateRoutes', roles)
  ↓
router.addRoutes(accessRoutes) → 渲染动态菜单
  ↓
用户访问 /:entityParam/list
  ↓
admin/list.vue 读取 configs/collections/ → 渲染 ListAdmin
  ↓
ListAdmin 调用 EntityManage.list() → Axios GET /manage/{entity}
  ↓
通过 list_display 配置将响应渲染为 Element UI 表格
```

---

## 项目结构

```
crud-admin/
├── public/
│   ├── favicon.ico
│   └── index.html                 # HTML 模板
├── mock/                          # Mock 服务器（仅开发环境）
│   ├── index.js                   # Mock 路由注册
│   ├── mock-server.js             # 基于 Express 的热更新服务器
│   ├── user.js                    # 登录/用户 Mock 数据
│   └── table.js                   # 动态表格 Mock 数据
├── src/
│   ├── api/                       # API 接口定义
│   │   └── user.ts                # login()、getInfo()、logout()
│   ├── assets/                    # 静态资源（图片、字体）
│   ├── components/                # 共享组件
│   │   ├── Breadcrumb/            # 基于路由的面包屑
│   │   ├── EasyAdmin/             # ⭐ 核心 CRUD 引擎
│   │   │   ├── FormAdmin.vue      # 动态表单生成器
│   │   │   ├── ListAdmin.vue      # 动态列表/表格生成器
│   │   │   ├── SearchFilter.vue   # 动态筛选构建器
│   │   │   ├── plugins/form/      # 17 个字段类型插件
│   │   │   │   ├── input.vue
│   │   │   │   ├── textarea.vue
│   │   │   │   ├── select.vue
│   │   │   │   ├── boolean.vue
│   │   │   │   ├── integer.vue
│   │   │   │   ├── date.vue
│   │   │   │   ├── datetime.vue
│   │   │   │   ├── image.vue
│   │   │   │   ├── file.vue
│   │   │   │   ├── array.vue
│   │   │   │   ├── code.vue
│   │   │   │   ├── json.vue
│   │   │   │   ├── json-custom.vue
│   │   │   │   ├── transfer.vue
│   │   │   │   ├── RelationToOne.vue
│   │   │   │   └── RelationToMany.vue
│   │   │   ├── plugins/list/      # 列表插件
│   │   │   │   └── editable-plain.vue
│   │   │   └── ui/
│   │   │       └── feedback.ts    # 通知服务
│   │   ├── Hamburger/             # 侧边栏切换按钮
│   │   ├── SvgIcon/               # SVG 图标组件
│   │   └── Tinymce/               # 富文本编辑器
│   ├── configs/                   # 声明式配置
│   │   ├── index.js               # 配置合并器
│   │   ├── routes.js              # 菜单和路由定义
│   │   ├── entities.js            # 集合配置自动加载器
│   │   └── collections/           # ⭐ 实体 Schema 定义
│   │       └── common/
│   │           └── index.js       # 所有实体 CRUD 配置
│   ├── icons/                     # SVG 图标资源
│   │   ├── index.js               # 全局注册
│   │   ├── svg/                   # 单个 SVG 文件
│   │   └── svgo.yml               # SVGO 优化配置
│   ├── layout/                    # 应用外壳
│   │   ├── index.vue              # 主布局包装器
│   │   ├── components/
│   │   │   ├── AppMain.vue        # <router-view> 包装器
│   │   │   ├── Navbar.vue         # 顶部导航栏
│   │   │   ├── Sidebar/           # 侧边导航
│   │   │   └── index.js
│   │   └── mixin/
│   │       └── ResizeHandler.js   # 响应式侧边栏
│   ├── router/                    # 路由
│   │   ├── index.js               # Vue Router 配置
│   │   └── generator.js           # 路由生成器 g() 和 r()
│   ├── store/                     # Vuex 状态管理
│   │   ├── index.js               # 自动加载 Store 模块
│   │   ├── getters.js
│   │   └── modules/
│   │       ├── app.js             # 侧边栏状态
│   │       ├── entity.js          # 实体 Schema 缓存
│   │       ├── permission.js      # 路由过滤
│   │       ├── settings.js        # 应用设置
│   │       ├── tagsView.js        # 已打开标签页
│   │       └── user.js            # 认证状态
│   ├── styles/                    # 全局样式
│   │   ├── index.scss
│   │   ├── element-ui.scss        # Element UI 样式覆盖
│   │   ├── variables.scss         # 设计 Token
│   │   ├── mixin.scss
│   │   ├── sidebar.scss
│   │   └── transition.scss        # 路由过渡动画
│   ├── types/                     # TypeScript 类型定义
│   │   ├── admin.ts               # FieldOption、EntityConfig 等
│   │   └── api.ts                 # ApiResponse、EntityStructure
│   ├── utils/                     # 工具函数
│   │   ├── auth.js                # 基于 Cookie 的 Token 管理
│   │   ├── entity.ts              # EntityManage CRUD 类
│   │   ├── request.ts             # Axios 实例 + 拦截器
│   │   ├── index.js               # parseTime、formatTime 等
│   │   ├── validate.js            # 输入验证
│   │   ├── exportExcelCsv.js      # CSV 导出工具
│   │   └── get-page-title.js      # 页面标题构建器
│   ├── views/                     # 页面视图
│   │   ├── admin/
│   │   │   ├── list.vue           # 通用 CRUD 列表页
│   │   │   └── form.vue           # 通用 CRUD 表单页
│   │   ├── dashboard/
│   │   │   └── index.vue          # 控制台
│   │   ├── login/
│   │   │   └── index.vue          # 登录页
│   │   ├── user/
│   │   │   ├── list.vue           # 用户专用列表
│   │   │   └── form.vue           # 用户专用表单
│   │   └── 404.vue
│   ├── App.vue                    # 根组件
│   ├── main.js                    # 应用入口
│   ├── permission.js              # 路由守卫（认证 + 角色）
│   └── settings.js                # 应用标题、布局选项
├── tests/
│   └── unit/
│       ├── components/            # 组件测试
│       └── utils/                 # 工具函数测试
├── .env.development               # 开发环境变量
├── .env.production                # 生产环境变量
├── .env.staging                   # 预发布环境变量
├── .eslintrc.js                   # ESLint 配置
├── .editorconfig                  # 编辑器设置
├── babel.config.js                # Babel 配置
├── jest.config.js                 # Jest 配置
├── tsconfig.json                  # TypeScript 配置
├── vite.config.ts                 # Vite 构建配置
├── package.json
└── .travis.yml                    # CI 配置
```

---

## 快速开始

### 前置要求

- **Node.js** >= 8.9（推荐：12+）
- **npm** >= 3.0.0

### 安装

```bash
# 克隆仓库
git clone <仓库地址>
cd crud-admin

# 安装依赖
npm install
```

### 开发

```bash
# 启动开发服务器（热更新，地址 localhost:9528）
npm run dev
```

开发服务器内置了 **Mock 服务器**，可拦截 API 请求并返回真实模拟数据。前端开发阶段无需后端。

### 代码检查与类型检查

```bash
# 运行 ESLint
npm run lint

# 运行 TypeScript 类型检查
npm run type-check
```

### 测试

```bash
# 运行单元测试
npm run test:unit

# 运行 CI 测试（代码检查 + 单元测试）
npm run test:ci
```

### 构建

```bash
# 生产环境构建
npm run build:prod

# 预发布环境构建
npm run build:stage
```

### 预览生产构建

```bash
npm run preview
```

---

## 配置

### 环境变量

三个环境文件控制构建行为：

| 文件 | 用途 | `VITE_BASE_API` |
|------|---------|-------------------|
| `.env.development` | 开发服务器 | `''`（使用代理） |
| `.env.staging` | 预发布部署 | `/stage-api` |
| `.env.production` | 生产部署 | `''`（相对路径） |

### 应用设置

编辑 `src/settings.js`：

```js
module.exports = {
  title: 'Vue admin skeleton',   // 应用标题
  fixedHeader: true,             // 固定顶部导航栏
  sidebarLogo: false             // 在侧边栏显示 Logo
}
```

### 构建自定义配置

`vite.config.ts` 配置 Vite 构建。关键设置：
- **base**：生产环境为 `/admin/`，开发环境为 `/`
- **Dev Server**：端口 9528，支持 API 代理
- **插件**：`@vitejs/plugin-vue2` + `@vitejs/plugin-vue2-jsx`
- **别名**：`@` → `src/`
- **Define**：编译时注入 `process.env.VITE_*` 环境变量
- **CSS**：SCSS (Dart Sass)，通过 `src/styles/variables.ts` 提供全局变量

---

## EasyAdmin CRUD 引擎

EasyAdmin 是本项目的核心——一个**配置驱动引擎**，能够从声明式实体定义**自动生成 CRUD 界面**。

### 工作原理

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  实体配置          │     │  后端 API         │     │  渲染出的 UI      │
│  (collections/)  │     │  /system/entities │     │                   │
│                  │     │                   │     │  ┌─────────────┐  │
│  fields: [...]   │────▶│  字段类型,        │────▶│  │ ListAdmin   │  │
│  list_display    │     │  可空性,          │     │  │ (表格)       │  │
│  list_filter     │     │  关联关系         │     │  └─────────────┘  │
│                  │     │                   │     │  ┌─────────────┐  │
│                  │     │                   │     │  │ FormAdmin   │  │
│                  │     │                   │     │  │ (表单)       │  │
│                  │     │                   │     │  └─────────────┘  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### 第一步 — 定义实体配置

在 `src/configs/collections/common/index.js` 中：

```js
export default {
  Content: {
    form: {
      fields: [
        'title',
        {
          property: 'category',
          relation_filter: {
            '@filter': 'entity.getType().getSlug() == "content"',
            '@order': 'entity.id|ASC'
          }
        },
        { property: 'cover', type: 'image' },
        'enabled',
        'content'
      ]
    },
    list: {
      query: { '@order': 'entity.id|DESC' },
      list_filter: {
        'category.id': () => {
          return axios
            .get('/api/categories',
              { params: { '@filter': 'entity.getType().getSlug() == "content"' }})
            .then(res =>
              Object.assign({ __label: '分类' },
                ...res.data.map(v => ({ [v.id]: v.name }))))
        }
      },
      list_display: [
        'id',
        { property: 'cover', type: 'image' },
        'category',
        'title',
        'createdTime'
      ]
    }
  }
}
```

### 第二步 — 注册路由

在 `src/configs/routes.js` 中：

```js
import { r } from '@/router/generator'

export default [
  {
    path: '/content',
    name: 'ContentManage',
    component: Layout,
    meta: { title: '内容管理', icon: 'el-icon-document', roles: ['ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Content', '内容')  // 自动生成列表/新增/编辑路由
    ]
  }
]
```

**仅此而已** — 你已经拥有了 `Content` 实体的完整可用的列表页和表单页。

### 路由生成器

两个辅助函数用于创建路由：

| 函数 | 行为 |
|----------|----------|
| `r(entity, title)` | 重定向路由 — 复用 `admin/list.vue` 和 `admin/form.vue`（参数驱动） |
| `g(entity, title)` | 直接路由 — 期望 `views/{entity}/list.vue` 和 `views/{entity}/form.vue`（自定义视图） |

### 字段类型插件

EasyAdmin 内置 17 种字段类型插件，根据实体元数据自动解析：

| 插件 | 类型 | 描述 |
|--------|------|-------------|
| `input.vue` | string | 基础文本输入 |
| `textarea.vue` | text | 多行文本域 |
| `text.vue` | — | 只读文本展示 |
| `select.vue` | — | 下拉选择器 |
| `boolean.vue` | boolean | 开关切换 |
| `integer.vue` | integer | 数字输入 |
| `date.vue` | date | 日期选择器 |
| `datetime.vue` | datetime | 日期时间选择器 |
| `image.vue` | image / images | 图片上传/预览 |
| `file.vue` | — | 文件上传 |
| `array.vue` | array | 数组编辑器 |
| `code.vue` | — | 基于 Prism 的代码编辑器 |
| `json.vue` | — | JSON 编辑器 |
| `json-custom.vue` | — | 自定义 JSON 编辑器 |
| `transfer.vue` | — | 穿梭框组件 |
| `RelationToOne.vue` | ManyToOne / OneToOne | 单选关联 |
| `RelationToMany.vue` | ManyToMany / OneToMany | 多选关联 |

若无匹配插件，则使用 `input.vue` 作为兜底。

### 字段配置参考

`fields` 数组中的每个字段可以是一个简单字符串，也可以是一个详细的对象：

```ts
interface FieldOption {
  property: string           // 实体属性名（必填）
  label?: string             // 覆盖显示标签
  type?: string              // 强制字段类型（image、boolean 等）
  required?: boolean         // 覆盖后端元数据的可空性
  editable?: boolean         // 编辑模式下设为只读
  tab?: string               // 分组到指定标签页
  default_value?: unknown    // 新建模式下的默认值
  field_options?: object     // 传递给 el-form-item 的 Props
  field_events?: object      // 绑定到 el-form-item 的事件
  type_options?: object      // 传递给字段插件的 Props
  type_events?: object       // 绑定到字段插件的事件
  relation_filter?: object   // 关联查询的筛选条件
  component?: object         // 自定义组件（渲染函数或 SFC）
  help?: string              // 字段下方帮助文本
}
```

### 列表配置参考

```ts
interface ListConfig {
  list_display?: FieldConfig[]    // 要显示的列
  list_filter?: object            // 筛选配置
  query?: object                  // 默认查询参数
  disabled_actions?: string[]     // 隐藏操作：new、edit、delete、lines、export
  data_processor?: Function       // 转换拉取的数据
  actions?: object[]              // 自定义操作按钮
  export?: object                 // 导出配置
}
```

### 自定义列组件

使用 JSX 渲染函数实现复杂列渲染：

```js
{
  property: 'amount',
  component: {
    props: ['data'],
    render(h) {
      return <span>{this.data >= 0 ? '+' : ''}{this.data}</span>
    }
  }
}
```

---

## 认证与授权

### Token 流程

```
登录 → POST /api/auth/login → 服务器返回 JWT（access_token + refresh_token）
  ↓
access_token 存入 Cookie（js-cookie）
  ↓
每次请求 → Axios 拦截器添加 Authorization: Bearer <token> 请求头
  ↓
登出 → POST /api/auth/logout（携带 refresh_token）→ 清除 Cookie，重置 Vuex，重置路由
```

### 路由守卫 (`src/permission.js`)

```
router.beforeEach()
  ├── 无 token → 跳转到 /login（白名单除外）
  ├── 有 token → 已在 /login → 跳转到 /
  └── 有 token → 不在 /login
      ├── 已有角色 → 放行
      └── 无角色 → 获取用户信息 → 生成路由 → addRoutes → 放行
```

### 基于角色的路由

路由通过 `meta.roles` 定义所需角色：

```js
{
  path: '/content',
  meta: {
    title: '内容管理',
    roles: ['ROLE_SUPER_ADMIN']    // 仅超级管理员可见
  }
}
```

`permission.js` Vuex 模块根据用户角色过滤 `asyncRoutes`。未定义 `meta.roles` 的路由对所有已认证用户可见。

---

## API 集成

### Axios 实例 (`src/utils/request.ts`)

- **Base URL**：来自环境变量的 `VITE_BASE_API`
- **超时时间**：30 秒
- **请求拦截器**：当 token 存在时，从 Cookie 注入 `Authorization: Bearer <token>` 请求头
- **响应拦截器**：检查 `response.data.code === 0` 或 `200` 判断成功；优雅处理 `204 No Content`；错误时弹出 Element UI `Message`

### API 响应格式

```json
{
  "code": 0,
  "message": "Success",
  "data": { ... },
  "paginator": {
    "totalCount": 42
  }
}
```

### EntityManage 类 (`src/utils/entity.ts`)

封装典型 CRUD 操作：

| 方法 | HTTP | 接口 |
|--------|------|----------|
| `structure()` | GET | `/system/entities/{entity}` |
| `list(params)` | GET | `/manage/{plural}` |
| `retrieve(pk)` | GET | `/manage/{plural}/{pk}` |
| `create(data)` | POST | `/manage/{plural}` |
| `update(pk, data)` | PUT | `/manage/{plural}/{pk}` |
| `delete(pk)` | DELETE | `/manage/{plural}/{pk}` |

### 期望的后端接口

| 接口 | 方法 | 描述 |
|----------|--------|-------------|
| `/api/auth/login` | POST | 用户认证（identifier + password → JWT） |
| `/api/v1/app/users/me` | GET | 当前用户信息 + 角色 |
| `/api/auth/logout` | POST | 使 refresh token 失效 |
| `/system/entities` | GET | 列出所有实体类名 |
| `/system/entities/{entity}` | GET | 实体字段结构（类型、关联、可空性） |
| `/manage/{entity}` | GET | 分页实体列表 |
| `/manage/{entity}/{id}` | GET | 单个实体记录 |
| `/manage/{entity}` | POST | 创建实体记录 |
| `/manage/{entity}/{id}` | PUT | 更新实体记录 |
| `/manage/{entity}/{id}` | DELETE | 删除实体记录 |

---

## 测试

```bash
# 运行所有单元测试
npm run test:unit

# 运行 CI 验证（代码检查 + 测试）
npm run test:ci
```

测试文件位于 `tests/unit/`：
- **组件测试**：Breadcrumb、Hamburger、SvgIcon、EasyAdmin feedback UI
- **工具函数测试**：`request.ts`、`validate.js`、`entity.ts`、`formatTime`、`parseTime`、`param2Obj`

配置文件：`jest.config.js`

---

## 部署

### 构建产物

```
dist/
├── static/
│   ├── css/
│   ├── js/
│   │   └── (哈希命名的 chunk 文件)
│   └── img/
├── favicon.ico
└── index.html
```

### 部署说明

1. 在 `.env.production` 中将 `VITE_BASE_API` 设为你的 API 服务器地址
2. 运行 `npm run build:prod`
3. 将 `dist/` 目录部署到你的 Web 服务器
4. 确保服务器正确处理客户端路由——将所有路径重定向到 `index.html` 以支持 history 模式：
   - **Nginx**：`try_files $uri $uri/ /index.html;`
   - **Apache**：使用 `mod_rewrite` 的 `.htaccess`

---

## Electron

对于桌面端部署，本项目通过 `src/background.js` 包含了 Electron 支持。请参考 Electron 文档获取集成详情。

---

## 许可证

MIT

---

## 致谢

本项目基于以下优秀项目构建：

- [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin) by [PanJiaChen](https://github.com/PanJiaChen) — 原始后台模板
- [vue-admin-template](https://github.com/PanJiaChen/vue-admin-template) — 简化版基础模板
- [Element UI](https://element.eleme.io/) — UI 组件库
