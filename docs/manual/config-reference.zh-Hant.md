# EasyAdmin 設定參考手冊

> EasyAdmin 實體設定完整指南 — 從入門到進階。  
> 更新日期：2026-07-23

---

## 1. 快速開始 — Hello World

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

然後在 `src/configs/routes.js` 中新增一行：

```js
children: [
  ...r('Article', '文章'),
]
```

完成。你已經擁有了一個完整的 CRUD，包含清單、新增、修改和刪除功能。

---

## 2. 設定檔案結構

### 2.1 目錄佈局

```
src/configs/
├── index.js               # 聚合匯出：{ routes, entities }
├── routes.js              # 選單/側邊欄 → 路由定義
├── entities.js            # 自動載入器（import.meta.glob）
├── helpers.js             # 共用常數（orderByIdDesc 等）
└── collections/           # 實體定義 — 每個 bundle 一個檔案
    ├── common/            # Category, Tag, Content, Comment 等
    ├── trade/             # Product, Order, OrderItem, Specification
    ├── identity/          # User, Profile
    ├── wallet/            # Wallet, WalletTransaction
    ├── promotion/         # Promotion, PromotionTemplate
    ├── payment/           # Invoice
    └── wechat/            # WechatUser
```

### 2.2 檔案命名

```
src/configs/collections/{bundle}/{EntityName}.js   # 純設定檔案
src/configs/collections/{bundle}/{EntityName}.jsx  # 帶自訂組件的設定
```

自動載入器（`entities.js`）會收集 `collections/` 下的所有 `.js` / `.jsx` 檔案。每個檔案匯出一個頂層物件，鍵名為實體名稱。

### 2.3 實體初始化順序

`entities.js` 按檔案深度決定優先級：
- **子目錄中的檔案**（深度 2，如 `trade/Product.js`）被視為集合，透過 `Object.assign` 合併。
- **深度 3 以上的檔案** 被視為獨立實體。
- **`helpers.js` 被排除在自動載入之外**（不匯出實體設定）。

---

## 3. EntityConfig — 頂層結構

```typescript
interface EntityConfig {
  entity?: string | {
    name: string           // 實體類別名稱（必填）
    prefix?: string        // API 前綴，預設 "/api/v1/manage"
    plural?: string        // 複數 URL 區段，預設自動推斷
  }

  form?: FormConfig        // 新增 / 修改表單
  list?: ListConfig        // 清單 / 表格檢視
  detail?: DetailConfig    // 詳情 / 唯讀檢視
}
```

### 3.1 `entity` — API 解析器

| 形式 | 範例 | 用途 |
|------|------|------|
| 字串 | `entity: 'Product'` | 與設定鍵名相同；自動推斷 `/api/v1/manage/products` |
| 物件 | `entity: { name: 'WalletTransaction', plural: 'transactions' }` | 自訂複數或前綴 |
| 省略 | （回退到設定鍵名） | 當 `EntityName === 實體類別名稱` 時 |

#### 巢狀 API 資源

當管理 API 位於父級前綴下時：

```js
// 在 Product.jsx 的 SpecificationManager 組件中使用
{
  name: 'Specification',
  prefix: `/api/v1/manage/products/${productId}`,
  plural: 'specifications'
}
```

`productId` 在執行階段來自父組件。實體檔案本身只儲存欄位定義。

---

## 4. FormConfig — 新增和修改表單

```typescript
interface FormConfig {
  fields: FieldConfig[] | '__all__'     // 要繪製的欄位
  batch_edit?: {                        // 批量修改彈窗欄位
    fields: FieldConfig[]
  }
}
```

### 4.1 `fields` — 三種寫法

#### A. 簡單字串陣列

```js
form: {
  fields: ['title', 'body', 'enabled']
}
```

每個元素是屬性名。外掛類型從後端元資料自動推斷（如 `type: string → input`，`type: boolean → checkbox` 等）。

#### B. 混合陣列（最常用）

