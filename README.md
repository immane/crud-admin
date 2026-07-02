# Vue Admin Skeleton

<p align="center">
  <br>
  <b>A config-driven admin panel framework powered by Vue 2.7, Element UI and EasyAdmin</b>
  <br><br>
  <img src="https://img.shields.io/badge/vue-2.7.16-brightgreen?logo=vue.js" alt="Vue 2.7">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/vite-5.x-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/node-%3E%3D14-green?logo=node.js" alt="Node">
  <br><br>
</p>

---

## 📖 Overview

**Vue Admin Skeleton** is a full-featured, production-ready admin panel scaffold built on Vue 2. It provides a complete set of enterprise-grade features — authentication, role-based permission control, dynamic routing, tag-view navigation — along with a powerful **configuration-driven CRUD engine** called **EasyAdmin**.

EasyAdmin eliminates boilerplate: define your entity schema once as a JSON-like config, and it auto-generates list views (with filtering, sorting, pagination, export), form views (with validation, dynamic field types, tab organization), and CRUD routes. It ships with 17 pluggable field types and supports custom render functions for maximum flexibility.

Originally forked from [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin) by [PanJiaChen](https://github.com/PanJiaChen), this project has been significantly extended with the EasyAdmin engine, entity introspection from a backend API, and a customizable plugin system.

---

## ✨ Features

- **Configuration-Driven CRUD Engine (EasyAdmin)** — Declare entities in config; get full list/form/routes for free
- **17+ Plug-and-Play Form Fields** — input, textarea, select, boolean, integer, date, datetime, image, file, JSON, code editor, relation pickers, transfer, and more
- **Automatic Entity Introspection** — Queries backend `/system/entities` API to infer field types, nullability, and relationships
- **Role-Based Access Control** — Dynamic route generation filtered by user roles via Vuex + router guard
- **Token-Based Authentication** — JWT Bearer token stored in cookies, injected via `Authorization` header through Axios interceptor
- **Tag-View Navigation** — Open multiple pages as tabs with keep-alive caching
- **Responsive Layout** — Collapsible sidebar, breadcrumb navigation, fixed header option
- **Environment-Aware Configuration** — Separate `.env` files for development, staging, and production
- **Mock Server with Hot-Reload** — Develop against realistic mock data without a backend
- **SVG Sprite Icons** — Vite-configured SVG sprite loader for performant icon usage
- **Code Splitting & Build Optimization** — Vite-powered chunk splitting with tree-shaking, preload directives, and CSS code-split
- **Export to CSV/Excel** — Built-in data export with configurable column labels
- **Rich Text Editing** — Integrated TinyMCE component
- **Unit Testing** — Jest + Vue Test Utils with coverage reporting
- **ESLint + TypeScript** — Code quality and partial type checking
- **Electron Support** — Optional desktop packaging via `src/background.js`

---

## 🧱 Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Vue.js (Options API + Composition API) | 2.7.16 |
| UI Library | Element UI | 2.13.2 |
| State | Vuex (namespaced modules) | 3.1.0 |
| Routing | Vue Router (history mode) | 3.0.6 |
| HTTP | Axios | 0.21.1 |
| Build | Vite | 5.x |
| CSS | SCSS (Dart Sass) + PostCSS | — |
| Testing | Jest 27 + Vue Test Utils | — |
| Linting | ESLint 6 + eslint-plugin-vue | 6.7.2 |
| Lang | JavaScript + TypeScript | 6.0 |

---

## 🏛 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser / Electron                     │
├─────────────────────────────────────────────────────────────┤
│  App.vue                                                     │
│  ├── permission.js  ← Route Guard (Auth + Role Check)       │
│  ├── Layout/        ← Shell (Sidebar + Navbar + AppMain)    │
│  │   ├── Navbar     ← Breadcrumb, User Menu, Tags           │
│  │   └── Sidebar    ← Dynamic Menu from Route Config         │
│  └── Views/         ← Page Components                        │
│      ├── admin/list.vue   ──→  ListAdmin.vue                │
│      ├── admin/form.vue   ──→  FormAdmin.vue                │
│      ├── login/                                             │
│      └── dashboard/                                         │
├─────────────────────────────────────────────────────────────┤
│  Store (Vuex)                                                │
│  ├── user        ← Auth Token, Roles, Profile               │
│  ├── permission  ← Dynamic Route Generation                  │
│  ├── app         ← Sidebar State, Device Detection           │
│  ├── entity      ← Backend Entity Schema Cache               │
│  ├── tagsView    ← Open Tab State                           │
│  └── settings    ← App Config                               │
├─────────────────────────────────────────────────────────────┤
│  API Layer                                                   │
│  ├── utils/request.ts  ← Axios Instance + Interceptors       │
│  ├── utils/entity.ts   ← EntityManage (CRUD Operations)      │
│  └── api/user.ts       ← Auth Endpoints                      │
├─────────────────────────────────────────────────────────────┤
│  EasyAdmin Engine                                            │
│  ├── FormAdmin.vue     ← Dynamic Form Generator              │
│  ├── ListAdmin.vue     ← Dynamic Table Generator             │
│  ├── SearchFilter.vue  ← Dynamic Filter Builder               │
│  └── plugins/form/     ← 17 Field-Type Plugins               │
├─────────────────────────────────────────────────────────────┤
│  Config Layer                                                │
│  ├── configs/routes.js       ← Menu / Route Definitions      │
│  ├── configs/collections/    ← Entity Schema Definitions     │
│  └── configs/entities.js     ← Auto-Loader                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Login → getToken() → router.beforeEach() checks token
  ↓
hasToken? → await store.dispatch('user/getInfo') → get roles
  ↓
store.dispatch('permission/generateRoutes', roles)
  ↓
router.addRoutes(accessRoutes) → dynamic menu rendered
  ↓
User visits /:entityParam/list
  ↓
admin/list.vue reads configs/collections/ → renders ListAdmin
  ↓
ListAdmin calls EntityManage.list() → Axios GET /manage/{entity}
  ↓
Response rendered as Element UI table via list_display config
```

---

## 📁 Project Structure

```
crud-admin/
├── public/
│   ├── favicon.ico
│   └── index.html                 # HTML template
├── mock/                          # Mock server (dev only)
│   ├── index.js                   # Mock route registration
│   ├── mock-server.js             # Express-based hot-reload server
│   ├── user.js                    # Login/user mock endpoints
│   └── table.js                   # Dynamic table mock data
├── src/
│   ├── api/                       # API endpoint definitions
│   │   └── user.ts                # login(), getInfo(), logout()
│   ├── assets/                    # Static assets (images, fonts)
│   ├── components/                # Shared components
│   │   ├── Breadcrumb/            # Route-based breadcrumb
│   │   ├── EasyAdmin/             # ⭐ Core CRUD Engine
│   │   │   ├── FormAdmin.vue      # Dynamic form generator
│   │   │   ├── ListAdmin.vue      # Dynamic list/table generator
│   │   │   ├── SearchFilter.vue   # Dynamic filter builder
│   │   │   ├── plugins/form/      # 17 field-type plugins
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
│   │   │   ├── plugins/list/      # List plugins
│   │   │   │   └── editable-plain.vue
│   │   │   └── ui/
│   │   │       └── feedback.ts    # Notification service
│   │   ├── Hamburger/             # Sidebar toggle
│   │   ├── SvgIcon/               # SVG icon component
│   │   └── Tinymce/               # Rich text editor
│   ├── configs/                   # Declarative configs
│   │   ├── index.js               # Config merger
│   │   ├── routes.js              # Menu & route definitions
│   │   ├── entities.js            # Auto-loader for collection configs
│   │   └── collections/           # ⭐ Entity Schema Definitions
│   │       └── common/
│   │           └── index.js       # All entity CRUD configs
│   ├── icons/                     # SVG icon assets
│   │   ├── index.js               # Global registration
│   │   ├── svg/                   # Individual SVG files
│   │   └── svgo.yml               # SVGO optimization config
│   ├── layout/                    # App shell
│   │   ├── index.vue              # Main layout wrapper
│   │   ├── components/
│   │   │   ├── AppMain.vue        # <router-view> wrapper
│   │   │   ├── Navbar.vue         # Top bar
│   │   │   ├── Sidebar/           # Side navigation
│   │   │   └── index.js
│   │   └── mixin/
│   │       └── ResizeHandler.js   # Responsive sidebar
│   ├── router/                    # Routing
│   │   ├── index.js               # Vue Router setup
│   │   └── generator.js           # Route generators g() and r()
│   ├── store/                     # Vuex state management
│   │   ├── index.js               # Auto-loading store modules
│   │   ├── getters.js
│   │   └── modules/
│   │       ├── app.js             # Sidebar state
│   │       ├── entity.js          # Entity schema cache
│   │       ├── permission.js      # Route filtering
│   │       ├── settings.js        # App settings
│   │       ├── tagsView.js        # Open tabs
│   │       └── user.js            # Auth state
│   ├── styles/                    # Global styles
│   │   ├── index.scss
│   │   ├── element-ui.scss        # Element UI overrides
│   │   ├── variables.scss         # Design tokens
│   │   ├── mixin.scss
│   │   ├── sidebar.scss
│   │   └── transition.scss        # Route transitions
│   ├── types/                     # TypeScript type definitions
│   │   ├── admin.ts               # FieldOption, EntityConfig, etc.
│   │   └── api.ts                 # ApiResponse, EntityStructure
│   ├── utils/                     # Utility functions
│   │   ├── auth.js                # Cookie-based token management
│   │   ├── entity.ts              # EntityManage CRUD class
│   │   ├── request.ts             # Axios instance + interceptors
│   │   ├── index.js               # parseTime, formatTime, etc.
│   │   ├── validate.js            # Input validation
│   │   ├── exportExcelCsv.js      # CSV export utility
│   │   └── get-page-title.js      # Page title builder
│   ├── views/                     # Page views
│   │   ├── admin/
│   │   │   ├── list.vue           # Generic CRUD list page
│   │   │   └── form.vue           # Generic CRUD form page
│   │   ├── dashboard/
│   │   │   └── index.vue          # Dashboard
│   │   ├── login/
│   │   │   └── index.vue          # Login page
│   │   ├── user/
│   │   │   ├── list.vue           # User-specific list
│   │   │   └── form.vue           # User-specific form
│   │   └── 404.vue
│   ├── App.vue                    # Root component
│   ├── main.js                    # App entry point
│   ├── permission.js              # Router guard (auth + roles)
│   └── settings.js                # App title, layout options
├── tests/
│   └── unit/
│       ├── components/            # Component tests
│       └── utils/                 # Utility tests
├── .env.development               # Dev environment variables
├── .env.production                # Prod environment variables
├── .env.staging                   # Staging environment variables
├── .eslintrc.js                   # ESLint configuration
├── .editorconfig                  # Editor settings
├── babel.config.js                # Babel configuration
├── jest.config.js                 # Jest configuration
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
├── package.json
└── .travis.yml                    # CI configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 14.18 (required by Vite 5)
- **npm** >= 6.0.0

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd crud-admin

# Install dependencies
npm install
```

### Development

```bash
# Start dev server with hot-reload at localhost:9528
npm run dev
```

The dev server includes a built-in **mock server** that intercepts API requests and returns realistic test data. No backend required during frontend development.

### Lint & Type Check

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npm run type-check
```

### Testing

```bash
# Run unit tests
npm run test:unit

# Run CI tests (lint + unit tests)
npm run test:ci
```

### Build

```bash
# Build for production
npm run build:prod

# Build for staging
npm run build:stage
```

### Preview Production Build

```bash
npm run preview
```

---

## ⚙️ Configuration

### Environment Variables

Three environment files control the build:

| File | Purpose | `VITE_BASE_API` |
|------|---------|-------------------|
| `.env.development` | Dev server | `''` (uses proxy) |
| `.env.staging` | Staging deploy | `/stage-api` |
| `.env.production` | Production deploy | `''` (relative) |

### App Settings

Edit `src/settings.js`:

```js
module.exports = {
  title: 'Vue admin skeleton',   // App title
  fixedHeader: true,             // Fix top navbar
  sidebarLogo: false             // Show logo in sidebar
}
```

### Build Customization

`vite.config.ts` configures the Vite build. Key settings:
- **base**: `/admin/` in production, `/` in development
- **Dev Server**: port 9528 with API proxy support
- **Plugins**: `@vitejs/plugin-vue2` + `@vitejs/plugin-vue2-jsx`
- **Aliases**: `@` → `src/`
- **Define**: Injects `process.env.VITE_*` environment variables at compile time
- **CSS**: SCSS (Dart Sass) with global variables from `src/styles/variables.ts`

---

## 🧩 EasyAdmin CRUD Engine

EasyAdmin is the heart of this project — a configuration-driven engine that **auto-generates CRUD interfaces** from declarative entity definitions.

### How It Works

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Entity Config   │     │  Backend API      │     │  Rendered UI      │
│  (collections/)  │     │  /system/entities │     │                   │
│                  │     │                   │     │  ┌─────────────┐  │
│  fields: [...]   │────▶│  field types,     │────▶│  │ ListAdmin   │  │
│  list_display    │     │  nullability,     │     │  │ (table)     │  │
│  list_filter     │     │  relations        │     │  └─────────────┘  │
│                  │     │                   │     │  ┌─────────────┐  │
│                  │     │                   │     │  │ FormAdmin   │  │
│                  │     │                   │     │  │ (form)      │  │
│                  │     │                   │     │  └─────────────┘  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Step 1 — Define an Entity Config

In `src/configs/collections/common/index.js`:

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

### Step 2 — Register Routes

In `src/configs/routes.js`:

```js
import { r } from '@/router/generator'

export default [
  {
    path: '/content',
    name: 'ContentManage',
    component: Layout,
    meta: { title: '内容管理', icon: 'el-icon-document', roles: ['ROLE_SUPER_ADMIN'] },
    children: [
      ...r('Content', '内容')  // Auto-generates list/create/edit routes
    ]
  }
]
```

**That's it** — you now have fully functional list and form pages for the `Content` entity.

### Route Generators

Two helper functions create routes:

| Function | Behavior |
|----------|----------|
| `r(entity, title)` | Redirect routes — reuses `admin/list.vue` and `admin/form.vue` (param-driven) |
| `g(entity, title)` | Direct routes — expects `views/{entity}/list.vue` and `views/{entity}/form.vue` (custom views) |

### Field Type Plugins

EasyAdmin ships with 17 field type plugins that are auto-resolved from entity metadata:

| Plugin | Type | Description |
|--------|------|-------------|
| `input.vue` | string | Basic text input |
| `textarea.vue` | text | Multi-line text area |
| `text.vue` | — | Read-only text display |
| `select.vue` | — | Dropdown selector |
| `boolean.vue` | boolean | Toggle switch |
| `integer.vue` | integer | Numeric input |
| `date.vue` | date | Date picker |
| `datetime.vue` | datetime | DateTime picker |
| `image.vue` | image / images | Image upload/preview |
| `file.vue` | — | File upload |
| `array.vue` | array | Array editor |
| `code.vue` | — | Prism-based code editor |
| `json.vue` | — | JSON editor |
| `json-custom.vue` | — | Custom JSON editor |
| `transfer.vue` | — | Shuttle/transfer component |
| `RelationToOne.vue` | ManyToOne / OneToOne | Relation picker |
| `RelationToMany.vue` | ManyToMany / OneToMany | Multi-relation picker |

If no plugin matches, `input.vue` is used as the fallback.

### Field Configuration Reference

Each field in the `fields` array can be a simple string or a detailed object:

```ts
interface FieldOption {
  property: string           // Entity property name (required)
  label?: string             // Override display label
  type?: string              // Force field type (image, boolean, etc.)
  required?: boolean         // Override nullable from backend metadata
  editable?: boolean         // Read-only in edit mode
  tab?: string               // Group into a named tab
  default_value?: unknown    // Default value for create mode
  field_options?: object     // Props passed to el-form-item
  field_events?: object      // Events bound to el-form-item
  type_options?: object      // Props passed to the field plugin
  type_events?: object       // Events bound to the field plugin
  relation_filter?: object   // Filter for relation queries
  component?: object         // Custom component (render function or SFC)
  help?: string              // Help text below the field
}
```

### List Configuration Reference

```ts
interface ListConfig {
  list_display?: FieldConfig[]    // Columns to display
  list_filter?: object            // Filter configuration
  query?: object                  // Default query parameters
  disabled_actions?: string[]     // Hide actions: new, edit, delete, lines, export
  data_processor?: Function       // Transform fetched data
  actions?: object[]              // Custom action buttons
  export?: object                 // Export configuration
}
```

### Custom Column Components

Use JSX render functions for complex column rendering:

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

## 🔐 Authentication & Authorization

### Token Flow

```
Login → POST /api/auth/login → server returns JWT (access_token + refresh_token)
  ↓
access_token stored in cookie (js-cookie)
  ↓
Every request → Axios interceptor adds Authorization: Bearer <token> header
  ↓
Logout → POST /api/auth/logout with refresh_token → cookie cleared, Vuex reset, router reset
```

### Route Guard (`src/permission.js`)

```
router.beforeEach()
  ├── No token → redirect to /login (unless in whitelist)
  ├── Has token → on /login → redirect to /
  └── Has token → not on /login
      ├── Has roles → proceed
      └── No roles → fetch user info → generate routes → addRoutes → proceed
```

### Role-Based Routes

Routes define required roles via `meta.roles`:

```js
{
  path: '/content',
  meta: {
    title: '内容管理',
    roles: ['ROLE_SUPER_ADMIN']    // Only super admin can see this
  }
}
```

The `permission.js` Vuex module filters `asyncRoutes` by user roles. Routes without `meta.roles` are accessible to all authenticated users.

---

## 🌐 API Integration

### Axios Instance (`src/utils/request.ts`)

- **Base URL**: `VITE_BASE_API` from environment
- **Timeout**: 30 seconds
- **Request Interceptor**: Injects `Authorization: Bearer <token>` header from cookie when token exists
- **Response Interceptor**: Checks `response.data.code === 0` or `200` for success; handles `204 No Content` gracefully; shows Element UI `Message` on error

### API Response Format

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

### EntityManage Class (`src/utils/entity.ts`)

Wraps typical CRUD operations:

| Method | HTTP | Endpoint |
|--------|------|----------|
| `structure()` | GET | `/system/entities/{entity}` |
| `list(params)` | GET | `/api/v1/manage/{plural}` |
| `retrieve(pk)` | GET | `/api/v1/manage/{plural}/{pk}` |
| `create(data)` | POST | `/api/v1/manage/{plural}` |
| `update(pk, data)` | PUT | `/api/v1/manage/{plural}/{pk}` |
| `delete(pk)` | DELETE | `/api/v1/manage/{plural}/{pk}` |

### Expected Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User authentication (identifier + password → JWT) |
| `/api/v1/app/users/me` | GET | Current user profile + roles |
| `/api/auth/logout` | POST | Invalidate refresh token |
| `/system/entities` | GET | List all entity class names |
| `/system/entities/{entity}` | GET | Entity field structure (types, relations, nullability) |
| `/api/v1/manage/{entity}` | GET | Paginated entity list |
| `/api/v1/manage/{entity}/{id}` | GET | Single entity record |
| `/api/v1/manage/{entity}` | POST | Create entity record |
| `/api/v1/manage/{entity}/{id}` | PUT | Update entity record |
| `/api/v1/manage/{entity}/{id}` | DELETE | Delete entity record |

---

## 🧪 Testing

```bash
# Run all unit tests
npm run test:unit

# Run CI validation (lint + tests)
npm run test:ci
```

Tests are organized in `tests/unit/`:
- **Component tests**: Breadcrumb, Hamburger, SvgIcon, EasyAdmin feedback UI
- **Utility tests**: `request.ts`, `validate.js`, `entity.ts`, `formatTime`, `parseTime`, `param2Obj`

Configuration: `jest.config.js`

---

## 📦 Deployment

### Build Output

```
dist/
├── static/
│   ├── css/
│   ├── js/
│   │   └── (hashed chunk files)
│   └── img/
├── favicon.ico
└── index.html
```

### Deployment Notes

1. Set `VITE_BASE_API` in `.env.production` to your API server URL
2. Run `npm run build:prod`
3. Deploy the `dist/` directory to your web server
4. Ensure your server handles client-side routing — redirect all paths to `index.html` for history mode:
   - **Nginx**: `try_files $uri $uri/ /index.html;`
   - **Apache**: Use `.htaccess` with mod_rewrite

---

## 🖥 Electron

For desktop deployment, this project includes Electron support via `src/background.js`. Refer to the Electron documentation for integration details.

---

## � Documentation

- **[Architecture Design](docs/design/architecture.md)** — System layers, bootstrap flow, auth flow, routing, state management
- **[Code & API Contracts](docs/design/contracts.md)** — Request/response formats, auth contract, CRUD contract, component props contract
- **[EasyAdmin Design](docs/design/easyadmin-design.md)** — Plugin system, data flow, filter builder, EntityManage class, extension points
- **[EasyAdmin Config Contract](docs/design/easyadmin-config-contract.md)** — Complete config schema reference (FieldOption, ListConfig, FilterConfig)
- **[AI Context](docs/ai/context.md)** — Quick reference for AI assistants working on this project

---

## �📄 License

MIT

---

## 🤝 Acknowledgments

This project is based on the excellent work of:

- [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin) by [PanJiaChen](https://github.com/PanJiaChen) — the original admin template
- [vue-admin-template](https://github.com/PanJiaChen/vue-admin-template) — the simplified base template
- [Element UI](https://element.eleme.io/) — the UI component library
