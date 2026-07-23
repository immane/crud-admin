# AI Context

> Vue Admin Skeleton — AI Assistant Context Document  
> Last updated: 2026-07-23

---

## Project Overview

**Vue Admin Skeleton** is a Vue 3 + Element Plus + Vite admin dashboard scaffold, featuring **EasyAdmin** — a configuration-driven CRUD engine at its core.

- **Name**: vue-admin-skeleton
- **Purpose**: Enterprise admin dashboard (content management, order management, user management, etc.)
- **Origin**: Forked from [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin) by PanJiaChen

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Vue.js | 3.5 |
| UI Library | Element Plus | 2.9 |
| State Mgmt | Vuex (namespaced) | 4.1 |
| Routing | Vue Router (history) | 4.5 |
| HTTP | Axios | 0.21.1 |
| Build | Vite | 5.x |
| CSS | SCSS (Dart Sass) | — |
| Testing | Vitest | 2.1 |
| Types | TypeScript | 6.0 |
| Icons | @element-plus/icons-vue | 2.3 |

---

## Quick Project Structure

```
src/
├── main.js              # Entry: createApp, install plugins, mount
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
├── i18n/                        # Locale files (en, zh, zh-Hant, ja)
│   └── index.js                 # i18n plugin + browser detection
├── icons/                # SVG icons (sprite + legacy compat map)
│   ├── index.js          # installIcons: SVGO sprite + global svg-icon component
│   ├── legacy-icons.js   # installLegacyIcons: el-icon-* → @element-plus/icons-vue
│   └── svg/              # SVGO-optimized SVG files
├── layout/               # Layout (Sidebar + Navbar + AppMain)
├── router/               # Vue Router + r()/g() generators
├── store/                # Vuex (auto-loads modules/)
├── styles/               # Global SCSS
│   ├── index.scss        # Entry
│   └── sidebar.scss      # Sidebar/collapse layout styles
├── types/                # TypeScript type definitions
├── utils/                # Utilities
│   ├── auth.js           # Cookie token management
│   ├── entity.ts         # EntityManage CRUD class (CRUD + deleteMany + batchUpdate)
│   ├── request.ts        # Axios JWT instance
│   └── upload.js         # Unified upload (host resolution, headers, path normalisation)
└── views/                # Page views
    ├── admin/            # Generic CRUD (list + form + detail)
    ├── login/            # Login page (dynamic version from package.json)
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
├── common/                   Category, Tag, Content, Comment, Page, Media, Picture, Setting
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
    form: { fields: [...], batch_edit?: { fields: [...] } },
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

This is used in `Product.jsx` to embed specification management (ListAdmin + create/edit dialog with nested FormAdmin) directly inside the product form. The component must be a Vue component definition object and relies on direct imports within the config module. It walks `$parent` to find the `FormAdmin` instance for the `productId`.

### 2. Vite Glob Dynamic Loading

```js
// Store modules auto-registration
const modulesFiles = import.meta.glob('./modules/**/*.js', { eager: true })

// EasyAdmin plugin auto-discovery (form fields)
const formPlugins = import.meta.glob('./plugins/form/*.vue')
const formPluginCache = {}
const resolveFormPlugin = path => {
  if (!formPluginCache[path]) {
    formPluginCache[path] = defineAsyncComponent(() => formPlugins[path]().then(m => m.default))
  }
  return formPluginCache[path]
}

// EasyAdmin plugin auto-discovery (list columns)
const listPlugins = import.meta.glob('./plugins/list/*.vue')
const listPluginCache = {}
const resolveListPlugin = path => {
  if (!listPluginCache[path]) {
    listPluginCache[path] = defineAsyncComponent(() => listPlugins[path]().then(m => m.default))
  }
  return listPluginCache[path]
}

// EasyAdmin plugin auto-discovery (detail view)
const detailPlugins = import.meta.glob('./plugins/detail/*.vue')