```js
form: {
  fields: [
    'title',                                          // 簡單字串
    { property: 'cover', type: 'image' },             // 詳細設定
    { property: 'body', type: 'text', tab: '內容' },   // 分頁中的多行文字
    { property: 'category', required: false },         // 可選關聯
    { property: 'enabled', default_value: true }       // 新增模式預設值
  ]
}
```

#### C. `'__all__'` — 使用所有 API 欄位

```js
form: {
  fields: '__all__'
}
```

繪製後端實體結構中的所有欄位。欄位順序由 API 決定。

### 4.2 `batch_edit` — 批量修改彈窗

```js
form: {
  fields: ['title', 'category', 'tags', 'enabled'],
  batch_edit: {
    fields: ['category', 'tags']
  }
}
```

批量修改多筆記錄時，僅顯示 `category` 和 `tags`。每個欄位帶有核取方塊——使用者選擇要更新的欄位。請求僅將選中的欄位傳送至 `POST /{plural}/batch-update?@basis=id&@mode=update`。

---

## 5. FieldOption — 每個欄位的設定

```typescript
interface FieldOption {
  property: string                      // 實體屬性名（必填）
  label?: string                        // 覆蓋顯示標籤
  type?: string                         // 強制指定欄位外掛類型
  required?: boolean                    // 覆蓋後端 nullable
  editable?: boolean                    // 修改模式下的唯讀
  tab?: string                          // 歸入指定分頁
  default_value?: unknown               // 新增模式下的預填值
  field_options?: Record<string, any>   // 傳遞給 <el-form-item> 的 props
  field_events?: Record<string, any>    // 傳遞給 <el-form-item> 的事件
  type_options?: Record<string, any>    // 傳遞給欄位外掛的 props
  type_events?: Record<string, any>     // 傳遞給欄位外掛的事件
  relation_filter?: {                   // 僅關聯欄位
    '@filter'?: string                  // DQL 表達式
    '@order'?: string                   // 排序
  }
  creationUrl?: string                  // 新增關聯實體的連結
  component?: object | Function         // 自訂 Vue 組件或 JSX
  help?: string                         // 欄位下方的說明文字
}
```

### 5.1 可用的欄位類型（`type`）

| 類型字串 | 繪製組件 | 典型用途 |
|---|---|---|
| `input` | `<el-input>` | 短文字、字串（預設） |
| `text` | `<Tinymce>` 多行文字編輯器 | 長 HTML 內容 |
| `textarea` | `<el-input type="textarea">` | 多行文字 |
| `select` | `<el-select>` 靜態選項 | 預定義選項 |
| `boolean` | `<el-checkbox>` | 布林標誌 |
| `integer` | `<el-input-number>` | 整數 |
| `date` | `<el-date-picker>` (yyyy-MM-dd) | 日期 |
| `datetime` | `<el-date-picker>` (yyyy-MM-dd HH:mm:ss) | 日期 + 時間 |
| `image` | `<el-upload>` 單圖上傳 | 圖片上傳 |
| `file` | `<el-upload>` 單檔案 | 檔案上傳 |
| `code` | `<el-input type="textarea">` | 程式碼片段 |
| `json` | `<jsoneditor>` 樹/程式碼檢視 | 結構化 JSON |
| `json-custom` | 巢狀 `<FormAdmin>` 子表單 | 子物件修改 |
| `array` | `<el-select multiple>` 或巢狀表單 | 陣列/清單值 |
| `RelationToOne` | `<el-select>` 遠端搜尋 | 多對一 / 一對一 |
| `RelationToMany` | `<el-select multiple>` | 多對多 / 一對多 |
| `transfer` | `<el-transfer>` 穿梭框 | 雙欄選擇 |

**類型解析優先級**：`field.type` → API 元資料類型 → `input`。

### 5.2 標籤與國際化

```js
// 顯式標籤（優先級最高）
{ property: 'username', label: '使用者名稱' }

// 使用 field_options（同樣有效）
{ property: 'email', field_options: { label: t('Email') } }

// 未設定標籤 → 從後端元資料翻譯欄位自動解析
{ property: 'phone' }  // 標籤來自 structure[phone]['translation']
```

