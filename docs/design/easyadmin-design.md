# EasyAdmin Design

> Vue Admin Skeleton — EasyAdmin Engine Design Document  
> Last updated: 2026-07-03

---

## 1. Overview

EasyAdmin is the core CRUD engine of Vue Admin Skeleton. It is a **configuration-driven** system that automatically generates complete CRUD interfaces (list + form + filter + routes) from declarative entity definitions — no boilerplate code required.

### Design Goals

- **Zero boilerplate**: Define config → auto-generate CRUD UI
- **Extensible**: Plugin-based field type system with custom rendering support
- **Metadata-driven**: Automatically infer field types, validation rules, and relations from the backend API
- **Declarative filtering**: DQL expression-driven filter builder
- **Two-tier caching**: Vuex + sessionStorage for entity structure caching

---

## 2. Core Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Config Layer                             │
│  configs/routes.js     Menu/route definitions                 │
│  configs/collections/  Entity schema definitions              │
│  configs/entities.js   Auto-loader (import.meta.glob)         │
└──────────────────────────┬───────────────────────────────────┘
                           │ entity config
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                       View Layer                              │
│  views/admin/list.vue   Reads config → renders ListAdmin      │
│  views/admin/form.vue   Reads config → renders FormAdmin      │
└──────────────────────────┬───────────────────────────────────┘
                           │ props
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    EasyAdmin Engine Layer                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ListAdmin.vue                                           │ │
│  │  ├── SearchFilter.vue  (Dynamic filter builder)          │ │
│  │  ├── el-table           (Dynamic column renderer)        │ │
│  │  ├── el-pagination      (Pagination)                     │ │
│  │  └── plugins/list/      (Inline edit plugins)            │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  FormAdmin.vue                                            │ │
│  │  ├── el-tabs            (Tab grouping)                    │ │
│  │  ├── el-form            (Dynamic form)                    │ │
│  │  └── plugins/form/      (17 field-type plugins)           │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────┘
                           │ API calls
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                       Data Layer                              │
│  utils/entity.ts    EntityManage CRUD class                   │
│  utils/request.ts   Axios JWT instance                        │
│  store/entity.js    Vuex structure cache                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow

```
User visits /:entityParam/list
  ↓
views/admin/list.vue:
  1. Extract $route.params.entityParam
  2. camelize → lookup admin.entities[alias]
  3. Pass config → <ListAdmin>
  ↓
ListAdmin.created():
  1. Create EntityManage instance
  2. Call dataProcessor (default: em.structure() + em.list())
  3. Build table columns (from list_display config)
  4. Render el-table
  ↓
User clicks "Create" → router.push(`/${entityPath}/create`)
  ↓
views/admin/form.vue:
  1. Same entityParam extraction
  2. Pass config.fields → <FormAdmin>
  ↓
FormAdmin.created():
  1. Create EntityManage instance
  2. Call em.structure() → get field metadata
  3. Transform fields (string → {property} object)
  4. Generate validation rules (from metadata.nullable)
  5. Build tabs (from field.tab)
  6. If editing: em.retrieve(id) → populate form
  7. If creating: apply default_value
  ↓
FormAdmin submit:
  1. el-form.validate()
  2. cleanBlankAttributes()
  3. em.create() or em.update()
  4. $router.go(-1)
```

---

## 4. Plugin System

### 4.1 Plugin Loading Mechanism

```
FormAdmin.loadPlugin(type):
  1. Type normalization:
     'images' → 'image'
     'ManyToOne' → 'RelationToOne'
     'OneToOne' → 'RelationToOne'
     'ManyToMany' → 'RelationToMany'
     'OneToMany' → 'RelationToMany'
  2. Lookup ./plugins/form/{normalizedType}.vue
  3. Not found → fall back to input.vue
  4. Lazy load: defineAsyncComponent()
```

### 4.2 Type Resolution Priority

```
1. field.type (explicitly set in config) — highest priority
2. structure[field.property].metadata.type (backend API metadata)
3. 'input' — final fallback
```

### 4.3 Plugin Props Contract

Each plugin receives:

```typescript
{
  form: Record<string, any>     // Reactive form object
  field: FieldOption             // Current field config
  struct?: {                     // Backend metadata (optional)
    metadata: {
      type: string
      nullable: boolean
      targetEntity?: string
    }
  }
  emPrefix?: string              // API prefix
}
```

