# EasyAdmin Config Reference Manual

> Complete guide to EasyAdmin entity configuration — from minimal to advanced.  
> Updated: 2026-07-23

---

## 1. Quick Start — Hello World

```js
// src/configs/collections/common/index.js
export default {
  Article: {
    entity: 'Article',
    form: {
      fields: ['title', 'body', 'enabled']
    },
    list: {
      list_display: ['id', 'title', 'enabled', 'createdAt']
    }
  }
}
```

Then add one line in `src/configs/routes.js`:

```js
children: [
  ...r('Article', 'Articles'),
]
```

Done. You now have a fully working CRUD with list, create, edit, and delete.

---

## 2. Config File Structure

### 2.1 Directory Layout

```
src/configs/
├── index.js               # Aggregated export: { routes, entities }
├── routes.js              # Menu/sidebar → route definitions
├── entities.js            # Auto-loader (import.meta.glob)
├── helpers.js             # Shared constants (orderByIdDesc, etc.)
└── collections/           # Entity definitions — one file per bundle
    ├── common/            # Category, Tag, Content, Comment, etc.
    ├── trade/             # Product, Order, OrderItem, Specification
    ├── identity/          # User, Profile
    ├── wallet/            # Wallet, WalletTransaction
    ├── promotion/         # Promotion, PromotionTemplate
    ├── payment/           # Invoice
    └── wechat/            # WechatUser
```

### 2.2 File Naming

```
src/configs/collections/{bundle}/{EntityName}.js   # plain config
src/configs/collections/{bundle}/{EntityName}.jsx  # config with custom components
```

The auto-loader (`entities.js`) collects all `.js` / `.jsx` files under `collections/`. Each file exports a top-level object whose keys are entity names.

### 2.3 Entity Initialization Order

`entities.js` decides precedence by file depth:
- Files in **subdirectories** (depth 2, e.g. `trade/Product.js`) are treated as collections — merged with `Object.assign`.
- Files at **depth 3+** (e.g. `nested/deep/Entity.js`) are treated as standalone entities.
- **`helpers.js` is excluded** from auto-loading (no export of entity configs).

---

## 3. EntityConfig — Top-Level Shape

```typescript
interface EntityConfig {
  entity?: string | {
    name: string           // Entity class name (required)
    prefix?: string        // API prefix, default "/api/v1/manage"
    plural?: string        // Plural URL segment, default auto-inferred
  }

  form?: FormConfig        // Create / Edit form
  list?: ListConfig        // List / Table view
  detail?: DetailConfig    // Detail / Read-only view
}
```

### 3.1 `entity` — API Resolver

| Form | Example | Use Case |
|------|---------|----------|
| string | `entity: 'Product'` | Same name as the config key; auto-infers `/api/v1/manage/products` |
| object | `entity: { name: 'WalletTransaction', plural: 'transactions' }` | Custom plural or prefix |
| omitted | (falls back to the config key) | When `EntityName === entity class name` |

#### Nested API Resources

When the manage API lives under a parent prefix:

```js
// Used inside Product.jsx's SpecificationManager component
{
  name: 'Specification',
  prefix: `/api/v1/manage/products/${productId}`,
  plural: 'specifications'
}
```

The `productId` comes from the parent component at runtime. The entity file itself holds only the field definitions.

---

## 4. FormConfig — Create & Edit Form

```typescript
interface FormConfig {
  fields: FieldConfig[] | '__all__'     // Fields to render
  batch_edit?: {                        // Batch edit dialog fields
    fields: FieldConfig[]
  }
}
```

### 4.1 `fields` — Three Forms

#### A. Simple String Array

```js
form: {
  fields: ['title', 'body', 'enabled']
}
```

Each element is a property name. The plugin type is auto-inferred from the backend metadata (`type: string → input`, `type: boolean → checkbox`, etc.).

#### B. Mixed Array (most common)