### 5.3 必填與驗證

```js
// 覆蓋後端 nullable
{ property: 'email', required: true }      // 強制必填
{ property: 'notes', required: false }     // 強制可選

// 未設定 → 跟隨 structure[property].metadata.nullable
```

### 5.4 修改模式下的唯讀

```js
{ property: 'author', editable: false }
```

欄位仍顯示在表單中，但為唯讀。適用於系統設定的欄位（作者、建立時間等）。

### 5.5 分頁

```js
form: {
  fields: [
    'title',
    'enabled',
    { property: 'body', tab: '內容' },
    { property: 'author', tab: '元資料' },
    { property: 'category', tab: '元資料' }
  ]
}
```

沒有 `tab` 的欄位放入第一個分頁（預設"預設"）。每個唯一的 `tab` 值建立一個 `<el-tab-pane>`。

### 5.6 預設值

```js
{ property: 'status', default_value: 'active' }
{ property: 'enabled', default_value: true }
{ property: 'currency', default_value: 'CNY' }
```

僅在**新增模式**（`id === 0`）下生效。修改模式下表單會取得現有記錄的值。

### 5.7 說明文字

```js
{
  property: 'slug',
  help: '用於 URL。只允許字母、數字和連字元。'
}
```

在欄位輸入框下方繪製灰色說明文字。

### 5.8 透傳 Props 和事件

```js
{
  property: 'email',
  field_options: { labelWidth: '200px' },   // 傳遞給 <el-form-item>
  field_events: { click: handleClick },     // <el-form-item> 上的事件
  type_options: { maxlength: 50, disabled: false }, // 傳遞給外掛
  type_events: { blur: onBlur }             // 外掛上的事件
}
```

---

## 6. 關聯欄位

### 6.1 多對一 / 一對一

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

外掛繪製一個帶遠端搜尋的 `<el-select>`。選項透過 `EntityManage.list()` 從目標實體取得。

對於基於使用者輸入的動態篩選，設定 `remote: true`：

```js
{
  property: 'product',
  type_options: {
    entity_name: 'Product',    // 覆蓋目標實體（否則從元資料取得）
    remote: true               // 啟用使用 :value 佔位符的關鍵字搜尋
  },
  relation_filter: {
    '@filter': 'entity.getName() matches ":value"'
  }
}
```

### 6.2 多對多 / 一對多

```js
{
  property: 'tags',
  type: 'RelationToMany',
  relation_filter: {
    '@order': 'entity.name|ASC'
  }
}
```

繪製 `<el-select multiple>`。選項取得方式與 `RelationToOne` 相同。

### 6.3 帶靜態選項的下拉選單

對於非關聯欄位但需要下拉選單時：

```js
{
  property: 'status',
  type: 'select',
  default_value: 'active',
  type_options: {
    options: [
      { value: 'active', label: '啟用' },
      { value: 'inactive', label: '停用' }
    ]
  }
}
```

---

## 7. 表單中的自訂組件

### 7.1 內聯組件物件

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

組件接收 props：`data`（目前欄位值）、`form`（完整表單資料）、`property`、`fields` 和 `field`（`FieldOption` 本身）。

### 7.2 JSX 設定組件（如 Product.jsx 中的 SpecificationManager）

```js
import ListAdmin from '@/components/EasyAdmin/ListAdmin'
import FormAdmin from '@/components/EasyAdmin/FormAdmin'

const SpecificationManager = {
  components: { ListAdmin, FormAdmin },
  props: ['form', 'data', 'property', 'fields', 'field'],
  // ... 包含 render() 返回 JSX 的完整組件
}

form: {
  fields: [
    // ...
    {
      property: 'specifications',
      tab: '規格',
      component: SpecificationManager
    }
  ]
}
```

組件可以嵌入額外的 CRUD 面板、彈窗和巢狀表單。它透過走訪 `$parent` 找到 `FormAdmin` 實例以取得 `productId` 等資訊。

