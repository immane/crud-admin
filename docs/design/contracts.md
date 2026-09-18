# Code Contracts & API Contracts

> Vue Admin Skeleton — Code Contracts & API Contracts  
> Last updated: 2026-09-18

---

## 1. API Response Contract

### 1.1 Standard Response Format

```typescript
interface ApiResponse<T = any> {
  code: number          // 0 or 200 = success
  message: string       // Human-readable message
  data: T               // Response payload
  paginator?: Paginator // Pagination info (list endpoints only)
}

interface Paginator {
  totalCount?: number   // Mapped from backend `total`
  total?: number
  page?: number
  limit?: number
  pages?: number
}
```

### 1.2 Success Codes

- `code === 0` → Success
- `code === 200` → Success
- `response.status === 204` → Empty response, auto-wraps to `{ code: 0, data: null }`

### 1.3 Error Handling

- Response interceptor checks code; if not in `[0, 200]`, shows `Message.error` and `Promise.reject`
- Axios network error → shows `Message.error` and `Promise.reject`

---

## 2. Auth Contract

### 2.1 Login

```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "identifier": string,   // username or email
  "password": string
}

Response (200):
{
  "code": 0,
  "message": "SUCCESS",
  "data": {
    "access_token": string,    // JWT
    "refresh_token"?: string,  // Refresh token
    "expires_in"?: number      // Expiry in seconds
  }
}
```

### 2.2 Get User Info

```
GET /api/v1/app/users/me
Authorization: Bearer {access_token}

Response (200):
{
  "code": 0,
  "data": {
    "username"?: string,
    "email"?: string,
    "identifier"?: string,
    "roles": string[]       // Must be non-empty
  }
}
```

### 2.3 Logout

```
POST /api/auth/logout
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "refresh_token"?: string
}

Response (200):
{
  "code": 0,
  "message": "SUCCESS"
}
```

### 2.4 Token Delivery

- Token stored in port-isolated Cookie: `dream_studio_admin_token_{port}`
  (legacy non-suffixed key kept as fallback)
- Refresh token likewise: `dream_studio_admin_refresh_token_{port}`
- Each request via Header: `Authorization: Bearer {token}`

---

## 3. Entity CRUD Contract

### 3.1 Entity List

```
GET /system/entities
Authorization: Bearer {token}

Response:
{
  "code": 0,
  "data": string[]    // FQCN entity class name list
}
```

### 3.2 Entity Structure

```
GET /system/entities/{fqcn}
Authorization: Bearer {token}

Response:
{
  "code": 0,
  "data": {
    "name": string,         // Entity FQCN
    "fields": {
      "{fieldName}": {
        "metadata": {
          "type": string,           // 'string'|'text'|'integer'|'float'|'decimal'|
                                    // 'boolean'|'date'|'datetime'|'image'|
                                    // 'ManyToOne'|'OneToOne'|'ManyToMany'|'OneToMany'
          "nullable": boolean,
          "targetEntity"?: string,  // Relation fields only
          "translation"?: string,   // Label text (plain string, not an object)
          "plaintext"?: string      // NOTE: backend spells it without the 'i'
        }
      }
    }
  }
}
```

### 3.3 Entity CRUD

```
GET    /api/v1/manage/{plural}           # Paginated list
GET    /api/v1/manage/{plural}/{pk}      # Single record
POST   /api/v1/manage/{plural}           # Create
PUT    /api/v1/manage/{plural}/{pk}      # Update
DELETE /api/v1/manage/{plural}/{pk}      # Delete

Request/Response format:
{
  "code": 0,
  "data": { ... },         // Single or list data
  "paginator": {           // List only
    "totalCount": number
  }
}
```

The backend currently provides no batch-delete endpoint. `ListAdmin` deletes the
selected records on the current page with concurrent requests to the single-record
delete endpoint and reports any partial failures.

### 3.4 Batch Update

```
POST /api/v1/manage/{plural}/batch-update?@basis=id&@mode=update
Content-Type: application/json

Request:
[
  { "id": 1, "fieldToUpdate": "new value" },
  { "id": 2, "fieldToUpdate": "new value" }
]

Response (200):
{
  "code": 0,
  "message": "SUCCESS",
  "data": ...
}
```

Each managed entity exposes a `POST .../batch-update?@basis=id&@mode=update`
endpoint. The request contains one record per primary key. Each record includes
only `id` and the fields to update; omitted fields retain their original values.

### 3.5 Query Parameters

The list endpoint supports the following query params:

| Param | Description | Example |
|-------|-------------|---------|
| `page` | Page number (1-based) | `page=1` |
| `limit` | Items per page | `limit=25` |
| `@order` | Sort order (`field\|DIR`, comma-separated multi-key) | `@order=entity.id\|DESC` |
| `@filter` | DQL filter expression (`entity.getX()` paths, `&&`/`\|\|` joins) | `@filter=entity.getStatus()=="paid"` |

Advanced params: `@select`, `@groupBy`, `@display` (e.g. `@display=reduce` for relation dropdowns), `@expands`. Never use `@sort` (admin-only in-memory comparator), `@dql`/`@hints` (admin-only), or `@showDQL` (dev only) from normal UI code.

DQL expression rules (backend-verified against crud-skeleton `ExpressionDqlParser`):

- Filter paths must use `entity.getX()` chains (e.g. `entity.getUser().getName()`). Bare property access (`entity.status`), `is*`/`has*` getters (`entity.isSystem()`), and bare names are not DQL-safe: non-admin requests get HTTP 403, admin requests silently fall back to full-table in-memory filtering. Query boolean `isSystem` properties as `entity.getIsSystem()`.
- Join conditions with `&&` / `||` (never the `and` / `or` keywords). Test null with bare `entity.getX()` (`IS NOT NULL`) or `!entity.getX()` (`IS NULL`) — never `== null` (compiles to `= NULL`, never true).
- `matches 'text'` is a backend-wrapped substring `LIKE` (do not pre-wrap `%`). `:value` is a frontend pre-substitution placeholder, never interpreted server-side in the `@filter` path.

