# EasyAdmin Config Contract

> Vue Admin Skeleton — EasyAdmin Config Contract (Complete Reference)  
> Last updated: 2026-07-03

---

## 1. Config File Location

```
src/configs/
├── index.js                  # Aggregated export { routes, entities }
├── routes.js                 # Menu/route declarations (using r() generator)
├── entities.js               # Auto-loader (import.meta.glob)
└── collections/
    └── common/
        └── index.js          # ⭐ All entity CRUD configs
```

---

## 2. Top-Level Config Structure

File: `src/configs/collections/common/index.js`

```typescript
// Top-level export: Record<string, EntityConfig>
export default {
  Product: { /* EntityConfig */ },
  Order:   { /* EntityConfig */ },
  // ...
}
```

---

## 3. EntityConfig

```typescript
interface EntityConfig {
  /**
   * Entity identifier
   * 
   * string: Entity class name (e.g. "Product")
   * object: Detailed config
   */
  entity?: string | {
    name: string        // Entity class name (required)
    prefix?: string      // API prefix, default "/api/v1/manage"
    plural?: string      // Plural form, default auto-inferred
  }

  /** Form config */
  form?: FormConfig

  /** List config */
  list?: ListConfig

  /** Detail config */
  detail?: DetailConfig
}
```

### Examples

```js
export default {
  // Simple form: entity as string
  Product: {
    entity: 'Product',
    form: { fields: ['name', 'price', 'enabled'] },
    list: { list_display: ['id', 'name', 'price', 'enabled'] }
  },

  // Advanced form: entity as object (custom plural)
  Transaction: {
    entity: {
      name: 'Transaction',
      plural: 'transactions'     // Override auto-inference
    },
    list: { /* ... */ }
  }
}
```

---

## 4. FormConfig

```typescript
interface FormConfig {
  /**
   * Form field list
   * 
   * string[]: Simple property name list
   * FieldOption[]: Detailed field configs
   * '__all__': Use all fields from the backend API
   */
  fields: FieldConfig[] | '__all__'

  /**
   * Batch edit config
   * Fields shown in the batch edit dialog.
   * Uses the same FieldConfig format as fields.
   */
  batch_edit?: {
    fields: FieldConfig[]
  }
}
```

### Examples

```js
form: {
  fields: [
    'title',                              // Simple string
    { property: 'cover', type: 'image' }, // Detailed config
    {
      property: 'category',               // Relation field
      relation_filter: {
        '@filter': 'entity.getType().getSlug() == "content"',
        '@order': 'entity.id|ASC'
      }
    },
    'enabled',
    { property: 'content', type: 'text' }
  ]
}
```

---

## 5. FieldOption

```typescript
interface FieldOption {
  // ─── Basic Properties ──────────────────────────
  
  /** Entity property name (required) */
  property: string

  /** Override display label (default uses backend translation) */
  label?: string

  /** 
   * Force field type plugin
   * Priority: field.type > API metadata.type > 'input'
   * 
   * Available values:
   *   'input' | 'text' | 'textarea' | 'select' | 'boolean' |
   *   'integer' | 'float' | 'decimal' |
   *   'date' | 'datetime' | 'time' |
   *   'image' | 'images' | 'file' |
   *   'code' | 'json' | 'json_schema' | 'json-custom' | 'array' | 'transfer' |
   *   'RelationToOne' | 'RelationToMany'
   */
  type?: string

  // ─── Form Behavior ─────────────────────────────

  /** Override backend metadata nullability (true = required) */
  required?: boolean

  /** Read-only in edit mode */
  editable?: boolean

  /** Group into a named tab (same tab value = same tab) */
  tab?: string

  /** Default value in create mode */
  default_value?: unknown

  // ─── Props & Events Passthrough ────────────────

  /** Props passed to el-form-item */
  field_options?: Record<string, unknown>

  /** Events bound to el-form-item */
  field_events?: Record<string, Function>

  /** Props passed to the field plugin */
  type_options?: Record<string, unknown>

  /** Events bound to the field plugin */
  type_events?: Record<string, Function>

  // ─── Relation Fields Only ──────────────────────

  /** Relation query filter */
  relation_filter?: {
    '@filter'?: string     // DQL expression
    '@order'?: string       // Sort order
  }

  /** Link to create related entity */
  creationUrl?: string

  // ─── Custom Rendering ──────────────────────────

  /** Custom Vue component or JSX render function (bypasses plugin system) */
  component?: object | Function

  /** Help text below the field */
  help?: string
}
```

### JSON Schema Fields

Use `type: 'json_schema'` to render an object-valued JSON property with generated
FormAdmin fields. `type_options.schema` accepts a static JSON Schema object or an
async provider receiving `{ entity, id, property, form }`. Unsupported schemas fall
back to the raw JSON editor so existing data remains editable.

