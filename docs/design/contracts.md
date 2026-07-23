# Code Contracts & API Contracts

> Vue Admin Skeleton — Code Contracts & API Contracts  
> Last updated: 2026-07-03

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
  totalCount: number    // Total record count
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

- Token stored in Cookie: `dream_studio_admin_token`
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
          "translation"?: {
            "label"?: string,
            "help"?: string
          }
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

### 3.5 Batch Update

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

### 3.6 Query Parameters

The list endpoint supports the following query params:

| Param | Description | Example |
|-------|-------------|---------|
| `@page` | Page number (1-based) | `@page=1` |
| `@limit` | Items per page | `@limit=25` |
| `@order` | Sort order | `@order=entity.id\|DESC` |
| `@filter` | DQL filter expression | `@filter=entity.status=="active"` |
| `@query` | Free text search | `@query=keyword` |

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
- `WalletTransaction` → `wallet-transaction`

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
| `entityConf` | String \| Object | Yes | Entity name or EntityManage config |
| `value` (v-model) | Object (Form) / Array (List) | No | Bound data |

### 7.2 FormAdmin-Specific Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | Number | 0 | Primary key (0=create, >0=edit) |
| `fields` | Array \| String | — | Field list or `'__all__'` |

### 7.3 ListAdmin-Specific Props

| Prop | Type | Description |
|------|------|-------------|
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