---

## 8. ListConfig — 表格與篩選

```typescript
interface ListConfig {
  list_display?: FieldConfig[]            // 欄定義
  list_filter?: Record<string, any>       // 搜尋篩選
  query?: Record<string, any>             // 預設查詢參數
  disabled_actions?: string[]             // 隱藏操作
  data_processor?: (context) => void      // 自訂資料取得
  actions?: ActionButton[]                // 自訂操作按鈕
  export?: { query?, label? }             // CSV 匯出
}
```

### 8.1 `list_display` — 欄定義

與 `form.fields` 相同的 `FieldConfig` 格式。每個條目繪製表格中的一欄：

```js
list_display: [
  'id',                                                      // 純欄位
  { property: 'cover', type: 'image' },                      // 圖片欄
  'title',                                                    // 文字
  {                                                           // 自訂組件
    property: 'status',
    component: {
      props: ['data'],
      render() {
        const color = this.data === 'active' ? 'success' : 'info'
        return <el-tag type={color}>{this.data}</el-tag>
      }
    }
  },
  { property: 'roles', type: 'array' },                      // 標籤陣列
  'createdAt'                                                 // 日期時間
]
```

可用的清單外掛類型：`boolean`、`date`、`datetime`、`image`、`array`、`RelationToOne`、`RelationToMany`、`editable-plain`（字串/數字可編輯）、`plain-text`（回退）。

### 8.2 `list_filter` — 三種風格

#### A. 簡介風格（自動推斷）

```js
list_filter: {
  name: '產品名稱',              // 字串 → type:'input'
  status: {                      // 物件 → type:'select'
    __label: '狀態',             // 篩選標籤
    __default: 'active',          // 預設值
    active: '啟用',               // 選項鍵: 顯示標籤
    inactive: '停用'
  }
}
```

#### B. 完整風格（顯式控制）

```js
list_filter: {
  'category.id': {
    expression: "entity.getCategory().getId() == ':value'",
    label: '分類',
    type: 'select',               // 'select' | 'input' | 'datetime' | 'date' | 'time' | 'boolean'
    data: [
      { value: 1, label: '書籍' },
      { value: 2, label: '食品' }
    ],
    default: 1
  }
}
```

#### C. 非同步風格

```js
list_filter: {
  'category.id': () => axios
    .get('/api/v1/manage/categories')
    .then(res => ({
      __label: '分類',
      __default: res.data[0]?.id,
      ...Object.fromEntries(res.data.map(v => [v.id, v.name]))
    }))
}
```

Promise 的結果物件：`__label` → 篩選標籤，`__default` → 預設值，其餘鍵 → 選項。

### 8.3 `query` — 預設查詢參數

```js
// 共用 helper（見 helpers.js）：
export const orderByIdDesc = { '@order': 'entity.id|DESC' }

list: {
  query: orderByIdDesc
  // 或內聯寫法：
  query: { '@order': 'entity.sort|ASC, entity.id|DESC' }
}
```

支援的參數：`@filter`、`@order`、`@select`、`@groupBy`、`page`、`limit` 等。

### 8.4 `disabled_actions` — 隱藏預設操作

| 操作 ID | 隱藏內容 |
|---|---|
| `new` | "新增"按鈕 |
| `detail` | 每行的"詳情"按鈕 |
| `edit` | 每行的"修改"按鈕 |
| `delete` | 每行的"刪除"按鈕 |
| `batch_edit` | "批量修改"工具列按鈕 |
| `batch_delete` | "批量刪除"工具列按鈕和選擇欄 |
| `lines` | 整個"操作"欄 |
| `pager` | 分頁欄 |
| `export` | "匯出"按鈕 |

```js
list: {
  disabled_actions: ['new', 'delete']   // 唯讀表格
}
```

### 8.5 `data_processor` — 自訂資料取得

覆蓋預設的 `em.structure()` + `em.list()` 流程：

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

### 8.6 `actions` — 自訂操作按鈕

