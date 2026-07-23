# EasyAdmin 配置参考手册

> EasyAdmin 实体配置完整指南 — 从入门到高级。  
> 更新日期：2026-07-23

---

## 1. 快速开始 — Hello World

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

然后在 `src/configs/routes.js` 中添加一行：

```js
children: [
  ...r('Article', '文章'),
]
```

完成。你已经拥有了一个完整的 CRUD，包含列表、创建、编辑和删除功能。

---

## 2. 配置文件结构

### 2.1 目录布局

```
src/configs/
├── index.js               # 聚合导出：{ routes, entities }
├── routes.js              # 菜单/侧边栏 → 路由定义
├── entities.js            # 自动加载器（import.meta.glob）
├── helpers.js             # 共享常量（orderByIdDesc 等）
└── collections/           # 实体定义 — 每个 bundle 一个文件
    ├── common/            # Category, Tag, Content, Comment 等
    ├── trade/             # Product, Order, OrderItem, Specification
    ├── identity/          # User, Profile
    ├── wallet/            # Wallet, WalletTransaction
    ├── promotion/         # Promotion, PromotionTemplate
    ├── payment/           # Invoice
    └── wechat/            # WechatUser
```

### 2.2 文件命名

```
src/configs/collections/{bundle}/{EntityName}.js   # 纯配置文件
src/configs/collections/{bundle}/{EntityName}.jsx  # 带自定义组件的配置
```

自动加载器（`entities.js`）会收集 `collections/` 下的所有 `.js` / `.jsx` 文件。每个文件导出一个顶层对象，键名为实体名称。

### 2.3 实体初始化顺序

`entities.js` 按文件深度决定优先级：
- **子目录中的文件**（深度 2，如 `trade/Product.js`）被视为集合，通过 `Object.assign` 合并。
- **深度 3 以上的文件** 被视为独立实体。
- **`helpers.js` 被排除在自动加载之外**（不导出实体配置）。

---

## 3. EntityConfig — 顶层结构

```typescript
interface EntityConfig {
  entity?: string | {
    name: string           // 实体类名（必填）
    prefix?: string        // API 前缀，默认 "/api/v1/manage"
    plural?: string        // 复数 URL 段，默认自动推断
  }

  form?: FormConfig        // 创建 / 编辑表单
  list?: ListConfig        // 列表 / 表格视图
  detail?: DetailConfig    // 详情 / 只读视图
}
```

### 3.1 `entity` — API 解析器

| 形式 | 示例 | 用途 |
|------|------|------|
| 字符串 | `entity: 'Product'` | 与配置键名相同；自动推断 `/api/v1/manage/products` |
| 对象 | `entity: { name: 'WalletTransaction', plural: 'transactions' }` | 自定义复数或前缀 |
| 省略 | （回退到配置键名） | 当 `EntityName === 实体类名` 时 |

#### 嵌套 API 资源

当管理 API 位于父级前缀下时：

```js
// 在 Product.jsx 的 SpecificationManager 组件中使用
{
  name: 'Specification',
  prefix: `/api/v1/manage/products/${productId}`,
  plural: 'specifications'
}
```

`productId` 在运行时来自父组件。实体文件本身只保存字段定义。

---

## 4. FormConfig — 创建和编辑表单

```typescript
interface FormConfig {
  fields: FieldConfig[] | '__all__'     // 要渲染的字段
  batch_edit?: {                        // 批量编辑弹窗字段
    fields: FieldConfig[]
  }
}
```

### 4.1 `fields` — 三种写法

#### A. 简单字符串数组

```js
form: {
  fields: ['title', 'body', 'enabled']
}
```

每个元素是属性名。插件类型从后端元数据自动推断（如 `type: string → input`，`type: boolean → checkbox` 等）。

#### B. 混合数组（最常用）

