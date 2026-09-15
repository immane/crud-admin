# Architecture Design

> Vue Admin Skeleton — Architecture Design Document  
> Last updated: 2026-07-03

---

## 1. System Layers

```mermaid
flowchart TB
    subgraph Presentation ["Presentation Layer"]
        P1["index.html → src/main.ts → src/main.js → App.vue"]
        P2["Layout - Shell - Sidebar plus Navbar plus AppMain"]
        P3["Views - Page Components - login, dashboard, admin"]
        P4["Components - Shared UI - Breadcrumb, Hamburger, SvgIcon"]
    end
    subgraph Routing ["Routing Layer"]
        R1["src/permission.js - Navigation Guard - Auth plus Role Check"]
        R2["src/router - Vue Router - history mode, base /admin/"]
        R3["src/router/generator - r and g Route Generators"]
    end
    subgraph State ["State Management Layer"]
        S0["src/store - Vuex auto-loaded namespaced modules"]
        S1["user - Auth State - token, roles, profile"]
        S2["permission - Dynamic Route Generation"]
        S3["app - Sidebar State, Device Detection"]
        S4["entity - Entity Schema Cache - sessionStorage"]
        S5["tagsView - Open Tab State"]
        S6["settings - App Settings"]
    end
    subgraph Business ["Business Logic Layer"]
        B1["src/utils/entity.ts - EntityManage CRUD Class"]
        B2["src/utils/request.ts - Axios Instance plus JWT Interceptor"]
        B3["src/api - API Endpoint Definitions"]
        B4["src/configs - Declarative Entity and Route Configs"]
    end
    subgraph Engine ["EasyAdmin Engine Layer"]
        E1["FormAdmin.vue - Dynamic Form Generator"]
        E2["ListAdmin.vue - Dynamic Table and List Generator"]
        E3["SearchFilter.vue - Dynamic Filter Builder"]
        E4["plugins/form - 17 Field-Type Plugins"]
        E5["plugins/list - List Cell Plugins"]
    end
    P4 --> R1
    R3 --> S0
    S6 --> B1
    B4 --> E1
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

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    User->>Frontend: "Enter username plus password"
    Frontend->>Backend: "POST /api/auth/login with identifier and password"
    Backend-->>Frontend: "Return access_token, refresh_token, expires_in"
    Frontend->>Frontend: "Store access_token in Cookie dream_studio_admin_token"
    Frontend->>Frontend: "Vuex SET_TOKEN and SET_REFRESH_TOKEN"
```

### 3.2 Route Guard

```mermaid
sequenceDiagram
    participant Guard as "router.beforeEach"
    participant UserStore as "user store"
    participant PermStore as "permission store"
    Guard->>Guard: "Check token"
    alt "No token"
        Guard-->>Guard: "Redirect to /login with whitelist bypass"
    else "Has token and on /login"
        Guard-->>Guard: "Redirect to /"
    else "Has token and not on /login"
        alt "Has roles"
            Guard-->>Guard: "Proceed"
        else "No roles"
            Guard->>UserStore: "dispatch user/getInfo to get roles"
            Guard->>PermStore: "dispatch permission/generateRoutes with roles"
            Guard->>Guard: "router.addRoutes with accessRoutes"
            Guard-->>Guard: "next to target with replace true"
        end
    end
```

### 3.3 Request Interception

```mermaid
sequenceDiagram
    participant App
    participant Interceptor as "Axios request interceptor"
    App->>Interceptor: "Axios request"
    alt "Has token"
        Interceptor->>Interceptor: "Set headers.Authorization to Bearer token from getToken"
    end
    Interceptor-->>App: "Proceed with request"
```

### 3.4 Logout

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    User->>Frontend: "dispatch user/logout"
    Frontend->>Backend: "POST /api/auth/logout with refresh_token"
    Frontend->>Frontend: "Clear Cookie and clear Vuex state"
    Frontend->>Frontend: "resetRouter and clear tagsView"
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