// Entity config auto-loading (supports .js and .jsx; .ts/.tsx available as target)
const entityCollections = import.meta.glob('./collections/**/*.{js,jsx}', { eager: true })
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
  using `addRoute()` (Vue Router 4). `resetRouter()` removes dynamic routes by name.
- Navigation guard: `src/permission.js` → `router.beforeEach()`
- EasyAdmin generic routes (`create`, `update`, `detail`, `list`) are registered as
  named routes with `/` prefix and a parent `Layout` component, using `createRouter`
  + `createWebHistory` (Vue Router 4 API).
- The `r()` generator uses redirect functions (not string templates) to preserve
  URL params in Vue Router 4: `redirect: to => /\`/${to.params.id}/update\``

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
| `currency.vue` | currency | `<el-input-number>` + currency code (yuan input, cents storage) |
| `select.vue` | — | `<el-select>` |
| `date.vue` | date | `<el-date-picker>` (yyyy-MM-dd) |
| `datetime.vue` | datetime | `<el-date-picker>` (yyyy-MM-dd HH:mm:ss) |
| `image.vue` | image | `<el-upload>` (single image, wall mode) |
| `file.vue` | — | `<el-upload>` (single file, configurable storage driver) |
| `code.vue` | — | CodeMirror 6 editor (line numbers, history, syntax highlighting) |
| `json.vue` | — | `<jsoneditor>` (tree/code view, direct npm import, no Vue wrapper) |
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
| `currency.vue` | currency | Formatted currency (Intl.NumberFormat, narrowSymbol) |
| `date.vue` | date | Formatted date with icon |
| `datetime.vue` | datetime, datetime_immutable | Formatted datetime with icon |
| `image.vue` | image | `<el-image>` (preview) |
| `RelationToOne.vue` | ManyToOne, OneToOne | `__toString` display, `<router-link>` to detail page if route exists |
| `RelationToMany.vue` | ManyToMany, OneToMany | `<el-tag>` list (max 5 + tooltip), each linked to detail page if route exists |
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
       list: { list_display: [...], list_filter: {...}, disabled_actions: [...] },
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
| `VITE_PROXY_TARGET` | Dev proxy target (dev only; also injected at runtime for upload fallback) |
| `VITE_API_PREFIX` | Business API prefix (default `/api/v1`) |
| `VITE_AUTH_API_PREFIX` | Auth API prefix (default `/api/auth`) |
| `VITE_SYSTEM_API_PREFIX` | System API prefix (default `/system`) |
| `MEDIA_STORAGE_DEFAULT` | Default upload storage driver (`local` or `qiniu`, default `local`) |

### Common Commands

```bash
npm run dev          # Development (localhost:9528)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run test         # Vitest unit tests
```

---

## Known Patterns

### Legacy Icon System (`el-icon-*` → Element Plus SVG)

The project has hundreds of references to old `el-icon-*` class names in templates,
config menus, and route definitions. Instead of rewriting them all, a compatibility
layer maps `el-icon-*` to Element Plus SVG icon components:

- `src/icons/legacy-icons.js` — Registers each `el-icon-xxx` name as a global Vue
  component mapped to the corresponding `@element-plus/icons-vue` component (38 mappings).
- Sidebar `Item.vue` renders icons via `resolveComponent(icon)` with class `.sub-el-icon`.
- The inline `<i class="el-icon-xxx">` pattern is migrated to `<el-icon><icon-comp /></el-icon>`.
- Element Plus's `icon` prop on `el-button` etc. resolves globally registered components.

Icon mappings (routes.js):
- Dashboard: el-icon-s-home → HomeFilled
- 商品管理: el-icon-goods → Goods
- 订单管理: el-icon-tickets → Tickets
- 促销管理: el-icon-s-promotion → Promotion
- 内容管理: el-icon-notebook → Notebook
- 钱包管理: el-icon-wallet → Wallet
- 用户管理: el-icon-user → User
- 系统选项: el-icon-setting → Setting

### Sidebar Collapse Mechanism

The sidebar collapse is controlled by Vuex `app/toggleSideBar`. In collapsed mode:

