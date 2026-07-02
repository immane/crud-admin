# AI Context

> Vue Admin Skeleton — AI Assistant Context Document  
> Last updated: 2026-07-03

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
│   ├── SearchFilter.vue  # Dynamic filter builder
│   ├── plugins/form/     # 17 field-type plugins
│   └── plugins/list/     # Inline edit plugin
├── configs/              # Declarative configs
│   ├── routes.js         # Menu/route definitions
│   ├── entities.js       # Auto-loader (import.meta.glob)
│   └── collections/      # Entity schema definitions
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
    ├── admin/            # Generic CRUD (list + form)
    ├── login/            # Login page
    └── dashboard/        # Dashboard
```

---

## Key Architecture Decisions

### 1. Configuration-Driven CRUD (EasyAdmin)

**No boilerplate.** Define entity config → auto-generate list/form/routes.

Config location: `src/configs/collections/common/index.js`  
Route generation: `src/configs/routes.js` using `r()` helper  
View reuse: `views/admin/list.vue` + `views/admin/form.vue` resolve config from `$route.params.entityParam`

### 2. Vite Glob Dynamic Loading

```js
// Store modules auto-registration
const modulesFiles = import.meta.glob('./modules/**/*.js', { eager: true })

// EasyAdmin plugin auto-discovery
const formPlugins = import.meta.glob('./plugins/form/*.vue')

// Entity config auto-loading
const entityCollections = import.meta.glob('./collections/**/*.js', { eager: true })
```

### 3. JWT Bearer Token Authentication

- Token stored in Cookie: `dream_studio_admin_token`
- Request interceptor: `Authorization: Bearer {token}`
- Login: `POST /api/auth/login { identifier, password }` → `{ access_token, refresh_token }`

### 4. Dynamic Routing + Permission Filtering

- Static routes: `/login`, `/404`, `/dashboard`
- Dynamic routes: generated post-login based on roles (`permission/generateRoutes`)
- Navigation guard: `src/permission.js` → `router.beforeEach()`

### 5. Metadata-Driven Field Types

- Backend API: `GET /system/entities/{fqcn}` returns field types, nullability, relations
- Frontend: auto-infers plugin types, generates validation rules
- Structure cache: Vuex → sessionStorage (`dream_studio_structures`)

---

## Quick Reference

### Adding a New CRUD Entity

1. Add config in `src/configs/collections/common/index.js`
2. Add `...r('EntityName', '中文名')` in `src/configs/routes.js`
3. Done — no new page files needed

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

## Related Documents

| Document | Path |
|----------|------|
| Architecture Design | `docs/design/architecture.md` |
| Code & API Contracts | `docs/design/contracts.md` |
| EasyAdmin Design | `docs/design/easyadmin-design.md` |
| EasyAdmin Config Contract | `docs/design/easyadmin-config-contract.md` |
| Migration Plan | `docs/plan/vue3-tsx-vite-migration.md` |