```js
form: {
  fields: [
    'title',                                          // 简单字符串
    { property: 'cover', type: 'image' },             // 详细配置
    { property: 'body', type: 'text', tab: '内容' },   // 标签页中的富文本
    { property: 'category', required: false },         // 可选关联
    { property: 'enabled', default_value: true }       // 创建模式默认值
  ]
}
```

#### C. `'__all__'` — 使用所有 API 字段

```js
form: {
  fields: '__all__'
}
```

渲染后端实体结构中的所有字段。字段顺序由 API 决定。

### 4.2 `batch_edit` — 批量编辑弹窗

```js
form: {
  fields: ['title', 'category', 'tags', 'enabled'],
  batch_edit: {
    fields: ['category', 'tags']
  }
}
```

批量编辑多条记录时，仅显示 `category` 和 `tags`。每个字段带有勾选框——用户选择要更新的字段。请求仅将选中的字段发送至 `POST /{plural}/batch-update?@basis=id&@mode=update`。

---

## 5. FieldOption — 每个字段的设置

```typescript
interface FieldOption {
  property: string                      // 实体属性名（必填）
  label?: string                        // 覆盖显示标签
  type?: string                         // 强制指定字段插件类型
  required?: boolean                    // 覆盖后端 nullable
  editable?: boolean                    // 编辑模式下的只读
  tab?: string                          // 归入指定标签页
  default_value?: unknown               // 创建模式下的预填值
  field_options?: Record<string, any>   // 传递给 <el-form-item> 的 props
  field_events?: Record<string, any>    // 传递给 <el-form-item> 的事件
  type_options?: Record<string, any>    // 传递给字段插件的 props
  type_events?: Record<string, any>     // 传递给字段插件的事件
  relation_filter?: {                   // 仅关联字段
    '@filter'?: string                  // DQL 表达式
    '@order'?: string                   // 排序
  }
  creationUrl?: string                  // 创建关联实体的链接
  component?: object | Function         // 自定义 Vue 组件或 JSX
  help?: string                         // 字段下方的帮助文本
}
```

### 5.1 可用的字段类型（`type`）

| 类型字符串 | 渲染组件 | 典型用途 |
|---|---|---|
| `input` | `<el-input>` | 短文本、字符串（默认） |
| `text` | `<Tinymce>` 富文本编辑器 | 长 HTML 内容 |
| `textarea` | `<el-input type="textarea">` | 多行文本 |
| `select` | `<el-select>` 静态选项 | 预定义选项 |
| `boolean` | `<el-checkbox>` | 布尔标志 |
| `integer` | `<el-input-number>` | 整数 |
| `date` | `<el-date-picker>` (yyyy-MM-dd) | 日期 |
| `datetime` | `<el-date-picker>` (yyyy-MM-dd HH:mm:ss) | 日期 + 时间 |
| `image` | `<el-upload>` 单图上传 | 图片上传 |
| `file` | `<el-upload>` 单文件 | 文件上传 |
| `code` | `<el-input type="textarea">` | 代码片段 |
| `json` | `<jsoneditor>` 树/代码视图 | 结构化 JSON |
| `json-custom` | 嵌套 `<FormAdmin>` 子表单 | 子对象编辑 |
| `array` | `<el-select multiple>` 或嵌套表单 | 数组/列表值 |
| `RelationToOne` | `<el-select>` 远程搜索 | 多对一 / 一对一 |
| `RelationToMany` | `<el-select multiple>` | 多对多 / 一对多 |
| `transfer` | `<el-transfer>` 穿梭框 | 双栏选择 |

**类型解析优先级**：`field.type` → API 元数据类型 → `input`。

### 5.2 标签与国际化

```js
// 显式标签（优先级最高）
{ property: 'username', label: '用户名' }

// 使用 field_options（同样有效）
{ property: 'email', field_options: { label: t('Email') } }

// 未设置标签 → 从后端元数据翻译字段自动解析
{ property: 'phone' }  // 标签来自 structure[phone]['translation']
```

### 5.3 必填与验证