```js
form: {
  fields: [
    'title',                                          // simple string
    { property: 'cover', type: 'image' },             // detailed config
    { property: 'body', type: 'text', tab: 'Content' }, // rich text in a tab
    { property: 'category', required: false },         // optional relation
    { property: 'enabled', default_value: true }       // default in create mode
  ]
}
```

#### C. `'__all__'` — Use All API Fields

```js
form: {
  fields: '__all__'
}
```

Renders every field from the backend entity structure. Field order is determined by the API.

### 4.2 `batch_edit` — Batch Edit Dialog

```js
form: {
  fields: ['title', 'category', 'tags', 'enabled'],
  batch_edit: {
    fields: ['category', 'tags']
  }
}
```

When editing multiple records at once, only `category` and `tags` are shown. Each field gets a checkbox — the user chooses which fields to update. The request sends only the checked fields to `POST /{plural}/batch-update?@basis=id&@mode=update`.

---

## 5. FieldOption — Per-Field Settings

```typescript
interface FieldOption {
  property: string                      // Entity property name (required)
  label?: string                        // Override display label
  type?: string                         // Force field plugin type
  required?: boolean                    // Override nullable from backend
  editable?: boolean                    // Read-only in edit mode
  tab?: string                          // Group into a named tab
  default_value?: unknown               // Pre-filled value in create mode
  field_options?: Record<string, any>   // Props → <el-form-item>
  field_events?: Record<string, any>    // Events → <el-form-item>
  type_options?: Record<string, any>    // Props → field plugin component
  type_events?: Record<string, any>     // Events → field plugin component
  relation_filter?: {                   // Only for relation fields
    '@filter'?: string                  // DQL expression
    '@order'?: string                   // Sort order
  }
  creationUrl?: string                  // Link to create related entity
  component?: object | Function         // Custom Vue component or JSX
  help?: string                         // Help text below the field
}
```

### 5.1 Available Field Types (`type`)

| Type String | Renders | Typical Use |
|---|---|---|
| `input` | `<el-input>` | Short text, strings (default) |
| `text` | `<Tinymce>` rich editor | Long HTML content |
| `textarea` | `<el-input type="textarea">` | Multi-line text |
| `select` | `<el-select>` with static options | Pre-defined choices |
| `boolean` | `<el-checkbox>` | True/false flags |
| `integer` | `<el-input-number>` | Whole numbers |
| `currency` | `<el-input-number>` + currency code | Monetary values (stored as integer cents) |
| `date` | `<el-date-picker>` (yyyy-MM-dd) | Dates |
| `datetime` | `<el-date-picker>` (yyyy-MM-dd HH:mm:ss) | Date + time |
| `image` | `<el-upload>` single-image wall mode | Image upload |
| `file` | `<el-upload>` single file | File upload |
| `code` | CodeMirror 6 editor | Code snippets with line numbers and syntax highlighting |
| `json` | `<jsoneditor>` tree/code view | Structured JSON objects |
| `json-custom` | Nested `<FormAdmin>` sub-form | Sub-object editing |
| `array` | `<el-select multiple>` or nested form | Array/list values |
| `RelationToOne` | `<el-select>` remote search | ManyToOne / OneToOne |
| `RelationToMany` | `<el-select multiple>` | ManyToMany / OneToMany |
| `transfer` | `<el-transfer>` shuttle box | Dual-pane selection |

**Type resolution priority**: `field.type` → API metadata type → `input`.

#### CodeMirror 6 Options

The `code` field type uses CodeMirror 6 and fills the available form width by default.

```js
{
  property: 'dsl',
  type: 'code',
  type_options: {
    language: 'javascript',  // javascript | typescript | json | html | css | sql
    height: 360,             // pixels; default: 280px
    readonly: false,
    disabled: false
  }
}
```

It includes line numbers, syntax highlighting, bracket matching, active-line highlighting, undo/redo, and Tab indentation.

#### Currency Options

The `currency` field type stores values as integers (e.g. cents) and displays them as formatted currency. Input is in decimal units (e.g. yuan); storage is integer multiplied by `multiplier`.

