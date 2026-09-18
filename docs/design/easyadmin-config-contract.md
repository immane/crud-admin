# EasyAdmin Config Contract

> Vue Admin Skeleton — EasyAdmin Config Contract (Complete Reference)  
> Last updated: 2026-09-18

---

## 1. Config File Location

```
src/configs/
├── index.js                  # Aggregated export { routes, entities }
├── routes.js                 # Menu/route declarations (using r() generator)
├── entities.js               # Auto-loader (import.meta.glob)
├── schema/                   # Machine-checkable entity config schema
└── collections/
    ├── helpers.js            # Shared constants (orderByIdDesc, statusFilterLabel)
    ├── store/Store.js        # Per-bundle, per-entity files…
    ├── trade/Product.jsx     # …(.jsx when a custom component is embedded)
    └── …
```

Each entity lives in its own file (`{bundle}/{Entity}.js[x]`); there is no
single aggregated config file. See also §11: collection files must never
statically import UI components.

---

## 2. Top-Level Config Structure

Each collection file exports `Record<string, EntityConfig>` (usually one
entity per file):

```js
// src/configs/collections/trade/Specification.js
export default {
  Specification: { /* EntityConfig */ }
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
   * FieldConfig[]: string items are property names; explicit items first.
   * The special item '__all__' means "all remaining fields here": explicit
   * configs render first, then every field not explicitly configured
   * (e.g. Store detail renders two explicit json_schema fields + '__all__').
   * A top-level '__all__' string (all structure fields) is also accepted;
   * current configs use the string form in detail.detail_display.
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
   * Resolution order: field.relation (+resolveRelation) > field.type >
   * backend metadata.type (allowlisted) > 'input'
   *
   * Available values:
   *   'input' | 'text' (rich text) | 'textarea' | 'select' | 'boolean' |
   *   'integer' | 'currency' | 'password' | 'email' |
   *   'date' | 'datetime' | 'time' |
   *   'image' | 'images' | 'file' |
   *   'code' | 'json' | 'json_schema' | 'json-custom' | 'array' | 'transfer' |
   *   'RelationToOne' | 'RelationToMany'
   *
   * Note: 'text' renders the Tinymce rich-text editor (not a plain textarea);
   * 'currency' displays yuan and stores cents via type_options.multiplier.
   * Backend metadata only maps the allowlist (array, boolean, code, date,
   * datetime, image(s), integer, json, text, textarea, transfer); anything
   * else from metadata falls back to 'input', so metadata alone never yields
   * select/password/email/currency/json_schema.
   */
  type?: string

  // ─── Form Behavior ─────────────────────────────

  /** Override backend metadata nullability (true = required) */
  required?: boolean

  /** Custom validation rules merged into el-form rules (array or single rule) */
  rules?: object | object[]

  /** Custom validator function(s); wrapped with a default blur trigger */
  validator?: Function | Function[]

  /** Hide the field: boolean, mode ('create'/'update'/'edit'), mode array, or (form, id) => boolean */
  hidden?: boolean | string | string[] | Function

  /** Enable inline editing in list cells (string/integer/float/decimal fields only, never id/image) */
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

  /** Props passed to the field plugin. Per-type shapes include:
   *  select: { options: [{ value, label }] }, integer: { min, max },
   *  relation: { remote, options }, currency: { multiplier, currency },
   *  upload: { storage, ... }, json_schema: { schema, fields } */
  type_options?: Record<string, unknown>

  /** Events bound to the field plugin */
  type_events?: Record<string, Function>

  // ─── Relation Fields Only ──────────────────────

  /**
   * Relation target override (checked BEFORE field.type by resolvePluginType).
   * { entity: 'User', multiple?: boolean, valueKey?: 'uuid' } — valueKey
   * selects which key of the related object becomes the form value.
   */
  relation?: {
    entity?: string
    target?: string
    multiple?: boolean
    valueKey?: string
  }

  /** Relation query filter */
  relation_filter?: {
    '@filter'?: string     // DQL expression
    '@order'?: string      // Sort order
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
   * Available: 'new' | 'detail' | 'edit' | 'delete' | 'batch_edit' |
   * 'batch_delete' | 'lines' | 'pager' | 'export'
   * (disabling 'delete' also hides 'batch_delete')
   */
  disabled_actions?: string[]

  /** CSV export config (query params + column label mapping).
   *  The toolbar export button appears only when this is set; exportData
   *  merges list query + current filter + export.query.
   *  (The `export` component prop is a dummy — config is the real source.) */
  export?: {
    query?: Record<string, string>   // Export query params
    label?: Record<string, string>   // Column label mapping
  }

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

`__default` is optional (omit it for no pre-selection). Beyond `==` filters,
expressions also cover `matches ":value"` (backend substring LIKE, do not
pre-wrap `%`) and datetime comparisons such as
`entity.getCreatedAt() >= ":value"`.

Auto-conversion rule: In the `Promise` result, `__label` is the label, `__default` is the default value, and the remaining key-value pairs are options.

### 7.4 DQL Expression Rules (backend-verified)

Custom `expression` values must follow the crud-skeleton `ExpressionDqlParser` contract:

- Use `entity.getX()` chains (e.g. `entity.getCategory().getId()`). Bare property access (`entity.status`), `is*`/`has*` getters (`entity.isSystem()`), and bare names are not DQL-safe. Boolean `isSystem` properties are queried as `entity.getIsSystem()`.
- Join with `&&` / `||` (never `and` / `or`). Null tests use bare `entity.getX()` (`IS NOT NULL`) or `!entity.getX()` (`IS NULL`), never `== null`.
- Sort with `@order` (`field|DIR`, comma-separated), never `@sort`.

Every `list_filter.expression` and `relation_filter['@filter']` is checked by the
config-wide DQL fast-path validator. Every entity's complete `list_filter` map,
default query, URL state, and resolved REST identity is also locked in
`tests/unit/easyadmin/golden/__fixtures__/all-config-query-matrix.golden.json`.
Update that explicit JSON golden in the same change as a query-relevant config
edit; snapshots are intentionally not used.

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
import { t } from '@/i18n'

export default [
  {
    path: '/catalog',            // Menu path
    name: 'CatalogManage',       // Route name (unique)
    component: Layout,           // Layout component
    meta: {
      title: t('Product Management'),  // Menu display name (translated)
      icon: 'el-icon-goods',     // Element UI icon
      roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']  // Role whitelist
    },
    children: [
      ...r('Product', t('Product'))  // Auto-generates list/create/edit/detail routes
    ]
  }
]
```

