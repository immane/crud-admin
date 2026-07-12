# AI Context

> Vue Admin Skeleton — AI Assistant Context Document  
> Last updated: 2026-07-13

---

## Project Overview

**Vue Admin Skeleton** is a Vue 2.7 + Element UI + Vite admin dashboard scaffold, featuring **EasyAdmin** — a configuration-driven CRUD engine at its core.

- **Name**: vue-admin-skeleton
- **Purpose**: Enterprise admin dashboard (content management, order management, user management, etc.)
- **Origin**: Forked from [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin) by PanJiaChen

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Vue.js | 2.7.16 |
| UI Library | Element UI | 2.13.2 |
| State Mgmt | Vuex (namespaced) | 3.1.0 |
| Routing | Vue Router (history) | 3.0.6 |
| HTTP | Axios | 0.21.1 |
| Build | Vite | 5.x |
| CSS | SCSS (Dart Sass) | — |
| Testing | Jest 27 | — |
| Types | TypeScript | 6.0 |

---

## Quick Project Structure

```
src/
├── main.js              # Entry: install plugins, mount Vue
├── main.ts              # Vite bridge: import './main.js'
├── App.vue              # Root: <router-view />
├── permission.js         # Navigation guard (auth + roles)
├── settings.js           # App title, layout options
├── api/                  # API endpoint definitions
│   ├── prefix.ts         # VITE_* prefix constants
│   └── user.ts           # login(), getInfo(), logout()
├── components/EasyAdmin/  # ⭐ Core CRUD Engine
│   ├── FormAdmin.vue     # Dynamic form builder
│   ├── ListAdmin.vue     # Dynamic list builder
│   ├── DetailAdmin.vue   # Configurable record detail page
│   ├── SearchFilter.vue  # Dynamic filter builder
│   ├── plugins/form/     # 17 field-type plugins
│   ├── plugins/list/     # 9 list-rendering plugins
│   └── plugins/detail/   # Detail-only plugins (json, image)
├── configs/              # Declarative configs
│   ├── routes.js         # Menu/route definitions
│   ├── entities.js       # Auto-loader (import.meta.glob)
│   └── collections/      # Entity schema definitions (per bundle)
├── layout/               # Layout (Sidebar + Navbar + AppMain)
├── router/               # Vue Router + r()/g() generators
├── store/                # Vuex (auto-loads modules/)
├── styles/               # Global SCSS
├── types/                # TypeScript type definitions
├── utils/                # Utilities
│   ├── auth.js           # Cookie token management
│   ├── entity.ts         # EntityManage CRUD class
│   └── request.ts        # Axios JWT instance
└── views/                # Page views
    ├── admin/            # Generic CRUD (list + form + detail)
    ├── login/            # Login page
    └── dashboard/        # Enterprise dashboard
```

---

## Key Architecture Decisions

### 1. Configuration-Driven CRUD (EasyAdmin)

**No boilerplate.** Define entity config → auto-generate list/form/routes.

Config location: `src/configs/collections/{bundle}/{EntityName}.js` (per-entity files organized by bundle)  
Route generation: `src/configs/routes.js` using `r()` helper  
View reuse: `views/admin/list.vue` + `views/admin/form.vue` + `views/admin/detail.vue` resolve config from `$route.params.entityParam`

#### Entity Config File Structure

```
configs/collections/
├── helpers.js                ← Shared constants (orderByIdDesc, statusFilterLabel)
├── common/                   Category, Tag, Content, Comment, Page, Media, Setting
├── trade/                    Product, Order, OrderItem, Specification
├── identity/                 User, Profile
├── promotion/                Promotion, PromotionTemplate
├── payment/                  Invoice
├── wechat/                   WechatUser
└── wallet/                   Wallet, WalletTransaction, WalletPaymentDeduction
```

Each file exports a single entity config:
```js
export default {
  EntityName: {
    entity?: string | { name, prefix?, plural? },
    form: { fields: [...] },
    list: { query, list_filter, list_display, disabled_actions, ... },
    detail: { detail_display, disabled_actions, ... }
  }
}
```

The `detail_display` falls back to `list.list_display` → `form.fields` → all API fields. Detail fields use the same `FieldOption` contract and list rendering plugins as `list_display`.
```

The auto-loader (`entities.js`) uses `import.meta.glob` to collect all `.js` files under `collections/`. Files at depth 2 (e.g., `trade/Product.js`) are treated as collections and merged via `Object.assign`. Files at depth 3+ would be treated as standalone entities.

#### JSX Config Components

Entity configs can embed custom Vue components in `form.fields` via the `component` property:
```js
{ property: 'specifications', tab: '规格', component: SpecificationManager }
```

This is used in `Product.js` to embed specification management (ListAdmin + create/edit dialog) directly inside the product form. The component must be a plain Vue component definition object and relies on lazy `import.meta.glob` or direct imports within the config module.

### 2. Vite Glob Dynamic Loading

```js
// Store modules auto-registration
const modulesFiles = import.meta.glob('./modules/**/*.js', { eager: true })