- `el-menu` gets `.el-menu--collapse` class (width 54px).
- Text `<span>` is hidden via Element Plus CSS: `.el-menu--collapse > .el-menu-item > span`
  and `.el-menu--collapse > .el-sub-menu > .el-sub-menu__title > span`.
- Icons are centered via `justify-content: center` + `margin: 0 !important` on `.sub-el-icon`.
- `el-menu-item` must be a DIRECT child of `el-menu` for the `>` CSS selector to work.
  This required removing the `<div v-if>` and `<app-link>` wrappers from `SidebarItem.vue`.
- `el-menu` uses the `router` prop for automatic route navigation on click.

### EasyAdmin Field Type Resolution

Form fields resolve plugins via `resolvePluginType()` (Vue 3 compatible replacement
for Vue 2's `v-set` pattern):
- Explicit `field.type` takes priority.
- Metadata types are normalized (case-insensitive) and only known relation types
  (`ManyToOne`, `OneToOne`, `ManyToMany`, `OneToMany`) map to relation plugins.
- All other metadata types fall back to `'input'` (not `'select'`).
- The old `:set="currentStruct = structure[field.property]"` template trick is
  removed — use `structure[field.property]` directly in templates.
- Plugin async components are wrapped in `defineAsyncComponent()`.

### Form Plugins — Vue 3 Model Contract

- `v-model="form[field.property]"` works because the parent `form` object is reactive
  and Vue 3 handles prop mutations.
- File/image upload plugins use `:on-exceed="handleExceed"` to replace existing files
  (clear files → handleStart → submit) since Element Plus limits upload by count.
- Simple text input uses `.sync`-free pattern: `:model-value` + `@update:model-value`.
- Relation plugins fetch options via `EntityManage.list()` and cache in local `data()`.
- JSON editor uses direct `import JSONEditor from 'jsoneditor'` (no Vue wrapper).

### Nested API Resources (e.g., Specifications under Products)

For entities whose manage API is nested under another entity:

```js
entity: { name: 'Specification', prefix: `/api/v1/manage/products/${productId}` }
```

The productId comes from the parent `FormAdmin.id` prop. The entity config file itself holds only field definitions; the prefix is set at runtime in the parent component's `entityConf`.

### JSON Editor

The `json.vue` form plugin uses the vanilla `jsoneditor` library directly from npm (not `vue-json-editor` or `vue-json-editor`). Import: `import JSONEditor from 'jsoneditor'` + `import 'jsoneditor/dist/jsoneditor.css'`. No dynamic script loading needed.

### Dialog Detail

- ListAdmin edit dialog uses a template-level `<form-admin>` component (no JSX
  indirection). The dialog mounts `FormAdmin` directly when `dialog.show` is true,
  with `v-if="dialog.show"` to force remount on each open.
- The Save button lives in `<template #footer>` on `<el-dialog>`, outside the
  scrollable form body, so it remains fixed at the bottom. It triggers
  `$refs.dialogForm.onSubmit(closeEditDialog)`.
- The `submit` callback in the dialog's footer calls `closeEditDialog()` which
  shows a success message and closes the dialog.
- `@closed="fetchData"` refreshes list data via API after dialog close.
- `v-model` replaces the old `.sync` modifier for Vue 3.

### Batch Operations (Batch Delete + Batch Edit)

`ListAdmin` provides two batch operations that work on the current page's selection:

#### Selection Column

- A selection column (`type="selection"`) appears when `hasBatchDelete` is true (i.e., `delete` is not disabled and `batch_delete` is not in `disabled_actions`).
- Selection state is tracked in `selectedRecords` via `@selection-change="handleSelectionChange"`.
- Selections are cleared on data refresh (`fetchData()`) and after successful batch operations.

#### Batch Delete

- Button appears in the toolbar alongside a count badge when records are selected.
- Uses `EntityManage.deleteMany(ids)` which calls `Promise.allSettled` on individual `DELETE /{plural}/{id}` calls.
- Reports success count and, on partial failure, a warning with the failure count.
- `disabled_actions` available: `'batch_delete'`, or inherits `'delete'` (if delete is disabled, batch delete hides too).

#### Batch Edit (`EntityManage.batchUpdate`)

**Config location**: `form.batch_edit.fields` in entity config:
```js
form: {
  batch_edit: {
    fields: ['category', 'tags']     // FieldConfig[] — same format as form.fields
  }
}
```

**Backend contract**: `POST /{plural}/batch-update?@basis=id&@mode=update`
```json
[
  { "id": 1, "fieldToUpdate": "new value" },
  { "id": 2, "fieldToUpdate": "new value" }
]
```
Each record includes only `id` and the fields to update; omitted fields retain their original values. The endpoint is provided by the backend's `UpdateApiViewMixin`.

**Dialog UI**:
- Opens when "Batch Edit" toolbar button is clicked with one or more selected rows.
- Each field in `batch_edit.fields` is rendered using the existing FormAdmin form plugins (`formPlugins`), resolved by `resolveBatchPluginType()` and loaded via `loadBatchPlugin()`.
- A per-field `<el-checkbox>` in the label area lets the user decide which fields to include.
- **Auto-selection**: When a user modifies a field value, the corresponding checkbox is automatically checked (except for empty arrays from `RelationToMany` initialisation).
- Only checked fields with a value present in the form object (`Object.hasOwn(form, key)`) are included in the request.

**`EntityManage` methods**:
```ts
deleteMany(pks: Array<number | string>): Promise<PromiseSettledResult<ApiResponse<unknown>>[]>
batchUpdate(ids: Array<number | string>, data: Record<string, any>): Promise<ApiResponse<unknown>>
```

**`disabled_actions`** supports: `'batch_edit'` | `'batch_delete'`

### Toolbar Layout

The list toolbar (`.easy-admin-toolbar`) uses flex-based layout instead of the old `el-row/el-col` grid:

- **Title** (`.easy-admin-toolbar__title`): auto-width, bold, vertically centered.
- **Body** (`.easy-admin-toolbar__body`): flex row with `justify-content: space-between`.
  - **Search** (`.easy-admin-toolbar__search`): `flex: 1 1 auto`, wraps to fit.
  - **Actions** (`.easy-admin-toolbar__actions`): `flex: 0 0 auto`, right-aligned.
    - Custom action slots (`extraTopButton`), batch buttons, then default actions (export + new).
- Batch buttons appear only when `selectedRecords.length > 0`.
- Selection count badge: rounded pill with blue background.
- On `max-width: 767px`: toolbar and body become `flex-direction: column`, search fields stretch to full width, actions left-align.

### URL Search Params Sync

`ListAdmin` syncs search filter state and pagination to the browser URL using `history.replaceState`:

- `ListAdmin.syncToUrl()` — debounced (50ms) function that reads `listFilterData`, `pager.page`, and `pager.limit`, builds a query string via `buildQueryParams()` + `URLSearchParams`, and replaces the current URL (no-op if unchanged).
- Called from `listFilterData` deep watcher (filter changes) and `handleCurrentChange` / `handleSizeChange` (pagination changes).
- `ListAdmin.created()` reads `$route.query` to restore filters (`listFilterData`) and pager (`page`, `limit`) on page load.
- `$route.query` watcher replaces the old `popstate` listener: browser back/forward navigation triggers the watcher, which calls `applyQueryParams()` → regenerates filter expressions → fetches data.

`applyQueryParams(query)` separates `page`/`limit` into `pager` and the rest into `listFilterData`. Missing `page`/`limit` query params reset to defaults (1 and 20).

### Search Reset Button

`SearchFilter` provides a reset button (refresh icon) alongside the search button, visible when any filter is configured:

- `SearchFilter.reset()` restores each filter to its configured `__default` value, calls `filterGenerate()` to rebuild the backend filter expression, then emits `'reset'`.
- `ListAdmin.resetSearch()` (listens for `@reset` on `<search-filter>`) resets `pager.page` to 1 and `pager.limit` to 20, then calls `fetchData()`. The URL sync fires automatically via the `listFilterData` watcher.
- Initial data load (`created()`) passes `resetPage = false` to avoid overwriting URL-restored pagination.

### Relation Detail Links

`RelationToOne` and `RelationToMany` list plugins render `<router-link>` to the target entity's detail page when the route exists:

- The target entity name is resolved from `field.type_options.entity_name` (config-level) or `struct.metadata.targetEntity` (backend metadata), taking the last segment of the fully qualified class name.
- `this.$router.hasRoute(\`${targetEntity}Detail\`)` checks whether the detail route is registered; if not, fall back to plain text/tag rendering.
- Links are rendered only when the related object has a non-null `id`.

### Template `t()` vs `$t()` Pitfall

In Vue 3 Options API components, the module-level `import { t } from '@/i18n'` must ONLY be used in `<script>` setup context or non-template JS. Template `@click` handlers and inline arrow functions are compiled to `_ctx.*` lookups, which only resolve `$t` (registered via `app.config.globalProperties`). Using the imported `t()` inside template expressions causes `_ctx.t is not a function` at runtime.

### Internationalization — Flat Keys

The i18n system uses **flat English strings as translation keys** instead of nested dot notation:

```js
// Instead of: $t('easyAdmin.newEdit')
// Use:        $t('New / Edit')
```

- Detected locale is persisted in `localStorage`. Navbar dropdown allows switching (clears entity cache, reloads page).
- Locale is injected into every Axios request via `Accept-Language` header and `_locale` query parameter.
- Supported: `en` (default), `zh`, `zh-Hant`, `ja`. Element Plus locale syncs automatically.
- `routes.js` and all entity configs use `import { t } from '@/i18n'` to translate titles and labels.
- Entity names such as `Picture`, `Specification` and field labels like `Image`, `Metadata`, `Price`, `Sort` are available as i18n keys across all 4 locales.
- Adding a new language: create `src/i18n/{code}.js`, register in `i18n/index.js`, add to Navbar dropdown.

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

### Unified Upload System

All file/image uploads go through `src/utils/upload.js`, which provides a single entry point for:

- **Host resolution**: `resolveUploadHost()` checks `VITE_BASE_API` → `window.location.origin` → `VITE_PROXY_TARGET`. Browser uploads always use same-origin to avoid CORS preflight failures.
- **Upload endpoint**: `POST /api/v1/manage/media/upload` with `file` (multipart) and `storage` (form field, defaults to `MEDIA_STORAGE_DEFAULT`).
- **Auth headers**: `getUploadHeaders()` attaches `Authorization: Bearer {token}` from the auth cookie.
- **Path normalisation**: `resolveUploadPath(response)` extracts `data.path` from the response object and converts it to a full URL via `getPictureUrl()`.
- **Image display**: `getPictureUrl(name)` returns absolute URLs as-is, prepends the upload host for `/uploads/...` paths, and falls back to `/uploads/images/{name}` for bare filenames.
- **`simple-image-process.js`**: `getPicture()` now delegates to `getPictureUrl()` from the upload utility.

Components using the unified system:
- `plugins/form/image.vue` — `el-upload` with computed `uploadAction`, `uploadData`, `uploadHeaders`.
- `plugins/form/file.vue` — same pattern as image; default `storage` from `MEDIA_STORAGE_DEFAULT`, overridable via `field.type_options.storage`.
- `Tinymce/index.vue` — `images_upload_handler` uses the server endpoint (IPFS handler removed).
- `Tinymce/components/EditorImage.vue` — editor image upload popup uses the same utilities; dialog uses `align-center` and `append-to-body` for proper vertical centering.

Upload success response format:
```json
{
  "data": { "id": 1, "path": "/uploads/202607/photo.jpg", "storage": "local", ... },
  "code": 0, "message": "SUCCESS"
}
```

After a successful upload, image and file plugins call `validateField()` on the parent `FormAdmin` ref to clear any `required` validation errors.

### Edit / Add Dialog Styling

The shared `ListAdmin` edit dialog has the following refinements:

- Save button lives in `<template #footer>` of `el-dialog` — outside the scrollable form body — so it remains fixed at the bottom.
- The dialog uses `class="easy-admin-dialog"` with:
  - Responsive width: `min(86vw, 1040px)`, max height `min(88vh, 900px)`.
  - 12px border-radius, subtle box-shadow.
  - Header: lighter background, refined title typography, rounded close button hover.
  - Body: zero padding on dialog body; padding lives on `.app-container` (28px).
  - The form title row (`.app-container > .el-row:first-child`) is hidden inside the dialog.
  - Form labels: darker text, 600 weight.
- `el-dialog` acts as a flex column container so header/body/footer stack naturally.
- `v-if="dialog.show"` on `<form-admin>` forces a fresh mount each open.
- `ref="dialogForm"` on `<form-admin>` allows the footer button to call `onSubmit(closeEditDialog)`.

### Image Preview (Teleport & z-index)

Image previews rendered by `<el-image>` in list and detail plugins were being obscured by fixed table columns and dialogs because they lived inside the parent stacking context. The fix:

- Both `plugins/list/image.vue` and `plugins/detail/image.vue` use `preview-teleported` on `<el-image>`, which mounts the preview overlay to `<body>`.
- Global style rule: `.el-image-viewer__wrapper { z-index: 3000 !important; }` ensures the teleported overlay sits above all page content.
- The `z-index` prop on the `<el-image>` components themselves is set high as a fallback.

### Dynamic App Version

The login page reads the version number from `package.json` at build time via Vite's built-in JSON import:

```js
import { version } from '@/../package.json'
```

The version string is exposed to the template as `appVersion` and rendered as `Version {{ appVersion }}`. Update `package.json` → `"version"` to change the displayed version.

---

## Related Documents

| Document | Path |
|----------|------|
| Architecture Design | `docs/design/architecture.md` |
| Code & API Contracts | `docs/design/contracts.md` |
| EasyAdmin Design | `docs/design/easyadmin-design.md` |
| EasyAdmin Config Contract | `docs/design/easyadmin-config-contract.md` |
| Migration Plan | `docs/plan/vue3-tsx-vite-migration.md` |
| AI Context (this file) | `docs/ai/context.md` |
| README (English) | `README.md` |
| README (简体中文) | `README.zh-cn.md` |
| README (繁體中文) | `README.zh-Hant.md` |
| README (日本語) | `README.ja.md` |

## Migration Notes (Vue 2 → Vue 3)

- **Entry**: `main.js` switched from `new Vue()` to `createApp(App)`. No `Vue.use()`
  — plugins are installed on the app instance.
- **Vue compat**: `@vue/compat` was used during early migration but has been removed.
  The app runs without compat mode.
- **Router**: `new Router()` → `createRouter()` + `createWebHistory()`.
  `router.addRoutes()` → `router.addRoute()`. `*` catch-all → `/:pathMatch(.*)*`.
- **Store**: `new Vuex.Store()` → `createStore()`. Module registration unchanged.
- **Filters**: Vue 2 `| dateFormat` replaced by plain methods in date/datetime list plugins.
- **JSX files**: Entity configs with JSX syntax use `.jsx` extension (Product, Wallet).
  The Vite config enables JSX for all `.js`/`.jsx` files.
- **Testing**: Jest 27 replaced by Vitest 2.1. `jest.config.js` removed. Tests migrated
  to `@vue/test-utils@2`, `createLocalVue` removed, components use `global.plugins`.
- **Proxy**: Vite config proxies `/api`, `/system`, `/upload`, `/uploads` to backend in dev.
- **Process.env**: `process.env.VITE_*`, `VITE_PROXY_TARGET`, and `MEDIA_STORAGE_DEFAULT` references are defined via `vite.config.ts`
  (define plugin) for backward compatibility.