```js
{
  property: 'address',
  type: 'json_schema',
  type_options: { schema: StoreAddressSchema }
}
```

The generated field labels (`title` or property name), descriptions, and enum labels
are translated through `t()` automatically. Add those English keys to every locale
file under `src/i18n/` when adding a schema.

Supported Schema keywords include `type`, `properties`, `required`, `default`,
`description`, `enum`, `const`, `format` (`email`, `date`, `date-time`), string
lengths, numeric bounds, `pattern`, primitive array item schemas, `uniqueItems`,
`additionalProperties`, and draft-07 `dependencies`. Composition keywords such as
`$ref`, `oneOf`, `anyOf`, `allOf`, and `patternProperties` fall back to `json.vue`.

Schema validation is performed with Ajv when the outer form submits. Empty optional
properties are excluded from the validation copy; empty required properties remain
invalid. Before submission, FormAdmin recursively removes `null` and `undefined`
object properties from the payload.

Static schemas should live beside their entity configuration:

```js
// src/configs/collections/store/Store.js
import StoreAddressSchema from './StoreAddress.json'

{ property: 'address', type: 'json_schema', type_options: { schema: StoreAddressSchema } }
```

Use the same explicit field definition in `detail.detail_display` to render a
schema-ordered label/value view in `DetailAdmin`. Properties absent from the schema
are retained as additional rows; unsupported schemas fall back to the standard JSON
detail renderer.

`type_options.fields` accepts normal `FieldOption[]` overrides for schema properties.
Configured properties render first in that order; remaining schema properties follow.
`field_options` and `type_options` merge with generated values. `hidden`, display type,
labels, help text, plugin options, and additional rules can be overridden, but schema
required properties remain required for JSON Schema validation.

For schemas supplied by the backend, use an async provider without changing the field
contract:

```js
{
  property: 'address',
  type: 'json_schema',
  type_options: {
    schema: async ({ entity, id, property }) => {
      const { data } = await request.get(`/schemas/${entity}/${property}`, { params: { id } })
      return data
    }
  }
}
```

---

## 6. ListConfig

```typescript
interface ListConfig {
  /** Columns to display (same as FieldOption, also supports component custom rendering) */
  list_display?: FieldConfig[]

  /**
   * Filter config
   * key: Property name (supports nesting like 'category.id')
   * value: Async function, reduced style object, or full style object
   */
  list_filter?: Record<string, FilterConfig>

  /** Default query params (e.g. '@order': 'entity.id|DESC') */
  query?: Record<string, unknown>

  /**
   * Hide default actions
   * Available: 'new' | 'detail' | 'edit' | 'delete' | 'batch_edit' | 'batch_delete' | 'lines' | 'pager' | 'export'
   */
  disabled_actions?: string[]

  /** Custom data fetch function (overrides default em.list()) */
  data_processor?: (context: ListAdmin) => Promise<void>

  /** Custom action buttons */
  actions?: ActionButton[]

  /** CSV export config */
  export?: {
    query?: Record<string, unknown>   // Export query params
    label?: Record<string, string>    // Column label mapping
  }
}
```

---

## 6.1 DetailConfig

```typescript
interface DetailConfig {
  /** Detail fields. Defaults to list.list_display, then form.fields, then all API fields. */
  detail_display?: FieldConfig[] | '__all__'

  /** Alias for detail_display. */
  fields?: FieldConfig[] | '__all__'

  /** Hide detail page actions: 'edit'. */
  disabled_actions?: string[]
}
```

Detail fields use the same `FieldOption` contract and list rendering plugins as `list_display`.
Set `span: 2` or `full_width: true` on a field to occupy the full detail row.

---

## 7. FilterConfig

### 7.1 Reduced Style

```typescript
// When value is a plain object, auto-inferred as DQL filter

// Option filter:
list_filter: {
  status: {
    __label: 'Status',        // Label text
    __default: 'active',      // Default value
    active: 'Enabled',         // key: label (auto-generates DQL)
    inactive: 'Disabled'
  }
}

// Text search:
list_filter: {
  name: 'Product Name'        // String → auto-inferred as type:'input'
}
```

### 7.2 Full Style

```typescript
list_filter: {
  'category.id': {
    expression: "entity.getCategory().getId() == ':value'",
    label: 'Category',
    type: 'select',          // 'select' | 'input' | 'datetime' | 'date' | 'time' | 'boolean'
    data: [
      { value: 'book', label: 'Books' },
      { value: 'food', label: 'Food' }
    ],
    default: 'book'
  }
}
```