### Routes Generated by r()

```js
r('Product', 'Product')
// Generates 4 routes (Create/Update/Detail/List):
[
  {
    path: '/dummy/product/create',
    redirect: '/product/create',            // string redirect
    name: 'ProductCreate',
    meta: { title: 'Product' },
    hidden: true
  },
  {
    path: '/dummy/product/:id/update',
    redirect: to => `/product/${to.params.id}/update`,  // function redirect
    name: 'ProductUpdate',
    hidden: true
  },
  {
    path: '/dummy/product/:id/detail',
    redirect: to => `/product/${to.params.id}/detail`,  // function redirect
    name: 'ProductDetail',
    hidden: true
  },
  {
    path: '/dummy/product/list',
    redirect: '/product/list',              // string redirect
    name: 'ProductList',
    meta: { title: 'Product' }              // only List carries meta
  }
]
```

`routes.js` currently wires only `r()`; `g()` (direct-component routes passing
`entityParam` as props) is available but unused. When `meta` is omitted, `r()`
defaults it to `{ title, icon: 'el-icon-caret-right' }`.

---

## 10. Complete Example

```js
// src/configs/collections/common/Category.js

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

---

## 11. Config Module Import Rule

`configs/entities.js` eagerly loads every module under `collections/`
(`import.meta.glob(..., { eager: true })`), and `FormAdmin`/`ListAdmin` both
import `entities`. Therefore a collection file must **never statically import
UI components** (`@/easyadmin/ui/**`, `@/views/**`): it closes the eager cycle
`FormAdmin → entities → <collection> → ListAdmin → FormAdmin`, which fails
with `Cannot access 'FormAdmin' before initialization` depending on module
evaluation order (survives fresh loads, detonates after HMR or import-graph
changes) and blanks async chunks such as the `json_schema` plugins.

Custom field components that need admin UI (e.g. `SpecificationManager` in
`trade/Product.jsx`) must resolve it lazily:

```js
const ListAdmin = defineAsyncComponent(() => import('@/easyadmin/ui/vue/ListAdmin'))
const FormAdmin = defineAsyncComponent(() => import('@/easyadmin/ui/vue/FormAdmin'))
```

The async wrapper supports the same props/slots; `$parent` walks (e.g. for
`productId`) keep working because they skip wrapper nodes until the real
`FormAdmin` ancestor. Guarded by
`tests/unit/easyadmin/configs/product-async-admin.spec.js`.

A custom `component:` that embeds `FormAdmin` counts toward the nesting depth
guard (top-level form = 1, limit 10, placeholder past it — see EasyAdmin
Design §9.3). Never configure a form to embed itself, directly or through an
array sub-form/dialog: it renders the depth placeholder instead of recursing.