---

## 4. Route Contract

### 4.1 Route Meta Fields

```typescript
interface RouteMeta {
  title?: string          // Page title / menu name
  icon?: string           // Element UI icon class (e.g. 'el-icon-goods')
  roles?: string[]        // Allowed roles (e.g. ['ROLE_SUPER_ADMIN'])
  hidden?: boolean        // Hide from sidebar
  activeMenu?: string     // Highlight a specific menu item
  noCache?: boolean       // Disable keep-alive cache
  breadcrumb?: boolean    // Show breadcrumb
  affix?: boolean         // Pin the tab
}
```

### 4.2 Route Generators

```typescript
// r() — Redirect routes
r(entityName: string, title: string, meta?: object): RouteConfig[]

// g() — Direct Component routes
g(entityName: string, title: string, meta?: object, component?: Component): RouteConfig[]
```

Entity name transformation: `inflect.dasherize(inflect.underscore(entityName))`
- `Product` → `product`
- `Transaction` → `transaction` (route path; the API plural defaults to
  `transactions` — `wallet-` prefixes only come from an explicit `plural`)

---

## 5. Vuex Store Contract

### 5.1 Entity Store

```typescript
// State
interface EntityState {
  entities: string[]                          // FQCN entity list
  structures: Record<string, EntityStructure>  // Entity structure cache
}

// Mutations
SET_ENTITIES(state, entities: string[])
SET_STRUCTURES(state, { entity, structure })
RESET_STATE(state)

// Actions
set_entities({ commit }, entities)
set_structures({ commit }, { entity, structure })
reset({ commit })
```

### 5.2 User Store

```typescript
// State
interface UserState {
  token: string | undefined
  refreshToken: string
  name: string
  avatar: string
  introduction: string
  roles: string[]
}

// Actions
login({ commit }, { username, password }): Promise<void>
getInfo({ commit, state }): Promise<UserInfo>
logout({ commit, state, dispatch }): Promise<void>
resetToken({ commit }): Promise<void>
```

---

## 6. Environment Variable Contract

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_BASE_API` | string | `''` | Axios baseURL |
| `VITE_PROXY_TARGET` | string | — | Vite dev proxy target (dev only) |
| `VITE_API_PREFIX` | string | `/api/v1` | Business API prefix |
| `VITE_AUTH_API_PREFIX` | string | `/api/auth` | Auth API prefix |
| `VITE_SYSTEM_API_PREFIX` | string | `/system` | System API prefix |
| `VITE_TINYMCE_SRC` | string | `''` | TinyMCE CDN URL |

### Frontend Usage

```typescript
// Injected at compile time via vite.config.ts define as process.env.VITE_*
const baseURL = process.env.VITE_BASE_API

// Exported as constants from api/prefix.ts
export const API_PREFIX = process.env.VITE_API_PREFIX || '/api/v1'
```

---

## 7. Component Communication Contract

### 7.1 FormAdmin / ListAdmin Shared Props

Props contract shared by both components:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `entityConf` | String \| Object | No (defaults to `{}`) | Entity name or entity identity config (`EntityConf`) |
| `modelValue` (v-model) | Object (Form) / Array (List) | No | Bound data |

### 7.2 FormAdmin-Specific Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | Number \| String | 0 | Primary key, incl. UUID (0=create, otherwise edit) |
| `fields` | Array \| String | — | Field list or `'__all__'` |
| `structureOverride` | Object \| null | null | Local structure for nested schema forms (skips backend fetch) |
| `embedded` | Boolean | false | Nested mode: no title bar / save button |

### 7.3 ListAdmin-Specific Props

| Prop | Type | Description |
|------|------|-------------|
| `entityConf` | Object \| String | Entity name or identity config |
| `tableConf` | Object | Extra `el-table` props (passthrough via `v-bind`) |
| `tableEvent` | Object | Extra `el-table` events (passthrough via `v-on`) |
| `modelValue` | Array | Selected/bound rows |
| `config` | Object | Full entity config |
| `listDisplay` | Array | Columns to display |
| `listFilter` | Object | Filter config |
| `query` | Object | Default query params |
| `disabledActions` | Array | Hide default actions |
| `actions` | Array | Custom action buttons |
| `dataProcessor` | Function | Custom data fetch |
| `export` | Object | Export config |

### 7.4 Form Plugin Props Contract

Each form plugin receives:

```typescript
interface FormPluginProps {
  form: Record<string, any>     // Reactive form data (read/write)
  field: FieldOption             // Field config
  struct?: EntityFieldMetadata   // Backend field metadata
  emPrefix?: string              // API prefix
}
```

### 7.5 FormAdmin Provided/Injected Keys

`FormAdmin` provides via `provide()` (consumed with `inject`, e.g. by field
plugins and nested forms):

| Key | Value | Purpose |
|-----|-------|---------|
| `registerFieldValidator` | `(field, validator, trigger?) => void` | Plugins register custom validators (e.g. `json_schema` registers its Ajv validator with trigger `'change'`; email/image/file use the same path) |
| `getFormAdmin` | `() => FormAdmin` | Access the enclosing admin instance (e.g. `parent.$refs.form.validateField(prop)` refresh) |
| `easyadminFormDepth` | `number` | Depth in the FormAdmin nesting tree (top-level = 1); feeds the nesting-depth guard, no consumer action needed |