```typescript
interface ActionButton {
  name: string                    // 唯一名稱
  position: 'top' | 'list'       // 頂部工具列 或 每行操作欄
  component: VueComponent         // Vue 組件或 JSX 繪製函式
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

### 8.7 `export` — CSV 匯出

```js
list: {
  export: {
    query: { '@select': 'entity.title, entity.createdAt' },
    label: {
      title: '標題',
      createdAt: '建立日期'
    }
  }
}
```

- `query`：附加到預設查詢 + 目前篩選的額外參數。使用 `@select` 限制匯出欄位。
- `label`：欄頭對應。省略則使用屬性名作為表頭。

---

## 9. DetailConfig — 唯讀詳情頁

```typescript
interface DetailConfig {
  detail_display?: FieldConfig[] | '__all__'    // 要顯示的欄位
  fields?: FieldConfig[] | '__all__'             // detail_display 的別名
  disabled_actions?: string[]                    // 隱藏操作：'edit'
}
```

### 9.1 欄位回退鏈

```
detail.detail_display  →  list.list_display  →  form.fields  →  所有 API 欄位
```

### 9.2 詳情頁獨有功能

```js
detail: {
  detail_display: [
    'id',
    'title',
    'category',
    { property: 'metadata', type: 'json', full_width: true },  // 全寬行
    { property: 'items', full_width: true },                    // 關聯
    'createdAt'
  ]
}
```

`full_width: true` 讓欄位佔據整行寬度。適用於 JSON 物件、多行文字和關聯清單。

### 9.3 詳情外掛

詳情檢視的自訂外掛放在 `plugins/detail/` 中。現有的：

| 外掛 | 類型 | 行為 |
|------|------|------|
| `image.vue` | image | 帶邊框和陰影的全寬預覽 |
| `json.vue` | json | 帶 2 空格縮排的 `<pre>`，可折疊，語法高亮 |

新增詳情外掛：建立 `plugins/detail/{type}.vue`，帶有 props `value`、`field`、`scope`、`em`、`struct`。透過 `import.meta.glob` 自動發現。

---

## 10. 路由設定 — 側邊欄與導航

檔案：`src/configs/routes.js`

```js
import { r } from '@/router/generator'
import { t } from '@/i18n'
import Layout from '@/layout'

