# Architecture Design

> Vue Admin Skeleton — Architecture Design Document  
> Last updated: 2026-07-03

---

## 1. System Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                        │
│  index.html  →  src/main.ts  →  src/main.js  →  App.vue          │
│  ├── Layout/           Shell (Sidebar + Navbar + AppMain)        │
│  ├── Views/            Page Components (login, dashboard, admin) │
│  └── Components/       Shared UI (Breadcrumb, Hamburger, SvgIcon)│
├──────────────────────────────────────────────────────────────────┤
│                         Routing Layer                             │
│  src/permission.js     Navigation Guard (Auth + Role Check)      │
│  src/router/           Vue Router (history mode, base: /admin/)  │
│  src/router/generator  r() / g() Route Generators                │
├──────────────────────────────────────────────────────────────────┤
│                      State Management Layer                       │
│  src/store/            Vuex (auto-loaded namespaced modules)     │
│  ├── user              Auth State (token, roles, profile)         │
│  ├── permission        Dynamic Route Generation                   │
│  ├── app               Sidebar State, Device Detection            │
│  ├── entity            Entity Schema Cache (sessionStorage)       │
│  ├── tagsView          Open Tab State                             │
│  └── settings          App Settings                               │
├──────────────────────────────────────────────────────────────────┤
│                         Business Logic Layer                      │
│  src/utils/entity.ts   EntityManage CRUD Class                   │
│  src/utils/request.ts  Axios Instance + JWT Interceptor          │
│  src/api/              API Endpoint Definitions                   │
│  src/configs/          Declarative Entity & Route Configs         │
├──────────────────────────────────────────────────────────────────┤
│                       EasyAdmin Engine Layer                      │
│  FormAdmin.vue         Dynamic Form Generator                     │
│  ListAdmin.vue         Dynamic Table/List Generator              │
│  SearchFilter.vue      Dynamic Filter Builder                     │
│  plugins/form/         17 Field-Type Plugins                      │
│  plugins/list/         List Cell Plugins                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Bootstrap Flow

```
1. index.html loads /src/main.ts (Vite entry)
2. main.ts → import './main.js'
3. main.js executes in order:
   a. normalize.css (CSS reset)
   b. Vue.use(ElementUI, { locale: zh-CN })
   c. Import global SCSS
   d. Import App.vue, store, router
   e. Register SVG icons globally (icons/index.js)
   f. Import navigation guard (permission.js, side-effect import)
   g. Install third-party plugins: vue-baidu-map, v-fit-columns, vue-filter-date-format
   h. Attach $getValue, $axios to Vue.prototype
   i. new Vue({ router, store, render: h => h(App) }).$mount('#app')
```

---

## 3. Authentication Flow

### 3.1 Login

```
User enters username + password
  → POST /api/auth/login { identifier, password }
  → Server returns { access_token, refresh_token, expires_in }
  → access_token stored in Cookie (dream_studio_admin_token)
  → Vuex: SET_TOKEN, SET_REFRESH_TOKEN
```

### 3.2 Route Guard

```
router.beforeEach():
  NO token → redirect /login (whitelist bypass)
  HAS token + on /login → redirect /
  HAS token + not /login:
    has roles? → proceed
    no roles? → dispatch('user/getInfo') → get roles
              → dispatch('permission/generateRoutes', roles)
              → router.addRoutes(accessRoutes)
              → next({ ...to, replace: true })
```

### 3.3 Request Interception

```
Every Axios request:
  has token → headers.Authorization = `Bearer ${getToken()}`
```

### 3.4 Logout

```
dispatch('user/logout')
  → POST /api/auth/logout { refresh_token }
  → Clear Cookie, clear Vuex state
  → resetRouter(), clear tagsView
```

---

## 4. Routing Design

### 4.1 Route Mode

- Mode: `history` (no hash)
- Base: `/admin/` (production) / `/` (development)

### 4.2 Route Categories

| Type | When | Composition |
|------|------|-------------|
| `constantRoutes` | App startup | /login, /404, /dashboard |
| `asyncRoutes` | After login (dynamic) | admin.routes (configs) + catch-all EasyAdmin routes + 404 fallback |