```js
// 覆盖后端 nullable
{ property: 'email', required: true }      // 强制必填
{ property: 'notes', required: false }     // 强制可选

// 未设置 → 跟随 structure[property].metadata.nullable
```

### 5.4 编辑模式下的只读

```js
{ property: 'author', editable: false }
```

字段仍显示在表单中，但为只读。适用于系统设置的字段（作者、创建时间等）。

### 5.5 标签页

```js
form: {
  fields: [
    'title',
    'enabled',
    { property: 'body', tab: '内容' },
    { property: 'author', tab: '元数据' },
    { property: 'category', tab: '元数据' }
  ]
}
```

没有 `tab` 的字段放入第一个标签页（默认"默认"）。每个唯一的 `tab` 值创建一个 `<el-tab-pane>`。

### 5.6 默认值

```js
{ property: 'status', default_value: 'active' }
{ property: 'enabled', default_value: true }
{ property: 'currency', default_value: 'CNY' }
```

仅在**创建模式**（`id === 0`）下生效。编辑模式下表单会获取现有记录的值。

### 5.7 帮助文本

```js
{
  property: 'slug',
  help: '用于 URL。只允许字母、数字和连字符。'
}
```

在字段输入框下方渲染灰色帮助文本。

### 5.8 透传 Props 和事件

```js
{
  property: 'email',
  field_options: { labelWidth: '200px' },   // 传递给 <el-form-item>
  field_events: { click: handleClick },     // <el-form-item> 上的事件
  type_options: { maxlength: 50, disabled: false }, // 传递给插件
  type_events: { blur: onBlur }             // 插件上的事件
}
```

---

## 6. 关联字段

### 6.1 多对一 / 一对一

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

插件渲染一个带远程搜索的 `<el-select>`。选项通过 `EntityManage.list()` 从目标实体获取。

对于基于用户输入的动态筛选，设置 `remote: true`：

```js
{
  property: 'product',
  type_options: {
    entity_name: 'Product',    // 覆盖目标实体（否则从元数据获取）
    remote: true               // 启用使用 :value 占位符的关键字搜索
  },
  relation_filter: {
    '@filter': 'entity.getName() matches ":value"'
  }
}
```

### 6.2 多对多 / 一对多

```js
{
  property: 'tags',
  type: 'RelationToMany',
  relation_filter: {
    '@order': 'entity.name|ASC'
  }
}
```

渲染 `<el-select multiple>`。选项获取方式与 `RelationToOne` 相同。

### 6.3 带静态选项的下拉框

对于非关联字段但需要下拉框时：

```js
{
  property: 'status',
  type: 'select',
  default_value: 'active',
  type_options: {
    options: [
      { value: 'active', label: '启用' },
      { value: 'inactive', label: '禁用' }
    ]
  }
}
```

---

## 7. 表单中的自定义组件

### 7.1 内联组件对象

```js
{
  property: 'balance',
  component: {
    props: ['data'],
    render() {
      return <span>¥ {(this.data / 100).toFixed(2)}</span>
    }
  }
}
```

组件接收 props：`data`（当前字段值）、`form`（完整表单数据）、`property`、`fields` 和 `field`（`FieldOption` 本身）。

### 7.2 JSX 配置组件（如 Product.jsx 中的 SpecificationManager）

```js
import ListAdmin from '@/components/EasyAdmin/ListAdmin'
import FormAdmin from '@/components/EasyAdmin/FormAdmin'

const SpecificationManager = {
  components: { ListAdmin, FormAdmin },
  props: ['form', 'data', 'property', 'fields', 'field'],
  // ... 包含 render() 返回 JSX 的完整组件
}

form: {
  fields: [
    // ...
    {
      property: 'specifications',
      tab: '规格',
      component: SpecificationManager
    }
  ]
}
```

组件可以嵌入额外的 CRUD 面板、弹窗和嵌套表单。它通过遍历 `$parent` 找到 `FormAdmin` 实例以获取 `productId` 等信息。