```js
{
  property: 'amount',
  type: 'currency',
  type_options: {
    multiplier: 100,    // divide by this for display; default: 100
    currency: 'CNY'     // ISO 4217 currency code; default: 'CNY'
  }
}
```

Display uses `Intl.NumberFormat` with `narrowSymbol` per the active locale. For example:
- `CNY` → `¥12,345.00` (zh-CN), `¥12,345.00` (en-US)
- `USD` → `$123.45`
- `EUR` → `€123.45`

Additional `type_options` are passed through to `<el-input-number>`. For example, `{ min: 0, max: 999999 }`.

In list/detail views, values are formatted with the currency symbol. In forms, users input decimal amounts alongside the currency code label.

### 5.2 Labels & i18n

```js
// Explicit label (takes priority)
{ property: 'username', label: 'User Name' }

// Using field_options (also works)
{ property: 'email', field_options: { label: t('Email') } }

// No label set → auto-resolve from backend metadata translation field
{ property: 'phone' }  // label will come from structure[phone]['translation']
```

### 5.3 Required & Validation

```js
// Override backend nullable
{ property: 'email', required: true }      // force required
{ property: 'notes', required: false }     // force optional

// If not set → follows structure[property].metadata.nullable
```

### 5.4 Read-only in Edit Mode

```js
{ property: 'author', editable: false }
```

The field still appears in the form but is read-only. Useful for fields set by the system (author, createdAt, etc.).

### 5.5 Tabs

```js
form: {
  fields: [
    'title',
    'enabled',
    { property: 'body', tab: 'Content' },
    { property: 'author', tab: 'Metadata' },
    { property: 'category', tab: 'Metadata' }
  ]
}
```

Fields without `tab` go into the first tab ("Default" by default). Each unique `tab` value creates a new `<el-tab-pane>`.

### 5.6 Default Values

```js
{ property: 'status', default_value: 'active' }
{ property: 'enabled', default_value: true }
{ property: 'currency', default_value: 'CNY' }
```

Only applied in **create mode** (`id === 0`). In edit mode the form fetches the existing record's values.

### 5.7 Help Text

```js
{
  property: 'slug',
  help: 'Used in the URL. Only letters, numbers, and hyphens.'
}
```

Renders a gray help paragraph below the field input.

### 5.8 Passthrough Props & Events

```js
{
  property: 'email',
  field_options: { labelWidth: '200px' },   // passed to <el-form-item>
  field_events: { click: handleClick },     // events on <el-form-item>
  type_options: { maxlength: 50, disabled: false }, // passed to the plugin
  type_events: { blur: onBlur }             // events on the plugin
}
```

---

## 6. Relation Fields

### 6.1 ManyToOne / OneToOne

```js
{
  property: 'category',
  type: 'RelationToOne',
  relation_filter: {
    '@filter': 'entity.getType().getSlug() == "content"',
    '@order': 'entity.name|ASC'
  }
}
```

The plugin renders an `<el-select>` with remote search. Options are fetched from the target entity via `EntityManage.list()`.

For dynamic filtering based on user input, set `remote: true`:

```js
{
  property: 'product',
  type_options: {
    entity_name: 'Product',    // override target entity (otherwise from metadata)
    remote: true               // enable keyword search with :value placeholder
  },
  relation_filter: {
    '@filter': 'entity.getName() matches ":value"'
  }
}
```

### 6.2 ManyToMany / OneToMany

```js
{
  property: 'tags',
  type: 'RelationToMany',
  relation_filter: {
    '@order': 'entity.name|ASC'
  }
}
```

Renders an `<el-select multiple>`. Options are fetched the same way as `RelationToOne`.

### 6.3 Select with Static Options

For non-relation fields that just need a dropdown:

```js
{
  property: 'status',
  type: 'select',
  default_value: 'active',
  type_options: {
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  }
}
```

---

## 7. Custom Components in Forms

### 7.1 Inline Component Objects