// EasyAdmin plugin auto-discovery (form fields)
const formPlugins = import.meta.glob('./plugins/form/*.vue')

// EasyAdmin plugin auto-discovery (list columns)
const listPlugins = import.meta.glob('./plugins/list/*.vue')

// EasyAdmin plugin auto-discovery (detail view)
const detailPlugins = import.meta.glob('./plugins/detail/*.vue')

// Entity config auto-loading
const entityCollections = import.meta.glob('./collections/**/*.js', { eager: true })
```

### 3. JWT Bearer Token Authentication

- Token stored in Cookie: `dream_studio_admin_token`
- Refresh token stored in Cookie: `dream_studio_admin_refresh_token`
- Request interceptor: `Authorization: Bearer {token}`
- Login: `POST /api/auth/login { identifier, password }` → `{ access_token, refresh_token }`
- Token refresh: `POST /api/auth/token/refresh { refresh_token }` → `{ access_token, refresh_token }` (rotates both)
- Auto-refresh: Axios response interceptor catches 401, queues concurrent requests,
  refreshes once, retries original requests. On failure → `clearSession()` → `/login`.

### 4. Dynamic Routing + Permission Filtering

- Static routes: `/login`, `/404`, `/dashboard`
- Dynamic routes: generated post-login based on roles (`permission/generateRoutes`)
- Navigation guard: `src/permission.js` → `router.beforeEach()`

### 5. Metadata-Driven Field Types

- Backend API: `GET /system/entities/{fqcn}` returns field types, nullability, relations
- Frontend: auto-infers plugin types, generates validation rules
- Structure cache: Vuex → sessionStorage (`dream_studio_structures`)

---

## Plugin System

### Form Plugins (`plugins/form/`)

| Plugin File | Type Mapping | Render Component |
|-------------|--------------|------------------|
| `input.vue` | string (default) | `<el-input>` |
| `textarea.vue` | text | `<el-input type="textarea">` |
| `text.vue` | — | `<Tinymce>` (rich text) |
| `boolean.vue` | boolean | `<el-checkbox>` |
| `integer.vue` | integer | `<el-input-number>` |
| `select.vue` | — | `<el-select>` |
| `date.vue` | date | `<el-date-picker>` (yyyy-MM-dd) |
| `datetime.vue` | datetime | `<el-date-picker>` (yyyy-MM-dd HH:mm:ss) |
| `image.vue` | image | `<el-upload>` (single image, wall mode) |
| `file.vue` | — | `<el-upload>` (single file, Qiniu) |
| `code.vue` | — | `<PrismEditor>` (JS highlight) |
| `json.vue` | — | `<jsoneditor>` (tree/code view, vanilla API) |
| `json-custom.vue` | — | Nested `<FormAdmin>` (sub-object editor) |
| `array.vue` | array | `<el-select multiple>` or nested `<FormAdmin>` |
| `RelationToOne.vue` | ManyToOne, OneToOne | `<el-select>` (remote search) |
| `RelationToMany.vue` | ManyToMany, OneToMany | `<el-select multiple>` (remote search) |
| `transfer.vue` | — | `<el-transfer>` (shuttle box) |

### List Plugins (`plugins/list/`)

| Plugin File | Type Mapping | Render Component |
|-------------|--------------|------------------|
| `editable-plain.vue` | editable string/int/float/decimal | Inline edit |
| `boolean.vue` | boolean | `<el-switch>` or `<el-tag>` |
| `date.vue` | date | Formatted date with icon |
| `datetime.vue` | datetime, datetime_immutable | Formatted datetime with icon |
| `image.vue` | image | `<el-image>` (preview) |
| `RelationToOne.vue` | ManyToOne, OneToOne | `__toString` display |
| `RelationToMany.vue` | ManyToMany, OneToMany | `<el-tag>` list (max 5 + tooltip) |
| `array.vue` | array | `<el-tag>` list |
| `plain-text.vue` | fallback | Strip HTML plain text |

List plugins are loaded dynamically via `import.meta.glob`, following the same pattern as form plugins. The `getListPluginType()` method resolves the plugin type from `field.type` or backend metadata, and `loadListPlugin()` returns the async component.

### Detail Plugins (`plugins/detail/`)

DetailAdmin uses a fallback chain: `plugins/detail/` → `plugins/list/` → plain text. Detail-only plugins override list defaults where detail presentation differs.

| Plugin File | Type Mapping | Render Component |
|-------------|--------------|------------------|
| `image.vue` | image | Full-width `<el-image>` with border, shadow, preview |
| `json.vue` | json | `<pre>` with 2-space indent, syntax coloring, expand/collapse |

Adding a new detail plugin: create `plugins/detail/{type}.vue` with the same props as list plugins (`value`, `field`, `scope`, `em`, `struct`). It auto-discover via `import.meta.glob` and takes priority over the list counterpart.

---

## Quick Reference

### Adding a New CRUD Entity

1. Add config in `src/configs/collections/{bundle}/{EntityName}.js`:
   ```js
   export default {
     EntityName: {
       form: { fields: [...] },
       list: { list_display: [...], list_filter: {...} },
       detail: { detail_display: [...], disabled_actions: [...] }  // optional
     }
   }
   ```
2. Add `...r('EntityName', '中文名')` in `src/configs/routes.js`
3. Done — no new page files needed

### Adding a New Detail Plugin

1. Create `src/components/EasyAdmin/plugins/detail/{type}.vue` with props: `value`, `field`, `scope`, `em`, `struct`
2. Add the type name to `getListPluginType()` in `DetailAdmin.vue` (if not already present)
3. Done — priority over list plugins, auto-discovered via `import.meta.glob`

### Adding a New List Plugin

1. Create `src/components/EasyAdmin/plugins/list/{type}.vue` with props: `value`, `field`, `scope`, `em`, `struct`
2. Add the type name to `getListPluginType()` in `ListAdmin.vue`
3. Done — auto-discovered via `import.meta.glob`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_BASE_API` | API base path |
| `VITE_PROXY_TARGET` | Dev proxy target (dev only) |
| `VITE_API_PREFIX` | Business API prefix (default `/api/v1`) |
| `VITE_AUTH_API_PREFIX` | Auth API prefix (default `/api/auth`) |
| `VITE_SYSTEM_API_PREFIX` | System API prefix (default `/system`) |