---

## 8. ListConfig — 表格与筛选

```typescript
interface ListConfig {
  list_display?: FieldConfig[]            // 列定义
  list_filter?: Record<string, any>       // 搜索筛选
  query?: Record<string, any>             // 默认查询参数
  disabled_actions?: string[]             // 隐藏操作
  data_processor?: (context) => void      // 自定义数据获取
  actions?: ActionButton[]                // 自定义操作按钮
  export?: { query?, label? }             // CSV 导出
}
```

### 8.1 `list_display` — 列定义

与 `form.fields` 相同的 `FieldConfig` 格式。每个条目渲染表格中的一列：

```js
list_display: [
  'id',                                                      // 纯字段
  { property: 'cover', type: 'image' },                      // 图片列
  'title',                                                    // 文本
  {                                                           // 自定义组件
    property: 'status',
    component: {
      props: ['data'],
      render() {
        const color = this.data === 'active' ? 'success' : 'info'
        return <el-tag type={color}>{this.data}</el-tag>
      }
    }
  },
  { property: 'roles', type: 'array' },                      // 标签数组
  'createdAt'                                                 // 日期时间
]
```

可用的列表插件类型：`boolean`、`date`、`datetime`、`image`、`array`、`RelationToOne`、`RelationToMany`、`editable-plain`（字符串/数字可编辑）、`plain-text`（回退）。

### 8.2 `list_filter` — 三种风格

#### A. 简介风格（自动推断）

```js
list_filter: {
  name: '产品名称',              // 字符串 → type:'input'
  status: {                      // 对象 → type:'select'
    __label: '状态',             // 筛选标签
    __default: 'active',          // 默认值
    active: '启用',               // 选项键: 显示标签
    inactive: '禁用'
  }
}
```

#### B. 完整风格（显式控制）

```js
list_filter: {
  'category.id': {
    expression: "entity.getCategory().getId() == ':value'",
    label: '分类',
    type: 'select',               // 'select' | 'input' | 'datetime' | 'date' | 'time' | 'boolean'
    data: [
      { value: 1, label: '书籍' },
      { value: 2, label: '食品' }
    ],
    default: 1
  }
}
```

#### C. 异步风格

```js
list_filter: {
  'category.id': () => axios
    .get('/api/v1/manage/categories')
    .then(res => ({
      __label: '分类',
      __default: res.data[0]?.id,
      ...Object.fromEntries(res.data.map(v => [v.id, v.name]))
    }))
}
```

Promise 的结果对象：`__label` → 筛选标签，`__default` → 默认值，其余键 → 选项。

### 8.3 `query` — 默认查询参数

```js
// 共享 helper（见 helpers.js）：
export const orderByIdDesc = { '@order': 'entity.id|DESC' }

list: {
  query: orderByIdDesc
  // 或内联写法：
  query: { '@order': 'entity.sort|ASC, entity.id|DESC' }
}
```

支持的参数：`@filter`、`@order`、`@select`、`@groupBy`、`page`、`limit` 等。

### 8.4 `disabled_actions` — 隐藏默认操作

| 操作 ID | 隐藏内容 |
|---|---|
| `new` | "新建"按钮 |
| `detail` | 每行的"详情"按钮 |
| `edit` | 每行的"编辑"按钮 |
| `delete` | 每行的"删除"按钮 |
| `batch_edit` | "批量修改"工具栏按钮 |
| `batch_delete` | "批量删除"工具栏按钮和选择列 |
| `lines` | 整个"操作"列 |
| `pager` | 分页栏 |
| `export` | "导出"按钮 |

```js
list: {
  disabled_actions: ['new', 'delete']   // 只读表格
}
```

### 8.5 `data_processor` — 自定义数据获取

覆盖默认的 `em.structure()` + `em.list()` 流程：

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

### 8.6 `actions` — 自定义操作按钮