```js
{
  property: 'balance',
  component: {
    props: ['data'],
    render() {
      return <span>$ {(this.data / 100).toFixed(2)}</span>
    }
  }
}
```

The component receives props: `data` (the current field value), `form` (the full form data), `property`, `fields`, and `field` (the `FieldOption` itself).

### 7.2 JSX Config Components (e.g. SpecificationManager in Product.jsx)

```js
import ListAdmin from '@/components/EasyAdmin/ListAdmin'
import FormAdmin from '@/components/EasyAdmin/FormAdmin'

const SpecificationManager = {
  components: { ListAdmin, FormAdmin },
  props: ['form', 'data', 'property', 'fields', 'field'],
  // ... full component with render() returning JSX
}

form: {
  fields: [
    // ...
    {
      property: 'specifications',
      tab: 'Specifications',
      component: SpecificationManager
    }
  ]
}
```

The component can embed additional CRUD panels, dialogs, and nested forms. It walks `$parent` to find the `FormAdmin` instance for things like `productId`.

---

## 8. ListConfig — Table & Filter

```typescript
interface ListConfig {
  list_display?: FieldConfig[]            // Columns
  list_filter?: Record<string, any>       // Search filters
  query?: Record<string, any>             // Default query params
  disabled_actions?: string[]             // Hide actions
  data_processor?: (context) => void      // Custom data fetch
  actions?: ActionButton[]                // Custom action buttons
  export?: { query?, label? }             // CSV export
}
```

### 8.1 `list_display` — Column Definitions

Same `FieldConfig` format as `form.fields`. Each entry renders a column in the table:

```js
list_display: [
  'id',                                                    // plain field
  { property: 'cover', type: 'image' },                    // image column
  'title',                                                  // text
  {                                                        // custom component
    property: 'status',
    component: {
      props: ['data'],
      render() {
        const color = this.data === 'active' ? 'success' : 'info'
        return <el-tag type={color}>{this.data}</el-tag>
      }
    }
  },
  { property: 'roles', type: 'array' },                    // array as tags
  'createdAt'                                              // datetime
]
```

Available list plugin types: `boolean`, `currency`, `date`, `datetime`, `image`, `array`, `RelationToOne`, `RelationToMany`, `editable-plain` (string/int editable), `plain-text` (fallback).

### 8.2 `list_filter` — Three Styles

#### A. Reduced Style (auto-inferred)

```js
list_filter: {
  name: 'Product Name',           // string → type:'input'
  status: {                       // object → type:'select'
    __label: 'Status',            // filter label
    __default: 'active',           // default value
    active: 'Active',              // option key: display label
    inactive: 'Inactive'
  }
}
```

#### B. Full Style (explicit control)

```js
list_filter: {
  'category.id': {
    expression: "entity.getCategory().getId() == ':value'",
    label: 'Category',
    type: 'select',               // 'select' | 'input' | 'datetime' | 'date' | 'time' | 'boolean'
    data: [
      { value: 1, label: 'Books' },
      { value: 2, label: 'Food' }
    ],
    default: 1
  }
}
```

#### C. Async / Promise Style

```js
list_filter: {
  'category.id': () => axios
    .get('/api/v1/manage/categories')
    .then(res => ({
      __label: 'Category',
      __default: res.data[0]?.id,
      ...Object.fromEntries(res.data.map(v => [v.id, v.name]))
    }))
}
```

The promise result is an object: `__label` → filter label, `__default` → default value, remaining keys → options.

### 8.3 `query` — Default Query Params

```js
// Shared helper (see helpers.js):
export const orderByIdDesc = { '@order': 'entity.id|DESC' }

list: {
  query: orderByIdDesc
  // or inline:
  query: { '@order': 'entity.sort|ASC, entity.id|DESC' }
}
```

Supported params: `@filter`, `@order`, `@select`, `@groupBy`, `page`, `limit`, etc.

### 8.4 `disabled_actions` — Hide Default Actions