### Common Commands

```bash
npm run dev          # Development (localhost:9528)
npm run build:prod   # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run test:unit    # Unit tests
```

---

## Known Patterns

### Nested API Resources (e.g., Specifications under Products)

For entities whose manage API is nested under another entity:

```js
entity: { name: 'Specification', prefix: `/api/v1/manage/products/${productId}` }
```

The productId comes from the parent `FormAdmin.id` prop. The entity config file itself holds only field definitions; the prefix is set at runtime in the parent component's `entityConf`.

### JSON Editor

The `json.vue` form plugin uses the vanilla `jsoneditor` library (not `vue-json-editor` wrapper). The CSS is imported directly; the JS is loaded via dynamic `<script>` from a Vite `?url` asset import. This avoids esbuild IIFE compatibility issues.

### Dialog Detail

- ListAdmin inline dialog opens/closes without a route change
- `@closed="fetchData"` refreshes list data via API (no page navigation)
- The `submit` callback in the dialog overrides the default success handler to close the dialog instead of calling `$router.go(-1)`

### Auto Token Refresh

- Axios interceptor catches HTTP 401 and business code 401 in `src/utils/request.ts`
- Concurrent expired requests queue behind a single `refreshPromise` to avoid
  refresh-token replay detection
- Refresh endpoint: `POST /api/auth/token/refresh { refresh_token }`
- On success: writes new access_token + rotated refresh_token to Vuex and cookies
- On failure: `clearSession()` → `resetToken()` → redirect `/login`
- Auth endpoints (`login`, `logout`, `token/refresh`) are excluded from the 401 retry

### Dashboard

- `src/views/dashboard/index.vue` fetches live data from `EntityManage` for
  Order, Product, User, WalletTransaction
- SVG sparkline chart derived from order amounts (no chart library dependency)
- Browser geolocation + Open-Meteo API for local weather; falls back to Beijing
- All API calls are `.catch(() => ...)` — dashboard remains functional even when
  backend is unreachable

---

## Related Documents

| Document | Path |
|----------|------|
| Architecture Design | `docs/design/architecture.md` |
| Code & API Contracts | `docs/design/contracts.md` |
| EasyAdmin Design | `docs/design/easyadmin-design.md` |
| EasyAdmin Config Contract | `docs/design/easyadmin-config-contract.md` |
| Migration Plan | `docs/plan/vue3-tsx-vite-migration.md` |

(End of file - total 297 lines)