```typescript
interface ActionButton {
  name: string                    // 唯一名称
  position: 'top' | 'list'       // 顶部工具栏 或 每行操作列
  component: VueComponent         // Vue 组件或 JSX 渲染函数
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
              回收
            </el-button>
          )
        }
      }
    }
  ]
}
```

### 8.7 `export` — CSV 导出

```js
list: {
  export: {
    query: { '@select': 'entity.title, entity.createdAt' },
    label: {
      title: '标题',
      createdAt: '创建日期'
    }
  }
}
```

- `query`：附加到默认查询 + 当前筛选的额外参数。使用 `@select` 限制导出字段。
- `label`：列头映射。省略则使用属性名作为表头。

---

## 9. DetailConfig — 只读详情页

```typescript
interface DetailConfig {
  detail_display?: FieldConfig[] | '__all__'    // 要显示的字段
  fields?: FieldConfig[] | '__all__'             // detail_display 的别名
  disabled_actions?: string[]                    // 隐藏操作：'edit'
}
```

### 9.1 字段回退链

```
detail.detail_display  →  list.list_display  →  form.fields  →  所有 API 字段
```

### 9.2 详情页独有功能

```js
detail: {
  detail_display: [
    'id',
    'title',
    'category',
    { property: 'metadata', type: 'json', full_width: true },  // 全宽行
    { property: 'items', full_width: true },                    // 关联
    'createdAt'
  ]
}
```

`full_width: true` 让字段占据整行宽度。适用于 JSON 对象、富文本和关联列表。

### 9.3 详情插件

详情视图的自定义插件放在 `plugins/detail/` 中。现有的：

| 插件 | 类型 | 行为 |
|------|------|------|
| `image.vue` | image | 带边框和阴影的全宽预览 |
| `json.vue` | json | 带 2 空格缩进的 `<pre>`，可折叠，语法高亮 |

添加新详情插件：创建 `plugins/detail/{type}.vue`，带有 props `value`、`field`、`scope`、`em`、`struct`。通过 `import.meta.glob` 自动发现。

---

## 10. 路由配置 — 侧边栏与导航

文件：`src/configs/routes.js`

```js
import { r } from '@/router/generator'
import { t } from '@/i18n'
import Layout from '@/layout'

export default [
  {
    path: '/content',
    name: 'ContentManage',                                  // 唯一路由名称
    component: Layout,                                      // 始终为 Layout
    meta: {
      title: t('Content Management'),                       // 侧边栏菜单文本
      icon: 'el-icon-notebook',                              // Element Plus 图标
      roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']             // 访问控制
    },
    children: [
      ...r('Content', t('Content')),                         // 实体路由
      ...r('Page', t('Page')),
      ...r('Comment', t('Comment')),
    ]
  }
]
```

### 10.1 `r(entityName, title)` 生成器

```js
r('Product', 'Product')
```

生成：
- `/{kebab-name}/list` — 列表页
- `/{kebab-name}/create` — 创建页
- `/{kebab-name}/:id/update` — 编辑页
- `/{kebab-name}/:id/detail` — 详情页

实体名称转 URL 段：`inflect.dasherize(inflect.underscore(entityName))`。

| 实体名称 | URL 段 |
|---|---|
| Product | product |
| WalletTransaction | wallet-transaction |
| OrderItem | order-item |

### 10.2 `g(entityName, title, meta?, component?)` 生成器

`r()` 的替代方案。用于自定义页面组件而非共享 CRUD 视图。

### 10.3 `meta` 字段

| 字段 | 类型 | 描述 |
|---|---|---|
| `title` | string | 侧边栏菜单文本 |
| `icon` | string | Element Plus 图标类（如 `el-icon-goods`） |
| `roles` | string[] | 访问控制的允许角色 |
| `hidden` | boolean | 在侧边栏中隐藏（仍可通过 URL 访问） |
| `noCache` | boolean | 禁用 keep-alive 缓存 |
| `affix` | boolean | 固定标签页 |