Plugins receive additional config via `v-bind="field.type_options"` and `v-on="field.type_events"`.

### 4.4 Plugin List

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
| `json.vue` | — | `<PrismEditor>` (JSON highlight + format) |
| `json-custom.vue` | — | Nested `<FormAdmin>` (sub-object editor) |
| `array.vue` | array | `<el-select multiple>` or nested `<FormAdmin>` |
| `RelationToOne.vue` | ManyToOne, OneToOne | `<el-select>` (remote search) |
| `RelationToMany.vue` | ManyToMany, OneToMany | `<el-select multiple>` (remote search) |
| `transfer.vue` | — | `<el-transfer>` (shuttle box) |

---

## 5. List Column Rendering

### 5.1 Render Priority (ListAdmin)

```
field.component?     → <component :is="field.component">
field.editable?      → <EditablePlain> (inline edit: string/integer/float)
boolean?             → <el-switch> or <el-tag>
date?                → formatted date + icon
datetime?            → formatted datetime + icon
ManyToOne/OneToOne?  → record.__toString
ManyToMany/OneToMany/Array? → <el-tag> list (max 5, tooltip)
image?               → <el-image> (preview)
fallback             → plain text (strip HTML)
```

### 5.2 Relation Field Extraction

```js
// Supports nested property paths
extractFields(dataObject, 'user.profile.phone')
// → dataObject.user.profile.phone
```

---

## 6. Filter System (SearchFilter)

### 6.1 Filter Flow

```
SearchFilter.created():
  filterProcess():
    Iterate listFilter keys
    Async functions → await → transform result
    Reduced style → auto-generate DQL expression
    Full style → use provided expression

User clicks Search:
  filterGenerate():
    Replace :value placeholders
    Merge with base query['@filter'] (using &&)
    Trigger fetchDataFunc()
```

### 6.2 Filter Widget Types

| type | Widget |
|------|--------|
| `datetime` / `date` / `time` | `<el-date-picker>` |
| `input` | `<el-input>` (search icon) |
| `boolean` | `<el-switch>` |
| `select` (default) | `<el-select>` (filterable, clearable) |
| custom | `field.component` rendered directly |

---

## 7. EntityManage Class

### 7.1 Constructor

```typescript
constructor(conf: string | {
  name: string      // Entity name (e.g. "Product")
  prefix?: string   // API prefix (default "/api/v1/manage")
  plural?: string   // Plural form (default auto-inferred)
})
```

### 7.2 Pluralization

Uses the `i` (inflect) library:

| Entity Name | Plural Form |
|-------------|-------------|
| Product | products |
| Category | categories |
| WalletTransaction | wallet-transactions |

Can be overridden via `{ plural: 'transactions' }`.

### 7.3 Structure Caching Strategy

```
structure():
  1. Check Vuex store.entity.structures[entityName]
  2. Cache hit → return directly
  3. No cache → GET /system/entities/{fqcn}
  4. Store in Vuex → auto-persist to sessionStorage
  5. sessionStorage key: dream_studio_structures
```

---

## 8. Custom Extension Points

### 8.1 FormAdmin Slots

| Slot | Location | Usage |
|------|----------|-------|
| `formTitle` | Top of form | Custom title area |
| `{field.property}` | Per field position | Override single field rendering |
| Default slot | Bottom of form | Extra content |

### 8.2 ListAdmin Slots

| Slot | Location | Usage |
|------|----------|-------|
| `filter` | Below search bar | Custom filter area |
| `topButton` | Next to create button | Top action buttons |
| `action` | Per row action column | Custom row actions |
| `{field.property}` | Per column position | Override column rendering |
| `extraAction` | End of action column | Extra action buttons |

### 8.3 Custom Components

```js
{
  property: 'amount',
  component: {
    props: ['data'],
    render(h) {
      return <span style={{ color: this.data > 0 ? 'green' : 'red' }}>
        {this.data}
      </span>
    }
  }
}
```

### 8.4 Custom Field Plugins

```
src/components/EasyAdmin/plugins/form/my-custom.vue
```

As long as the plugin follows the Plugin Props Contract, it will be automatically discovered and loaded by `import.meta.glob`.
        {this.data}
      </span>
    }
  }
}
```

### 8.4 自定义字段插件

```
src/components/EasyAdmin/plugins/form/my-custom.vue
```
只要遵循 plugin props 契约即可自动被 `import.meta.glob` 发现并加载。
