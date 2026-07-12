# crud-admin

<p align="center">
  <b>A configuration-driven admin panel powered by Vue 3, Element Plus and EasyAdmin</b>
  <br><br>
  <img src="https://img.shields.io/badge/vue-3.5-brightgreen?logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/vite-5.x-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/node-%3E%3D14-green?logo=node.js" alt="Node">
  <br><br>
</p>

> Chinese (Simplified): [README.zh-cn.md](README.zh-cn.md) · Chinese (Traditional): [README.zh-Hant.md](README.zh-Hant.md) · Japanese: [README.ja.md](README.ja.md)

> Backend: [crud-skeleton](https://github.com/immane/crud-skeleton) — Symfony 8.1 API with dynamic query engine and modular architecture

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Internationalization](#internationalization)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [EasyAdmin CRUD Engine](#easyadmin-crud-engine)
- [API Integration](#api-integration)
- [Documentation](#documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

## Features

- **Configuration-Driven CRUD Engine (EasyAdmin)** — Declare entities in config; get full list/form/detail/routes for free
- **17+ Pluggable Form Fields** — input, textarea, select, boolean, integer, date, datetime, image, file, JSON, rich text, relation pickers, transfer, and more
- **Detail View with Fallback Chain** — `detail/` → `list/` → plain text plugins per field type
- **Internationalization (i18n)** — English, Simplified Chinese, Traditional Chinese, Japanese; browser language detection; locale toggle in navbar; `Accept-Language` header and `_locale` param injected into API requests
- **JWT Authentication** — Bearer-token login with automatic refresh token rotation, cookie persistence, and concurrent-request queuing
- **Role-Based Access Control** — Dynamic routes filtered by user roles via Vuex + Vue Router 4
- **Entity Introspection** — Queries backend `/system/entities` to infer field types, nullability, and relationships
- **Dynamic Filter & Sort** — Server-side filter expressions (`@filter`, `@sort`, `@order`) built from config-driven search UIs
- **Enterprise Dashboard** — Live order/product/user metrics, SVG sparkline chart, geolocation weather widget
- **Responsive Layout** — Collapsible sidebar with SVG icons, breadcrumb navigation, fixed header option
- **Code Splitting & Build Optimization** — Vite-powered chunk splitting with tree-shaking
- **Vitest Unit Testing** — 38 tests across components and utilities

<p align="center">
  <img src="docs/images/dashboard-sample.jpg" alt="Dashboard" width="32%" />
  <img src="docs/images/list-sample.jpg" alt="List" width="32%" />
  <img src="docs/images/detail-sample.jpg" alt="Detail" width="32%" />
</p>

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Vue 3.5 |
| UI Library | Element Plus 2.9 |
| State Mgmt | Vuex 4 |
| Routing | Vue Router 4 |
| HTTP | Axios |
| Build | Vite 5 |
| CSS | SCSS (Dart Sass) |
| Icons | @element-plus/icons-vue + SVG sprite |
| Testing | Vitest 2.1 |
| Types | TypeScript 6.0 |
| Backend | [crud-skeleton](https://github.com/immane/crud-skeleton) (Symfony 8.1) |

## Internationalization

The app detects the browser language on first load and persists the choice via `localStorage`. A dropdown in the navbar allows switching at any time — this clears the entity cache and reloads the page.

| Locale | Code | Element Plus | API Header |
|--------|------|-------------|------------|
| English (default) | `en` | en | `Accept-Language: en`, `_locale=en` |
| 中文 (简体) | `zh` | zh-cn | `Accept-Language: zh`, `_locale=zh` |
| 中文 (繁體) | `zh-Hant` | zh-tw | `Accept-Language: zh-Hant`, `_locale=zh-Hant` |
| 日本語 | `ja` | ja | `Accept-Language: ja`, `_locale=ja` |

Translation keys use the English string directly (flat format), e.g. `$t('New / Edit')`. Adding a new language requires only a new `src/i18n/{code}.js` file and an entry in the navbar dropdown.

## Project Structure

```text
.
├── src/
│   ├── main.js                      # App entry: createApp, install plugins, mount
│   ├── permission.js                # Navigation guard (auth + role check)
│   ├── components/EasyAdmin/        # ⭐ Core CRUD Engine
│   │   ├── FormAdmin.vue            # Dynamic form builder
│   │   ├── ListAdmin.vue            # Dynamic list/table builder
│   │   ├── DetailAdmin.vue          # Configurable record detail page
│   │   ├── SearchFilter.vue         # Dynamic filter UI
│   │   └── plugins/
│   │       ├── form/                # 17 field-type plugins
│   │       ├── list/                # 9 list-rendering plugins
│   │       └── detail/              # 2 detail-only plugins
│   ├── configs/                     # Declarative entity configs
│   │   ├── routes.js                # Menu / route definitions
│   │   ├── entities.js              # Auto-loader (import.meta.glob)
│   │   └── collections/             # Entity schemas (7 bundles, 22 entities)
│   ├── i18n/                        # Locale files (en, zh, zh-Hant, ja)
│   │   └── index.js                 # i18n plugin + browser detection
│   ├── icons/                       # SVG sprite + legacy icon compat map
│   ├── layout/                      # Sidebar + Navbar + AppMain
│   ├── router/                      # Vue Router 4 + r()/g() generators
│   ├── store/                       # Vuex 4 (auto-loads modules/)
│   ├── styles/                      # Global SCSS (sidebar, transitions, overrides)
│   ├── utils/                       # auth.js, entity.ts, request.ts, etc.
│   └── views/                       # Page views
│       ├── admin/                   # Generic CRUD (list + form + detail)
│       ├── dashboard/               # Enterprise dashboard
│       └── login/                   # Login page
├── tests/unit/                      # 38 Vitest tests
├── docs/                            # Design contracts + AI context
│   └── ai/context.md                # AI assistant reference
├── vite.config.ts                   # Vite 5 + Vue 3 + JSX config
├── vitest.config.ts                 # Vitest configuration
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js** >= 14.18
- **npm** >= 6.0.0

### 1) Clone

```bash
git clone https://github.com/immane/crud-admin.git
cd crud-admin
```

### 2) Install

```bash
npm install
```

### 3) Configure environment

Copy and edit the development environment file:

```bash
cp .env.example .env.development
```

Key variables:

```dotenv
VITE_BASE_API=
VITE_PROXY_TARGET=http://127.0.0.1:8000
VITE_API_PREFIX=/api/v1
VITE_AUTH_API_PREFIX=/api/auth
VITE_SYSTEM_API_PREFIX=/system
```

### 4) Run

```bash
npm run dev          # Development (localhost:9528, HMR)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run test         # Vitest
```

## Configuration

### Environment Files

| File | Purpose |
|------|---------|
| `.env.development` | Dev server (no build output) |
| `.env.staging` | Staging build |
| `.env.production` | Production build |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BASE_API` | API base URL | `''` |
| `VITE_PROXY_TARGET` | Dev proxy target | — |
| `VITE_API_PREFIX` | Business API prefix | `/api/v1` |
| `VITE_AUTH_API_PREFIX` | Auth API prefix | `/api/auth` |
| `VITE_SYSTEM_API_PREFIX` | System API prefix | `/system` |
| `VITE_TINYMCE_SRC` | TinyMCE script source | `''` |

### Build Customization

`vite.config.ts` key settings:
- **base**: `/admin/` in production, `/` in development
- **Dev proxy**: `/api`, `/system`, `/upload`, `/uploads` proxied to `VITE_PROXY_TARGET`
- **Plugins**: `@vitejs/plugin-vue` + `@vitejs/plugin-vue-jsx`
- **Aliases**: `@` → `src/`
- **Define**: Injects `process.env.VITE_*` at compile time

## EasyAdmin CRUD Engine

EasyAdmin is the heart of this project — a configuration-driven engine that **auto-generates CRUD interfaces** from declarative entity definitions.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Entity Config   │     │ Backend API      │     │  Rendered UI     │
│  (collections/)  │     │ /system/entities │     │                  │
│                  │     │                  │     │  ┌────────────┐  │
│  fields: [...]   │────▶│ field types,     │────▶│  │ ListAdmin  │  │
│  list_display    │     │ nullability,     │     │  │ (table)    │  │
│  list_filter     │     │ relations        │     │  └────────────┘  │
│  detail_display  │     │                  │     │  ┌────────────┐  │
│                  │     │                  │     │  │ FormAdmin  │  │
│                  │     │                  │     │  │ (form)     │  │
│                  │     │                  │     │  └────────────┘  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Step 1 — Define an Entity Config

In `src/configs/collections/common/Content.js`:

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

### Step 2 — Register Routes

In `src/configs/routes.js`:

```js
import { r } from '@/router/generator'
import { t } from '@/i18n'
{
  path: '/content', component: Layout,
  meta: { title: t('Content Management'), icon: 'el-icon-notebook' },
  children: [...r('Content', t('Content'))]
}
```

**That's it** — you have fully functional list, form, and detail pages, automatically translated.

### Field Type Plugins

EasyAdmin ships with 17 field type plugins, auto-resolved from entity metadata:

| Plugin | Type | Description |
|--------|------|-------------|
| `input.vue` | string (default) | Text input |
| `textarea.vue` | text | Multi-line textarea |
| `text.vue` | — | TinyMCE rich text editor |
| `boolean.vue` | boolean | Checkbox |
| `integer.vue` | integer | Number input |
| `select.vue` | — | Dropdown selector |
| `date.vue` | date | Date picker |
| `datetime.vue` | datetime | DateTime picker |
| `image.vue` | image | Image upload/preview |
| `file.vue` | — | File upload |
| `json.vue` | — | JSON editor (code/tree view) |
| `json-custom.vue` | — | Nested sub-object editor |
| `array.vue` | array | Array editor (select or nested form) |
| `RelationToOne.vue` | ManyToOne, OneToOne | Relation picker with remote search |
| `RelationToMany.vue` | ManyToMany, OneToMany | Multi-relation picker |
| `transfer.vue` | — | Shuttle/transfer component |
| `code.vue` | — | Code textarea |

### Field Configuration Reference

```ts
interface FieldOption {
  property: string           // Entity property name (required)
  label?: string             // Override display label
  type?: string              // Force field type
  required?: boolean         // Override nullable metadata
  editable?: boolean         // Inline editable in list view
  tab?: string               // Group into a named tab
  default_value?: unknown    // Default value for create mode
  field_options?: object     // Props passed to el-form-item
  field_events?: object      // Events bound to el-form-item
  type_options?: object      // Props passed to the field plugin
  type_events?: object       // Events bound to the field plugin
  relation_filter?: object   // Filter for relation queries
  component?: object         // Custom component (JSX render function)
  help?: string              // Help text below the field
  full_width?: boolean       // Span full grid width (detail view)
}
```

### Route Generators

| Function | Behavior |
|----------|----------|
| `r(entity, title)` | Redirect routes — reuses `admin/list.vue`, `admin/form.vue`, `admin/detail.vue` (recommended) |
| `g(entity, title)` | Direct routes — expects custom view files per entity (reserved alternative) |

> `r()` handles virtually all CRUD scenarios including nested sub-forms, JSX custom components,
> relation search, detail fallback chains, and async filter functions. `g()` is kept as a backup
> approach for cases where a fully independent page is warranted, but it is rarely needed in practice.

## API Integration

### Axios Instance (`src/utils/request.ts`)

- **Base URL**: `VITE_BASE_API` from environment
- **Timeout**: 30 seconds
- **Request Interceptor**: Injects `Authorization: Bearer <token>` header, `Accept-Language` header and `_locale` query parameter
- **Response Interceptor**: Auto-refreshes token on 401; queues concurrent failed requests behind a single refresh

### API Response Format

```json
{
  "code": 0,
  "message": "SUCCESS",
  "data": {},
  "paginator": { "totalCount": 42 }
}
```

### Expected Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User authentication |
| `/api/auth/token/refresh` | POST | Rotate refresh token |
| `/api/auth/logout` | POST | Invalidate refresh token |
| `/api/v1/app/users/me` | GET | Current user + roles |
| `/system/entities` | GET | List all entity class names |
| `/system/entities/{entity}` | GET | Entity field metadata |
| `/api/v1/manage/{entity}` | GET/POST | Entity list / create |
| `/api/v1/manage/{entity}/{id}` | GET/PUT/DELETE | Entity detail / update / delete |

## Documentation

- **[Architecture Design](docs/design/architecture.md)** — System layers, bootstrap flow, auth flow, routing, state management
- **[Code & API Contracts](docs/design/contracts.md)** — Request/response formats, component props contract
- **[EasyAdmin Design](docs/design/easyadmin-design.md)** — Plugin system, data flow, extension points
- **[EasyAdmin Config Contract](docs/design/easyadmin-config-contract.md)** — Complete config schema reference
- **[AI Context](docs/ai/context.md)** — Quick reference for AI-assisted development
- **[Vue 3 Migration Plan](docs/plan/vue3-tsx-vite-migration.md)** — Migration notes and current status

## Testing

**38 tests · Vitest 2.1**

```bash
npm run test          # Run all tests
npm run type-check    # TypeScript check
npm run test:ci       # CI (type-check + test)
```

Tests organized in `tests/unit/`:
- **Component tests**: Breadcrumb, Hamburger, SvgIcon, EasyAdmin feedback UI
- **Utility tests**: `request.ts`, `validate.js`, `entity.ts`, `formatTime`, `parseTime`, `param2Obj`

Configuration: `vitest.config.ts` (jsdom environment, Vue 3 plugin)

## Deployment

### Build Output

```
dist/
├── static/
│   ├── css/
│   ├── js/
│   └── img/
├── favicon.ico
└── index.html
```

### Deployment Notes

1. Set `VITE_BASE_API` in `.env.production` to your API server URL
2. Run `npm run build`
3. Deploy `dist/` to your web server
4. Configure client-side routing — redirect all paths to `index.html`:
   - **Nginx**: `try_files $uri $uri/ /admin/index.html;`
   - **Apache**: Use `.htaccess` with mod_rewrite

## License

MIT

## Acknowledgments

This project is based on the excellent work of:

- [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin) by [PanJiaChen](https://github.com/PanJiaChen) — the original admin template
- [vue-admin-template](https://github.com/PanJiaChen/vue-admin-template) — the simplified base template
- [Element UI](https://element.eleme.io/) — the original UI component library