| Action ID | Hides |
|---|---|
| `new` | "New" button |
| `detail` | "Details" button per row |
| `edit` | "Edit" button per row |
| `delete` | "Delete" button per row |
| `batch_edit` | "Batch Edit" toolbar button |
| `batch_delete` | "Batch Delete" toolbar button and selection column |
| `lines` | Entire "Actions" column |
| `pager` | Pagination bar |
| `export` | "Export" button |

```js
list: {
  disabled_actions: ['new', 'delete']   // read-only table
}
```

### 8.5 `data_processor` — Custom Data Fetch

Override the default `em.structure()` + `em.list()` pipeline:

```js
list: {
  data_processor(context) {
    context.loading = true
    context.em.structure().then(res => { context.structure = res })
    context.em.list({ '@order': 'entity.priority|DESC' }).then(res => {
      context.list = res.data
      context.paginator = res.paginator
      context.loading = false
    })
  }
}
```

### 8.6 `actions` — Custom Action Buttons

```typescript
interface ActionButton {
  name: string                    // Unique name
  position: 'top' | 'list'       // Top toolbar or per-row action column
  component: VueComponent         // Vue component or JSX render function
}
```

```js
list: {
  actions: [
    {
      name: 'recycle',
      position: 'list',
      component: {
        props: ['record', 'refresh'],
        methods: {
          recycle(id) {
            axios.put(`/api/v1/manage/contents/${id}`, { isDeleted: true })
              .then(() => { this.refresh() })
          }
        },
        render() {
          return (
            <el-button size="small" type="danger" plain
              onClick={() => this.recycle(this.record.id)}>
              Recycle
            </el-button>
          )
        }
      }
    }
  ]
}
```

### 8.7 `export` — CSV Export

```js
list: {
  export: {
    query: { '@select': 'entity.title, entity.createdAt' },
    label: {
      title: 'Title',
      createdAt: 'Date Created'
    }
  }
}
```

- `query`: extra params appended to the default query + current filter. Use `@select` to limit exported fields.
- `label`: column header mapping. Omit to use property names as headers.

---

## 9. DetailConfig — Read-Only Detail Page

```typescript
interface DetailConfig {
  detail_display?: FieldConfig[] | '__all__'    // Fields to display
  fields?: FieldConfig[] | '__all__'             // Alias for detail_display
  disabled_actions?: string[]                    // Hide actions: 'edit'
}
```

### 9.1 Field Fallback Chain

```
detail.detail_display  →  list.list_display  →  form.fields  →  all API fields
```

### 9.2 Detail-Only Features

```js
detail: {
  detail_display: [
    'id',
    'title',
    'category',
    { property: 'metadata', type: 'json', full_width: true },  // full-width row
    { property: 'items', full_width: true },                    // relations
    'createdAt'
  ]
}
```

`full_width: true` makes the field span the entire row. Useful for JSON objects, rich text, and relation lists.

### 9.3 Detail Plugins

Custom plugins for detail view go in `plugins/detail/`. The existing ones:

| Plugin | Type | Behavior |
|--------|------|----------|
| `image.vue` | image | Full-width preview with border and shadow |
| `json.vue` | json | `<pre>` with 2-space indent, expand/collapse, syntax coloring |

Adding a new detail plugin: create `plugins/detail/{type}.vue` with props `value`, `field`, `scope`, `em`, `struct`. It is auto-discovered via `import.meta.glob`.

---

## 10. Route Config — Sidebar & Navigation

File: `src/configs/routes.js`

```js
import { r } from '@/router/generator'
import { t } from '@/i18n'
import Layout from '@/layout'

export default [
  {
    path: '/content',
    name: 'ContentManage',                                  // unique route name
    component: Layout,                                      // always Layout
    meta: {
      title: t('Content Management'),                       // sidebar menu text
      icon: 'el-icon-notebook',                              // Element Plus icon
      roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']             // access control
    },
    children: [
      ...r('Content', t('Content')),                         // entity routes
      ...r('Page', t('Page')),
      ...r('Comment', t('Comment')),
    ]
  }
]
```

