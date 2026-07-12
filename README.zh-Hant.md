# crud-admin

<p align="center">
  <b>基於 Vue 3、Element Plus 和 EasyAdmin 的配置驅動後台管理系統</b>
  <br><br>
  <img src="https://img.shields.io/badge/vue-3.5-brightgreen?logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/vite-5.x-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/node-%3E%3D14-green?logo=node.js" alt="Node">
  <br><br>
</p>

> English: [README.md](README.md) · 简体中文: [README.zh-cn.md](README.zh-cn.md) · 日本語: [README.ja.md](README.ja.md)

> 後端： [crud-skeleton](https://github.com/immane/crud-skeleton) — 基於 Symfony 8.1 的 API，含動態查詢引擎和模組化架構

## 介面展示

<p align="center">
  <img src="docs/images/dashboard-sample.jpg" alt="Dashboard" width="32%" />
  <img src="docs/images/list-sample.jpg" alt="List" width="32%" />
  <img src="docs/images/detail-sample.jpg" alt="Detail" width="32%" />
  <br>
  <em>儀表板 · 列表視圖 · 記錄詳情</em>
</p>

## 目錄

- [功能特色](#功能特色)
- [技術棧](#技術棧)
- [國際化](#國際化)
- [專案結構](#專案結構)
- [快速開始](#快速開始)
- [配置](#配置)
- [EasyAdmin CRUD 引擎](#easyadmin-crud-引擎)
- [API 整合](#api-整合)
- [文件](#文件)
- [測試](#測試)
- [部署](#部署)
- [授權](#授權)

## 功能特色

- **配置驅動 CRUD 引擎（EasyAdmin）** — 在配置中宣告實體，即可自動獲得完整的列表/表單/詳情/路由
- **17+ 種即插即用表單欄位** — 文字輸入、文字域、下拉選擇、開關、數字、日期、圖片、檔案、JSON、富文字、關聯選擇器、穿梭框等
- **帶降級鏈的詳情視圖** — `detail/` → `list/` → 純文字插件逐欄位類型降級
- **國際化（i18n）** — 英文、簡體中文、繁體中文、日文；瀏覽器語言自動偵測；導覽列語言切換器；`Accept-Language` 請求標頭和 `_locale` 參數自動注入 API 請求
- **JWT 驗證** — Bearer token 登入，自動刷新 token 輪換，Cookie 持久化，並發請求排隊
- **基於角色的權限控制** — 透過 Vuex + Vue Router 4 按使用者角色過濾動態路由
- **實體自省** — 查詢後端 `/system/entities` 自動推斷欄位類型、可空性和關聯關係
- **動態篩選與排序** — 基於配置驅動的搜尋 UI 生成伺服器端篩選表達式（`@filter`、`@sort`、`@order`）
- **企業儀表板** — 即時訂單/商品/使用者指標、SVG 折線圖、瀏覽器定位天氣元件
- **響應式佈局** — 可折疊側邊欄（SVG 圖示）、麵包屑導覽、可選固定頂欄
- **程式碼分割與建置最佳化** — Vite 驅動的 chunk 分割和 tree-shaking
- **Vitest 單元測試** — 38 項元件和工具函數測試


## 技術棧

| 元件 | 技術 |
|-----------|-----------|
| 框架 | Vue 3.5 |
| UI 庫 | Element Plus 2.9 |
| 狀態管理 | Vuex 4 |
| 路由 | Vue Router 4 |
| HTTP | Axios |
| 建置 | Vite 5 |
| CSS | SCSS (Dart Sass) |
| 圖示 | @element-plus/icons-vue + SVG sprite |
| 測試 | Vitest 2.1 |
| 類型 | TypeScript 6.0 |
| 後端 | [crud-skeleton](https://github.com/immane/crud-skeleton) (Symfony 8.1) |

## 國際化

系統首次載入時偵測瀏覽器語言，並透過 `localStorage` 持久化選擇。導覽列中的下拉選單可隨時切換語言——切換時會清除實體快取並重新整理頁面。

| 語言 | 代碼 | Element Plus | API Header |
|--------|------|-------------|------------|
| English（預設） | `en` | en | `Accept-Language: en`, `_locale=en` |
| 中文 (簡體) | `zh` | zh-cn | `Accept-Language: zh`, `_locale=zh` |
| 中文 (繁體) | `zh-Hant` | zh-tw | `Accept-Language: zh-Hant`, `_locale=zh-Hant` |
| 日本語 | `ja` | ja | `Accept-Language: ja`, `_locale=ja` |

翻譯鍵直接使用英文字串（扁平格式），如 `$t('New / Edit')`。新增語言只需新建 `src/i18n/{代碼}.js` 檔案並在導覽列下拉選單中增加一項。

## 專案結構

```text
.
├── src/
│   ├── main.js                      # 應用入口：createApp、安裝插件、掛載
│   ├── permission.js                # 路由守衛（驗證 + 角色檢查）
│   ├── components/EasyAdmin/        # ⭐ 核心 CRUD 引擎
│   │   ├── FormAdmin.vue            # 動態表單生成器
│   │   ├── ListAdmin.vue            # 動態列表/表格生成器
│   │   ├── DetailAdmin.vue          # 可配置記錄詳情頁
│   │   ├── SearchFilter.vue         # 動態篩選 UI
│   │   └── plugins/
│   │       ├── form/                # 17 個欄位類型插件
│   │       ├── list/                # 9 個列表渲染插件
│   │       └── detail/              # 2 個詳情專用插件
│   ├── configs/                     # 宣告式實體配置
│   │   ├── routes.js                # 選單/路由定義
│   │   ├── entities.js              # 自動載入器（import.meta.glob）
│   │   └── collections/             # 實體 Schema（7 個包，22 個實體）
│   ├── i18n/                        # 語言檔案（en、zh、zh-Hant、ja）
│   │   └── index.js                 # i18n 插件 + 瀏覽器語言偵測
│   ├── icons/                       # SVG 雪碧圖 + 舊圖示相容對應
│   ├── layout/                      # 側邊欄 + 導覽列 + 主內容區
│   ├── router/                      # Vue Router 4 + r()/g() 生成器
│   ├── store/                       # Vuex 4（自動載入 modules/）
│   ├── styles/                      # 全域 SCSS（側邊欄、過渡、覆寫）
│   ├── utils/                       # auth.js、entity.ts、request.ts 等
│   └── views/                       # 頁面視圖
│       ├── admin/                   # 通用 CRUD（list + form + detail）
│       ├── dashboard/               # 企業儀表板
│       └── login/                   # 登入頁
├── tests/unit/                      # 38 項 Vitest 測試
├── docs/                            # 設計合約 + AI 上下文
│   └── ai/context.md                # AI 助手參考文件
├── vite.config.ts                   # Vite 5 + Vue 3 + JSX 配置
├── vitest.config.ts                 # Vitest 配置
├── tsconfig.json
└── package.json
```

## 快速開始

### 前置要求

- **Node.js** >= 14.18
- **npm** >= 6.0.0

### 1) 複製

```bash
git clone https://github.com/immane/crud-admin.git
cd crud-admin
```

### 2) 安裝

```bash
npm install
```

### 3) 配置環境變數

複製並編輯開發環境檔案：

```bash
cp .env.example .env.development
```

關鍵變數：

```dotenv
VITE_BASE_API=
VITE_PROXY_TARGET=http://127.0.0.1:8000
VITE_API_PREFIX=/api/v1
VITE_AUTH_API_PREFIX=/api/auth
VITE_SYSTEM_API_PREFIX=/system
```

### 4) 執行

```bash
npm run dev          # 開發（localhost:9528，熱更新）
npm run build        # 生產建置
npm run lint         # ESLint
npm run type-check   # TypeScript 類型檢查
npm run test         # Vitest
```

## 配置

### 環境檔案

| 檔案 | 用途 |
|------|---------|
| `.env.development` | 開發伺服器（無建置產物） |
| `.env.staging` | 預發布建置 |
| `.env.production` | 生產建置 |

### 環境變數

| 變數 | 描述 | 預設值 |
|----------|-------------|---------|
| `VITE_BASE_API` | API 基礎 URL | `''` |
| `VITE_PROXY_TARGET` | 開發代理目標 | — |
| `VITE_API_PREFIX` | 業務 API 前綴 | `/api/v1` |
| `VITE_AUTH_API_PREFIX` | 驗證 API 前綴 | `/api/auth` |
| `VITE_SYSTEM_API_PREFIX` | 系統 API 前綴 | `/system` |
| `VITE_TINYMCE_SRC` | TinyMCE 腳本源 | `''` |

### 建置自訂配置

`vite.config.ts` 關鍵設定：
- **base**：生產環境 `/admin/`，開發環境 `/`
- **開發代理**：`/api`、`/system`、`/upload`、`/uploads` 代理至 `VITE_PROXY_TARGET`
- **插件**：`@vitejs/plugin-vue` + `@vitejs/plugin-vue-jsx`
- **別名**：`@` → `src/`
- **Define**：編譯時注入 `process.env.VITE_*`

## EasyAdmin CRUD 引擎

EasyAdmin 是本專案的核心——一個**配置驅動引擎**，能夠根據宣告式實體定義**自動生成 CRUD 介面**。

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  實體配置          │     │  後端 API         │     │  渲染出的 UI       │
│  (collections/)  │     │  /system/entities │     │                   │
│                  │     │                   │     │  ┌─────────────┐  │
│  fields: [...]   │────▶│  欄位類型、        │────▶│  │ ListAdmin   │  │
│  list_display    │     │  可空性、          │     │  │ (表格)       │  │
│  list_filter     │     │  關聯關係          │     │  └─────────────┘  │
│  detail_display  │     │                   │     │  ┌─────────────┐  │
│                  │     │                   │     │  │ FormAdmin   │  │
│                  │     │                   │     │  │ (表單)       │  │
│                  │     │                   │     │  └─────────────┘  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### 第一步 — 定義實體配置

在 `src/configs/collections/common/Content.js` 中：

```js
import { t } from '@/i18n'

export default {
  Content: {
    form: {
      fields: [
        'title',
        { property: 'category', required: false },
        { property: 'tags', required: false }
      ]
    },
    list: {
      query: { '@order': 'entity.id|DESC' },
      list_filter: {
        title: t('Title'),
        'category.id': () => axios
          .get('/api/v1/manage/categories')
          .then(res => Object.assign({ __label: t('Category') }, ...res.data.map(v => ({ [v.id]: v.name }))))
      },
      list_display: ['id', 'title', 'category', 'tags', 'createdAt']
    },
    detail: {
      detail_display: ['id', 'title', 'category', 'tags', 'body', 'createdAt']
    }
  }
}
```

### 第二步 — 註冊路由

在 `src/configs/routes.js` 中：

```js
import { r } from '@/router/generator'
import { t } from '@/i18n'
{
  path: '/content', component: Layout,
  meta: { title: t('Content Management'), icon: 'el-icon-notebook' },
  children: [...r('Content', t('Content'))]
}
```

**僅此而已** — 你已擁有自動翻譯的完整列表頁、表單頁和詳情頁。

（以下欄位類型插件、欄位配置參考、路由生成器、API 整合、文件、測試、部署、授權、致謝等章節內容與簡體中文版一致，此處省略以節省空間）