---

## 11. 完整真实示例

### 11.1 简单 CMS 内容

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

### 11.2 带 JSX 自定义组件的产品

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
        // 用于嵌套规格的自定义内联组件
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

### 11.3 订单 — 大量筛选 + 全宽详情

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

## 12. 快速参考表

### 12.1 所有 `type` 值

| 分类 | 类型 |
|---|---|
| 文本 | `input`、`text`、`textarea`、`code` |
| 数字 | `integer` |
| 布尔 | `boolean` |
| 日期/时间 | `date`、`datetime` |
| 媒体 | `image`、`file` |
| 结构化 | `json`、`json-custom`、`array` |
| 关联 | `RelationToOne`、`RelationToMany` |
| 选择 | `select`、`transfer` |

### 12.2 所有 `disabled_actions` 值

| 值 | 效果 |
|---|---|
| `new` | 隐藏"新建"按钮 |
| `detail` | 隐藏每行"详情"按钮 |
| `edit` | 隐藏每行"编辑"按钮 |
| `delete` | 隐藏每行"删除"按钮 |
| `batch_edit` | 隐藏"批量修改"按钮 |
| `batch_delete` | 隐藏"批量删除"按钮 + 选择列 |
| `lines` | 隐藏整个操作列 |
| `pager` | 隐藏分页栏 |
| `export` | 隐藏"导出"按钮 |

### 12.3 筛选类型

| 类型 | 渲染 |
|---|---|
| `select` | `<el-select>` 下拉框 |
| `input` | 带搜索图标的 `<el-input>` |
| `boolean` | `<el-switch>` |
| `datetime` | `<el-date-picker type="datetime">` |
| `date` | `<el-date-picker type="date">` |
| `time` | `<el-date-picker type="time">` |

### 12.4 详情页额外属性

| 属性 | 类型 | 描述 |
|---|---|---|
| `full_width` | boolean | 占据整行宽度 |
| `type` | string | 强制指定渲染插件（如 `json`、`image`） |
| `label` | string | 覆盖显示标签 |

---

## 13. 常见模式

### 13.1 共享辅助函数（`helpers.js`）

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

### 13.2 API 路径构建

```js
import { API_PREFIX, apiPath } from '@/api/prefix'

apiPath(API_PREFIX, 'manage/categories')
// → "/api/v1/manage/categories"
```

### 13.3 带查询构建的自定义数据获取

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
      context.filter,     // 从当前筛选选项构建
      context.pager,      // { page, limit }
      context.sort        // 列排序状态
    )).then(res => {
      context.list = res.data
      context.paginator = res.paginator
      context.loading = false
    })
  }
}
```

### 13.4 通过路由进行访问控制

```js
meta: {
  title: t('System Options'),
  icon: 'el-icon-setting',
  roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']   // 仅这些角色可访问
}
```

权限在 `src/permission.js`（`router.beforeEach`）中检查。没有所需角色的用户无法访问该部分。

### 13.5 批量操作检查清单

1. 在 `form.batch_edit.fields` 中添加要批处理的字段。
2. 当 `delete` + `batch_delete` 未被禁用时，选择列会自动出现。
3. "批量删除"对每条选中记录调用 `DELETE /{plural}/{id}`，并报告部分失败。
4. "批量修改"打开弹窗。用户选择字段 → 填写值 → `POST /{plural}/batch-update?@basis=id&@mode=update`。

---

## 14. 国际化注意事项

- 所有实体名称应作为 i18n 键注册在 `en.js`、`zh.js`、`zh-Hant.js`、`ja.js` 中。
- 路由标题使用 `import { t } from '@/i18n'` 生成侧边栏标签。
- 字段标签如未显式设置，将自动从后端元数据翻译中获取。
- 模板中使用 `$t('key')`；脚本/配置中使用 `t('key')`；切勿混用。