### 10.1 `r(entityName, title)` Generator

```js
r('Product', 'Product')
```

Generates:
- `/{kebab-name}/list` — List page
- `/{kebab-name}/create` — Create page
- `/{kebab-name}/:id/update` — Edit page
- `/{kebab-name}/:id/detail` — Detail page

Entity name to URL segment: `inflect.dasherize(inflect.underscore(entityName))`.

| Entity Name | URL segment |
|---|---|
| Product | product |
| WalletTransaction | wallet-transaction |
| OrderItem | order-item |

### 10.2 `g(entityName, title, meta?, component?)` Generator

Alternative to `r()`. Used for custom page components instead of the shared CRUD views.

### 10.3 `meta` Fields

| Field | Type | Description |
|---|---|---|
| `title` | string | Sidebar menu text |
| `icon` | string | Element Plus icon class (e.g. `el-icon-goods`) |
| `roles` | string[] | Allowed roles for access control |
| `hidden` | boolean | Hide from sidebar (still accessible by URL) |
| `noCache` | boolean | Disable keep-alive cache |
| `affix` | boolean | Pin the tab |

---

## 11. Complete Real-World Examples

### 11.1 Simple CMS Content

```js
// src/configs/collections/common/Content.js
import { t } from '@/i18n'
import axios from '@/utils/request'
import { API_PREFIX, apiPath } from '@/api/prefix'
import { orderByIdDesc } from '../helpers'

export default {
  Content: {
    form: {
      fields: [
        'title',
        { property: 'body' },
        { property: 'category', required: false },
        { property: 'tags', required: false }
      ],
      batch_edit: {
        fields: ['category', 'tags']
      }
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        title: t('Title'),
        'category.id': () => axios
          .get(apiPath(API_PREFIX, 'manage/categories'))
          .then(res => Object.assign(
            { __label: t('Category') },
            ...res.data.map(v => ({ [v.id]: v.name }))
          ))
      },
      list_display: ['id', 'title', 'category', 'tags', 'createdAt', 'updatedAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
```

### 11.2 Product with JSX Custom Component

```js
// src/configs/collections/trade/Product.jsx
import { t } from '@/i18n'
import { orderByIdDesc, statusFilterLabel } from '../helpers'

export default {
  Product: {
    form: {
      fields: [
        'name',
        { property: 'description', type: 'text', required: false },
        {
          property: 'status', type: 'select',
          default_value: 'active',
          type_options: {
            options: [
              { value: 'active', label: t('Active') },
              { value: 'inactive', label: t('Inactive') }
            ]
          }
        },
        { property: 'metadata', type: 'json', required: false },
        // Custom inline component for nested specifications
        { property: 'specifications', tab: t('Specifications'), component: SpecificationManager }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        name: t('Product Name'),
        status: statusFilterLabel()
      },
      list_display: ['id', 'name', 'status', 'isDeleted', 'createdAt', 'updatedAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
```

### 11.3 Order — Filter-Heavy + Detail with Full-Width

```js
// src/configs/collections/trade/Order.js
import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Order: {
    form: {
      fields: [
        { property: 'notes', type: 'text', required: false },
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        status: {
          __label: t('Status'),
          draft: t('Draft'), pending: t('Pending'),
          confirmed: t('Confirmed'), paid: t('Paid'),
          fulfilled: t('Fulfilled'), completed: t('Completed'),
          cancelled: t('Cancelled'), refunded: t('Refunded')
        }
      },
      list_display: [
        'id', 'uuid', 'user', 'totalAmount', 'currency',
        'status', 'paymentMethod', 'paidAt', 'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id', 'uuid', 'user', 'totalAmount', 'currency', 'status',
        { property: 'items', full_width: true },
        { property: 'notes', type: 'text', full_width: true },
        { property: 'metadata', type: 'json', full_width: true },
        'shippingAddress', 'billingAddress', 'createdAt', 'updatedAt'
      ]
    }
  }
}
```