### 7.3 Async/Promise Style

```typescript
list_filter: {
  'category.id': () => {
    return axios.get('/api/categories', {
      params: { '@filter': 'entity.getType().getSlug() == "content"' }
    }).then(res => ({
      __label: 'Category',
      __default: res.data[0]?.id,
      ...Object.fromEntries(res.data.map(v => [v.id, v.name]))
    }))
  }
}
```

Auto-conversion rule: In the `Promise` result, `__label` is the label, `__default` is the default value, and the remaining key-value pairs are options.

### 7.4 DQL Expression Rules (backend-verified)

Custom `expression` values must follow the crud-skeleton `ExpressionDqlParser` contract:

- Use `entity.getX()` chains (e.g. `entity.getCategory().getId()`). Bare property access (`entity.status`), `is*`/`has*` getters (`entity.isSystem()`), and bare names are not DQL-safe. Boolean `isSystem` properties are queried as `entity.getIsSystem()`.
- Join with `&&` / `||` (never `and` / `or`). Null tests use bare `entity.getX()` (`IS NOT NULL`) or `!entity.getX()` (`IS NULL`), never `== null`.
- Sort with `@order` (`field|DIR`, comma-separated), never `@sort`.

---

## 8. ActionButton

```typescript
interface ActionButton {
  name: string                     // Button text
  position: 'top' | 'list'         // Position: top toolbar / per-row action column
  component: object | Function     // Vue component or JSX render function
}
```

---

## 9. Route Config (configs/routes.js)

```typescript
import { r } from '@/router/generator'
import Layout from '@/layout'

export default [
  {
    path: '/catalog',            // Menu path
    name: 'CatalogManage',       // Route name (unique)
    component: Layout,           // Layout component
    meta: {
      title: 'Product Management',  // Menu display name
      icon: 'el-icon-goods',     // Element UI icon
      roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']  // Role whitelist
    },
    children: [
      ...r('Product', 'Product')  // Auto-generates list/create/edit routes
    ]
  }
]
```

### Routes Generated by r()

```js
r('Product', 'Product')
// Generates:
[
  {
    path: '/dummy/product/create',
    redirect: '/product/create',
    name: 'ProductCreate',
    meta: { title: 'Product' },
    hidden: true
  },
  {
    path: '/dummy/product/:id/update',
    redirect: '/product/:id/update',
    name: 'ProductUpdate',
    meta: { title: 'Product' },
    hidden: true
  },
  {
    path: '/dummy/product/list',
    redirect: '/product/list',
    name: 'ProductList',
    meta: { title: 'Product' }
  }
]
```

---

## 10. Complete Example

```js
// src/configs/collections/common/index.js

export default {
  Content: {
    entity: 'Content',

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
        {
          property: 'cover',
          type: 'image'
        },
        'enabled',
        {
          property: 'content',
          type: 'text',
          tab: 'Content'
        },
        {
          property: 'author',
          tab: 'Metadata',
          editable: false
        }
      ]
    },

    list: {
      query: { '@order': 'entity.id|DESC' },

      list_filter: {
        'category.id': () => axios.get('/api/categories', {
          params: { '@filter': 'entity.getType().getSlug() == "content"' }
        }).then(res => ({
          __label: 'Category',
          ...Object.fromEntries(res.data.map(v => [v.id, v.name]))
        })),
        status: {
          __label: 'Status',
          published: 'Published',
          draft: 'Draft'
        }
      },

      list_display: [
        'id',
        { property: 'cover', type: 'image' },
        'category',
        'title',
        {
          property: 'status',
          component: {
            props: ['data'],
            render(h) {
              const color = this.data === 'published' ? 'success' : 'info'
              return <el-tag type={color}>{this.data}</el-tag>
            }
          }
        },
        'createdTime'
      ],

      disabled_actions: ['export']
    }
  }
}
```

    list: {
      query: { '@order': 'entity.id|DESC' },

      list_filter: {
        'category.id': () => axios.get('/api/categories', {
          params: { '@filter': 'entity.getType().getSlug() == "content"' }
        }).then(res => ({
          __label: '分类',
          ...Object.fromEntries(res.data.map(v => [v.id, v.name]))
        })),
        status: {
          __label: '状态',
          published: '已发布',
          draft: '草稿'
        }
      },

      list_display: [
        'id',
        { property: 'cover', type: 'image' },
        'category',
        'title',
        {
          property: 'status',
          component: {
            props: ['data'],
            render(h) {
              const color = this.data === 'published' ? 'success' : 'info'
              return <el-tag type={color}>{this.data}</el-tag>
            }
          }
        },
        'createdTime'
      ],

      disabled_actions: ['export']
    }
  }
}
```