### 4.3 Dynamic Route Generation

```
asyncRoutes = [
  ...admin.routes,          // from src/configs/routes.js
  { path: '/:entityParam/create', component: admin/form },
  { path: '/:entityParam/:id/update', component: admin/form },
  { path: '/:entityParam/list', component: admin/list },
  { path: '*', redirect: '/404' }
]
```

`admin.routes` is defined in `src/configs/routes.js`, using `r()` to generate dummy redirect routes:

```
/dummy/{entityPath}/create  → redirect  → /{entityPath}/create
/dummy/{entityPath}/:id/update → redirect → /{entityPath}/:id/update
/dummy/{entityPath}/list    → redirect  → /{entityPath}/list
```

Actual rendering is handled by the catch-all `/:entityParam/*` route, which resolves to `views/admin/list.vue` or `views/admin/form.vue`.

---

## 5. State Management

### 5.1 Auto-Loading Mechanism

```js
// src/store/index.js
const modulesFiles = import.meta.glob('./modules/**/*.js', { eager: true })
// Auto-scan and register all ./modules/*.js as namespaced Vuex modules
```

### 5.2 Module Responsibilities

| Module | Key State | Key Actions |
|--------|-----------|-------------|
| `user` | token, refreshToken, roles, name | login, getInfo, logout, resetToken |
| `permission` | routes, addRoutes | generateRoutes(roles) |
| `app` | sidebar.opened, device | toggleSideBar, closeSideBar |
| `entity` | entities[], structures{} | set_entities, set_structures, reset |
| `tagsView` | visitedViews[], cachedViews[] | addView, delView, delAllViews |
| `settings` | fixedHeader, sidebarLogo | changeSetting |

### 5.3 Permission Filtering Logic

```
generateRoutes(roles):
  if roles includes 'ROLE_SUPER_ADMIN' or 'ROLE_ADMIN':
    return ALL asyncRoutes
  else:
    return filterAsyncRoutes(asyncRoutes, roles)
      → recursively filter, keep routes where meta.roles ∩ user.roles ≠ ∅
```

---

## 6. API Layer

### 6.1 Axios Instance

| Config | Value |
|--------|-------|
| baseURL | `VITE_BASE_API` (env variable) |
| timeout | 30s |
| Request interceptor | `Authorization: Bearer {token}` |
| Response interceptor | Check code ∈ {0, 200}, handle 204 |

### 6.2 API Prefixes

| Constant | Default | Env Variable |
|----------|---------|--------------|
| API_PREFIX | `/api/v1` | VITE_API_PREFIX |
| AUTH_API_PREFIX | `/api/auth` | VITE_AUTH_API_PREFIX |
| SYSTEM_API_PREFIX | `/system` | VITE_SYSTEM_API_PREFIX |

### 6.3 Endpoint Mapping

| Function | Method | Path |
|----------|--------|------|
| Login | POST | `/api/auth/login` |
| User info | GET | `/api/v1/app/users/me` |
| Logout | POST | `/api/auth/logout` |
| Entity list | GET | `/system/entities` |
| Entity structure | GET | `/system/entities/{fqcn}` |
| CRUD | GET/POST/PUT/DELETE | `/api/v1/manage/{plural}[/{pk}]` |

---

## 7. Build Configuration

### 7.1 Vite Config (`vite.config.ts`)

| Setting | Development | Production |
|---------|-------------|------------|
| base | `/` | `/admin/` |
| server.port | 9528 | — |
| server.proxy | `/api`, `/system` → VITE_PROXY_TARGET | — |
| plugins | @vitejs/plugin-vue2 + @vitejs/plugin-vue2-jsx | same |
| alias | `@` → `src/` | same |
| define | Inject process.env.VITE_* | same |

### 7.2 Environment Variables

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| VITE_BASE_API | `''` | `/stage-api` | `''` |
| VITE_PROXY_TARGET | Backend URL | — | — |
| VITE_API_PREFIX | — | `/api/v1` | `/api/v1` |
| VITE_AUTH_API_PREFIX | — | `/api/auth` | `/api/auth` |
| VITE_SYSTEM_API_PREFIX | — | `/system` | `/system` |