---

## 12. Quick Reference Tables

### 12.1 All `type` Values

| Category | Types |
|---|---|
| Text | `input`, `text`, `textarea`, `code` |
| Numeric | `integer` |
| Monetary | `currency` |
| Boolean | `boolean` |
| Date/Time | `date`, `datetime` |
| Media | `image`, `file` |
| Structured | `json`, `json-custom`, `array` |
| Relations | `RelationToOne`, `RelationToMany` |
| Selection | `select`, `transfer` |

### 12.2 All `disabled_actions` Values

| Value | Effect |
|---|---|
| `new` | Hide "New" button |
| `detail` | Hide "Details" button per row |
| `edit` | Hide "Edit" button per row |
| `delete` | Hide "Delete" button per row |
| `batch_edit` | Hide "Batch Edit" button |
| `batch_delete` | Hide "Batch Delete" button + selection column |
| `lines` | Hide entire actions column |
| `pager` | Hide pagination bar |
| `export` | Hide "Export" button |

### 12.3 Filter Types

| Type | Renders |
|---|---|
| `select` | `<el-select>` dropdown |
| `input` | `<el-input>` with search icon |
| `boolean` | `<el-switch>` |
| `datetime` | `<el-date-picker type="datetime">` |
| `date` | `<el-date-picker type="date">` |
| `time` | `<el-date-picker type="time">` |

### 12.4 Detail Field Extra Properties

| Property | Type | Description |
|---|---|---|
| `full_width` | boolean | Span the full row width |
| `type` | string | Force a specific render plugin (e.g. `json`, `image`) |
| `label` | string | Override display label |

---

## 13. Common Patterns

### 13.1 Shared Helpers (`helpers.js`)

```js
import { t } from '@/i18n'

export const orderByIdDesc = { '@order': 'entity.id|DESC' }

export const statusFilter = {
  active: t('Active'),
  inactive: t('Inactive')
}

export const statusFilterLabel = (label = null) => ({
  __label: label || t('Status'),
  ...statusFilter
})
```

### 13.2 API Path Construction

```js
import { API_PREFIX, apiPath } from '@/api/prefix'

apiPath(API_PREFIX, 'manage/categories')
// → "/api/v1/manage/categories"
```

### 13.3 Custom Data Fetch with Query Building

```js
list: {
  query: { '@order': 'entity.id|DESC' },
  list_filter: {
    title: t('Title')
  },
  data_processor(context) {
    context.loading = true

    context.em.structure().then(res => { context.structure = res })
    context.em.list(Object.assign({},
      context.query,
      context.filter,     // built from current filter selections
      context.pager,      // { page, limit }
      context.sort        // column sort state
    )).then(res => {
      context.list = res.data
      context.paginator = res.paginator
      context.loading = false
    })
  }
}
```

### 13.4 Access Control via Routes

```js
meta: {
  title: t('System Options'),
  icon: 'el-icon-setting',
  roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']   // Only these roles can access
}
```

Permission is checked in `src/permission.js` (`router.beforeEach`). Users without the required roles cannot access the section.

### 13.5 Batch Operations Checklist

1. Add `form.batch_edit.fields` with the fields you want batch-editable.
2. The selection column appears automatically when `delete` + `batch_delete` are not disabled.
3. "Batch Delete" calls `DELETE /{plural}/{id}` for each selected record, reporting partial failures.
4. "Batch Edit" opens a dialog. User picks fields → fills values → `POST /{plural}/batch-update?@basis=id&@mode=update`.

---

## 14. i18n Notes

- All entity names should be registered as i18n keys across `en.js`, `zh.js`, `zh-Hant.js`, `ja.js`.
- Route titles use `import { t } from '@/i18n'` for sidebar labels.
- Field labels auto-resolve from backend metadata translations if not explicitly set.
- In templates, use `$t('key')`. In scripts/configs, use `t('key')`. Never mix them.