export default [
  {
    path: '/content',
    name: 'ContentManage',                                  // 唯一路由名稱
    component: Layout,                                      // 始終為 Layout
    meta: {
      title: t('Content Management'),                       // 側邊欄選單文字
      icon: 'el-icon-notebook',                              // Element Plus 圖示
      roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']             // 存取控制
    },
    children: [
      ...r('Content', t('Content')),                         // 實體路由
      ...r('Page', t('Page')),
      ...r('Comment', t('Comment')),
    ]
  }
]
```

### 10.1 `r(entityName, title)` 產生器

```js
r('Product', 'Product')
```

產生：
- `/{kebab-name}/list` — 清單頁
- `/{kebab-name}/create` — 新增頁
- `/{kebab-name}/:id/update` — 修改頁
- `/{kebab-name}/:id/detail` — 詳情頁

實體名稱轉 URL 區段：`inflect.dasherize(inflect.underscore(entityName))`。

| 實體名稱 | URL 區段 |
|---|---|
| Product | product |
| WalletTransaction | wallet-transaction |
| OrderItem | order-item |

### 10.2 `g(entityName, title, meta?, component?)` 產生器

`r()` 的替代方案。用於自訂頁面組件而非共用 CRUD 檢視。

### 10.3 `meta` 欄位

| 欄位 | 類型 | 描述 |
|---|---|---|
| `title` | string | 側邊欄選單文字 |
| `icon` | string | Element Plus 圖示類別（如 `el-icon-goods`） |
| `roles` | string[] | 存取控制的允許角色 |
| `hidden` | boolean | 在側邊欄中隱藏（仍可透過 URL 存取） |
| `noCache` | boolean | 停用 keep-alive 快取 |
| `affix` | boolean | 固定分頁 |

---

## 11. 完整真實範例

### 11.1 簡單 CMS 內容

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

### 11.2 帶 JSX 自訂組件的產品

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
        // 用於巢狀規格的自訂內聯組件
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

### 11.3 訂單 — 大量篩選 + 全寬詳情

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

## 12. 快速參考表

### 12.1 所有 `type` 值

| 分類 | 類型 |
|---|---|
| 文字 | `input`、`text`、`textarea`、`code` |
| 數字 | `integer` |
| 布林 | `boolean` |
| 日期/時間 | `date`、`datetime` |
| 媒體 | `image`、`file` |
| 結構化 | `json`、`json-custom`、`array` |
| 關聯 | `RelationToOne`、`RelationToMany` |
| 選擇 | `select`、`transfer` |

### 12.2 所有 `disabled_actions` 值

| 值 | 效果 |
|---|---|
| `new` | 隱藏"新增"按鈕 |
| `detail` | 隱藏每行"詳情"按鈕 |
| `edit` | 隱藏每行"修改"按鈕 |
| `delete` | 隱藏每行"刪除"按鈕 |
| `batch_edit` | 隱藏"批量修改"按鈕 |
| `batch_delete` | 隱藏"批量刪除"按鈕 + 選擇欄 |
| `lines` | 隱藏整個操作欄 |
| `pager` | 隱藏分頁欄 |
| `export` | 隱藏"匯出"按鈕 |

### 12.3 篩選類型

| 類型 | 繪製 |
|---|---|
| `select` | `<el-select>` 下拉選單 |
| `input` | 帶搜尋圖示的 `<el-input>` |
| `boolean` | `<el-switch>` |
| `datetime` | `<el-date-picker type="datetime">` |
| `date` | `<el-date-picker type="date">` |
| `time` | `<el-date-picker type="time">` |

### 12.4 詳情頁額外屬性

| 屬性 | 類型 | 描述 |
|---|---|---|
| `full_width` | boolean | 佔據整行寬度 |
| `type` | string | 強制指定繪製外掛（如 `json`、`image`） |
| `label` | string | 覆蓋顯示標籤 |

---

## 13. 常見模式

### 13.1 共用輔助函式（`helpers.js`）

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

### 13.2 API 路徑構建

```js
import { API_PREFIX, apiPath } from '@/api/prefix'

apiPath(API_PREFIX, 'manage/categories')
// → "/api/v1/manage/categories"
```

### 13.3 帶查詢構建的自訂資料取得

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
      context.filter,     // 從目前篩選選項構建
      context.pager,      // { page, limit }
      context.sort        // 欄排序狀態
    )).then(res => {
      context.list = res.data
      context.paginator = res.paginator
      context.loading = false
    })
  }
}
```

### 13.4 透過路由進行存取控制

```js
meta: {
  title: t('System Options'),
  icon: 'el-icon-setting',
  roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']   // 僅這些角色可存取
}
```

權限在 `src/permission.js`（`router.beforeEach`）中檢查。沒有所需角色的使用者無法存取該部分。

### 13.5 批量操作檢查清單

1. 在 `form.batch_edit.fields` 中新增要批處理的欄位。
2. 當 `delete` + `batch_delete` 未被停用時，選擇欄會自動出現。
3. "批量刪除"對每條選中記錄呼叫 `DELETE /{plural}/{id}`，並報告部分失敗。
4. "批量修改"開啟彈窗。使用者選擇欄位 → 填寫值 → `POST /{plural}/batch-update?@basis=id&@mode=update`。

---

## 14. 國際化注意事項

- 所有實體名稱應作為 i18n 鍵註冊在 `en.js`、`zh.js`、`zh-Hant.js`、`ja.js` 中。
- 路由標題使用 `import { t } from '@/i18n'` 產生側邊欄標籤。
- 欄位標籤如未顯式設定，將自動從後端元資料翻譯中取得。
- 範本中使用 `$t('key')`；指令碼/設定中使用 `t('key')`；切勿混用。
