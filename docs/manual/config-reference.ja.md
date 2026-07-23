# EasyAdmin 設定リファレンス

> EasyAdmin エンティティ設定完全ガイド — 入門から応用まで。  
> 更新日：2026-07-23

---

## 1. クイックスタート — Hello World

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

次に `src/configs/routes.js` に一行追加します：

```js
children: [
  ...r('Article', '記事'),
]
```

以上です。一覧、作成、編集、削除機能を備えた完全な CRUD が利用可能になります。

---

## 2. 設定ファイル構成

### 2.1 ディレクトリレイアウト

```
src/configs/
├── index.js               # 集約エクスポート：{ routes, entities }
├── routes.js              # メニュー/サイドバー → ルート定義
├── entities.js            # 自動ローダー（import.meta.glob）
├── helpers.js             # 共有定数（orderByIdDesc など）
└── collections/           # エンティティ定義 — バンドルごとに1ファイル
    ├── common/            # Category, Tag, Content, Comment など
    ├── trade/             # Product, Order, OrderItem, Specification
    ├── identity/          # User, Profile
    ├── wallet/            # Wallet, WalletTransaction
    ├── promotion/         # Promotion, PromotionTemplate
    ├── payment/           # Invoice
    └── wechat/            # WechatUser
```

### 2.2 ファイル命名

```
src/configs/collections/{bundle}/{EntityName}.js   # 純粋な設定ファイル
src/configs/collections/{bundle}/{EntityName}.jsx  # カスタムコンポーネント付き設定
```

自動ローダー（`entities.js`）は `collections/` 以下のすべての `.js` / `.jsx` ファイルを収集します。各ファイルはエンティティ名をキーとするトップレベルオブジェクトをエクスポートします。

### 2.3 エンティティ初期化順序

`entities.js` はファイル深度に応じて優先順位を決定します：
- **サブディレクトリ内のファイル**（深度 2、例：`trade/Product.js`）はコレクションとして扱われ、`Object.assign` でマージされます。
- **深度 3 以上のファイル** は独立したエンティティとして扱われます。
- **`helpers.js` は自動ロード対象外**（エンティティ設定をエクスポートしません）。

---

## 3. EntityConfig（エンティティ設定） — トップレベル構造

```typescript
interface EntityConfig {
  entity?: string | {
    name: string           // エンティティクラス名（必須）
    prefix?: string        // API プレフィックス、デフォルト "/api/v1/manage"
    plural?: string        // 複数形 URL セグメント、デフォルトは自動推論
  }

  form?: FormConfig        // 作成 / 編集フォーム
  list?: ListConfig        // 一覧 / テーブルビュー
  detail?: DetailConfig    // 詳細 / 読み取り専用ビュー
}
```

### 3.1 `entity` — API リゾルバー

| 形式 | 例 | 用途 |
|------|------|------|
| 文字列 | `entity: 'Product'` | 設定キー名と同一；`/api/v1/manage/products` を自動推論 |
| オブジェクト | `entity: { name: 'WalletTransaction', plural: 'transactions' }` | カスタム複数形またはプレフィックス |
| 省略 | （設定キー名にフォールバック） | `EntityName === エンティティクラス名` の場合 |

#### ネストされた API リソース

管理 API が親プレフィックス配下にある場合：

```js
// Product.jsx の SpecificationManager コンポーネント内で使用
{
  name: 'Specification',
  prefix: `/api/v1/manage/products/${productId}`,
  plural: 'specifications'
}
```

`productId` は実行時に親コンポーネントから取得されます。エンティティファイル自体はフィールド定義のみを保持します。

---

## 4. FormConfig（フォーム設定） — 作成と編集フォーム

```typescript
interface FormConfig {
  fields: FieldConfig[] | '__all__'     // レンダリングするフィールド
  batch_edit?: {                        // 一括編集ダイアログフィールド
    fields: FieldConfig[]
  }
}
```

### 4.1 `fields` — 3 つの記法

#### A. シンプルな文字列配列

```js
form: {
  fields: ['title', 'body', 'enabled']
}
```

各要素はプロパティ名です。プラグインタイプはバックエンドのメタデータから自動推論されます（例：`type: string → input`、`type: boolean → checkbox` など）。

#### B. 混合配列（最も一般的）

```js
form: {
  fields: [
    'title',                                          // シンプルな文字列
    { property: 'cover', type: 'image' },             // 詳細設定
    { property: 'body', type: 'text', tab: '内容' },   // タブ内のリッチテキスト
    { property: 'category', required: false },         // 任意のリレーション
    { property: 'enabled', default_value: true }       // 作成モードのデフォルト値
  ]
}
```

#### C. `'__all__'` — API の全フィールドを使用

```js
form: {
  fields: '__all__'
}
```

バックエンドのエンティティ構造内の全フィールドをレンダリングします。フィールド順序は API が決定します。

### 4.2 `batch_edit` — 一括編集ダイアログ

```js
form: {
  fields: ['title', 'category', 'tags', 'enabled'],
  batch_edit: {
    fields: ['category', 'tags']
  }
}
```

複数レコードの一括編集時、`category` と `tags` のみを表示します。各フィールドにはチェックボックスが付き、ユーザーは更新するフィールドを選択します。リクエストは選択されたフィールドのみを `POST /{plural}/batch-update?@basis=id&@mode=update` に送信します。

---

## 5. FieldOption（フィールドオプション） — 各フィールドの設定

```typescript
interface FieldOption {
  property: string                      // エンティティプロパティ名（必須）
  label?: string                        // 表示ラベルを上書き
  type?: string                         // フィールドプラグインタイプを強制指定
  required?: boolean                    // バックエンドの nullable を上書き
  editable?: boolean                    // 編集モードで読み取り専用
  tab?: string                          // 指定タブにグループ化
  default_value?: unknown               // 作成モードでの事前入力値
  field_options?: Record<string, any>   // <el-form-item> に渡す props
  field_events?: Record<string, any>    // <el-form-item> に渡すイベント
  type_options?: Record<string, any>    // フィールドプラグインに渡す props
  type_events?: Record<string, any>     // フィールドプラグインに渡すイベント
  relation_filter?: {                   // リレーションフィールドのみ
    '@filter'?: string                  // DQL 式
    '@order'?: string                   // ソート
  }
  creationUrl?: string                  // 関連エンティティ作成用リンク
  component?: object | Function         // カスタム Vue コンポーネントまたは JSX
  help?: string                         // フィールド下部のヘルプテキスト
}
```

### 5.1 利用可能なフィールドタイプ（`type`）

| タイプ文字列 | レンダリングコンポーネント | 典型的な用途 |
|---|---|---|
| `input` | `<el-input>` | 短いテキスト、文字列（デフォルト） |
| `text` | `<Tinymce>` リッチテキストエディタ | 長い HTML コンテンツ |
| `textarea` | `<el-input type="textarea">` | 複数行テキスト |
| `select` | `<el-select>` 静的オプション | 定義済みオプション |
| `boolean` | `<el-checkbox>` | 真偽値フラグ |
| `integer` | `<el-input-number>` | 整数 |
| `date` | `<el-date-picker>` (yyyy-MM-dd) | 日付 |
| `datetime` | `<el-date-picker>` (yyyy-MM-dd HH:mm:ss) | 日付 + 時刻 |
| `image` | `<el-upload>` 単一画像アップロード | 画像アップロード |
| `file` | `<el-upload>` 単一ファイル | ファイルアップロード |
| `code` | CodeMirror 6 エディタ | 行番号とシンタックスハイライト付きのコードスニペット |
| `json` | `<jsoneditor>` ツリー/コードビュー | 構造化 JSON |
| `json-custom` | ネストされた `<FormAdmin>` サブフォーム | 子オブジェクト編集 |
| `array` | `<el-select multiple>` またはネストフォーム | 配列/リスト値 |
| `RelationToOne` | `<el-select>` リモート検索 | 多対一 / 一対一 |
| `RelationToMany` | `<el-select multiple>` | 多対多 / 一対多 |
| `transfer` | `<el-transfer>` 二面選択 | 二面選択 |

**タイプ解決優先順位**：`field.type` → API メタデータタイプ → `input`。

#### CodeMirror 6 オプション

`code` フィールド型は CodeMirror 6 を使用し、デフォルトでフォーム内の利用可能な幅をすべて使用します。

```js
{
  property: 'dsl',
  type: 'code',
  type_options: {
    language: 'javascript',  // javascript | typescript | json | html | css | sql
    height: 360,             // ピクセル。デフォルト: 280px
    readonly: false,
    disabled: false
  }
}
```

行番号、シンタックスハイライト、括弧の対応付け、アクティブ行のハイライト、元に戻す/やり直し、Tab インデントを備えています。

### 5.2 ラベルと国際化

```js
// 明示的ラベル（優先順位最高）
{ property: 'username', label: 'ユーザー名' }

// field_options を使用（同様に有効）
{ property: 'email', field_options: { label: t('Email') } }

// ラベル未設定 → バックエンドメタデータの翻訳フィールドから自動解決
{ property: 'phone' }  // ラベルは structure[phone]['translation'] から
```

### 5.3 必須とバリデーション

```js
// バックエンドの nullable を上書き
{ property: 'email', required: true }      // 必須に強制
{ property: 'notes', required: false }     // 任意に強制

// 未設定 → structure[property].metadata.nullable に従う
```

### 5.4 編集モードでの読み取り専用

```js
{ property: 'author', editable: false }
```

フィールドはフォームに表示されますが読み取り専用です。システム設定フィールド（作成者、作成日時など）に適しています。

### 5.5 タブ

```js
form: {
  fields: [
    'title',
    'enabled',
    { property: 'body', tab: '内容' },
    { property: 'author', tab: 'メタデータ' },
    { property: 'category', tab: 'メタデータ' }
  ]
}
```

`tab` がないフィールドは最初のタブ（デフォルト"デフォルト"）に配置されます。一意の `tab` 値ごとに `<el-tab-pane>` が作成されます。

### 5.6 デフォルト値

```js
{ property: 'status', default_value: 'active' }
{ property: 'enabled', default_value: true }
{ property: 'currency', default_value: 'CNY' }
```

**作成モード**（`id === 0`）でのみ有効です。編集モードではフォームは既存レコードの値を取得します。

### 5.7 ヘルプテキスト

```js
{
  property: 'slug',
  help: 'URL に使用。英数字とハイフンのみ許可。'
}
```

フィールド入力欄の下部にグレーのヘルプテキストを表示します。

### 5.8 透過 Props とイベント

```js
{
  property: 'email',
  field_options: { labelWidth: '200px' },   // <el-form-item> に渡す
  field_events: { click: handleClick },     // <el-form-item> 上のイベント
  type_options: { maxlength: 50, disabled: false }, // プラグインに渡す
  type_events: { blur: onBlur }             // プラグイン上のイベント
}
```

---

## 6. リレーションフィールド

### 6.1 多対一 / 一対一

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

プラグインはリモート検索付きの `<el-select>` をレンダリングします。オプションは `EntityManage.list()` を通じて対象エンティティから取得されます。

ユーザー入力に基づく動的フィルタリングには、`remote: true` を設定します：

```js
{
  property: 'product',
  type_options: {
    entity_name: 'Product',    // 対象エンティティを上書き（未指定時はメタデータから）
    remote: true               // :value プレースホルダーを使用したキーワード検索を有効化
  },
  relation_filter: {
    '@filter': 'entity.getName() matches ":value"'
  }
}
```

### 6.2 多対多 / 一対多

```js
{
  property: 'tags',
  type: 'RelationToMany',
  relation_filter: {
    '@order': 'entity.name|ASC'
  }
}
```

`<el-select multiple>` をレンダリングします。オプション取得方法は `RelationToOne` と同様です。

### 6.3 静的オプション付きドロップダウン

リレーションフィールドではないがドロップダウンが必要な場合：

```js
{
  property: 'status',
  type: 'select',
  default_value: 'active',
  type_options: {
    options: [
      { value: 'active', label: '有効' },
      { value: 'inactive', label: '無効' }
    ]
  }
}
```

---

## 7. フォーム内のカスタムコンポーネント

### 7.1 インラインコンポーネントオブジェクト

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

コンポーネントが受け取る props：`data`（現在のフィールド値）、`form`（完全なフォームデータ）、`property`、`fields`、`field`（`FieldOption` 自体）。

### 7.2 JSX 設定コンポーネント（Product.jsx の SpecificationManager など）

```js
import ListAdmin from '@/components/EasyAdmin/ListAdmin'
import FormAdmin from '@/components/EasyAdmin/FormAdmin'

const SpecificationManager = {
  components: { ListAdmin, FormAdmin },
  props: ['form', 'data', 'property', 'fields', 'field'],
  // ... render() が JSX を返す完全なコンポーネント
}

form: {
  fields: [
    // ...
    {
      property: 'specifications',
      tab: '仕様',
      component: SpecificationManager
    }
  ]
}
```

コンポーネントは追加の CRUD パネル、ダイアログ、ネストされたフォームを埋め込むことができます。`$parent` を辿って `FormAdmin` インスタンスを見つけ、`productId` などの情報を取得します。

---

## 8. ListConfig（一覧設定） — テーブルとフィルター

```typescript
interface ListConfig {
  list_display?: FieldConfig[]            // 列定義
  list_filter?: Record<string, any>       // 検索フィルター
  query?: Record<string, any>             // デフォルトクエリパラメータ
  disabled_actions?: string[]             // 非表示アクション
  data_processor?: (context) => void      // カスタムデータ取得
  actions?: ActionButton[]                // カスタムアクションボタン
  export?: { query?, label? }             // CSV エクスポート
}
```

### 8.1 `list_display`（列定義） — 列定義

`form.fields` と同じ `FieldConfig` 形式です。各エントリがテーブルの 1 列をレンダリングします：

```js
list_display: [
  'id',                                                      // 純粋なフィールド
  { property: 'cover', type: 'image' },                      // 画像列
  'title',                                                    // テキスト
  {                                                           // カスタムコンポーネント
    property: 'status',
    component: {
      props: ['data'],
      render() {
        const color = this.data === 'active' ? 'success' : 'info'
        return <el-tag type={color}>{this.data}</el-tag>
      }
    }
  },
  { property: 'roles', type: 'array' },                      // タグ配列
  'createdAt'                                                 // 日付時刻
]
```

利用可能な一覧プラグインタイプ：`boolean`、`date`、`datetime`、`image`、`array`、`RelationToOne`、`RelationToMany`、`editable-plain`（文字列/数値の編集可能）、`plain-text`（フォールバック）。

### 8.2 `list_filter`（検索フィルター） — 3 つのスタイル

#### A. 簡易スタイル（自動推論）

```js
list_filter: {
  name: '商品名',                // 文字列 → type:'input'
  status: {                      // オブジェクト → type:'select'
    __label: 'ステータス',       // フィルターラベル
    __default: 'active',          // デフォルト値
    active: '有効',               // オプションキー: 表示ラベル
    inactive: '無効'
  }
}
```

#### B. 完全スタイル（明示的制御）

```js
list_filter: {
  'category.id': {
    expression: "entity.getCategory().getId() == ':value'",
    label: 'カテゴリ',
    type: 'select',               // 'select' | 'input' | 'datetime' | 'date' | 'time' | 'boolean'
    data: [
      { value: 1, label: '書籍' },
      { value: 2, label: '食品' }
    ],
    default: 1
  }
}
```

#### C. 非同期スタイル

```js
list_filter: {
  'category.id': () => axios
    .get('/api/v1/manage/categories')
    .then(res => ({
      __label: 'カテゴリ',
      __default: res.data[0]?.id,
      ...Object.fromEntries(res.data.map(v => [v.id, v.name]))
    }))
}
```

Promise の結果オブジェクト：`__label` → フィルターラベル、`__default` → デフォルト値、その他のキー → オプション。

### 8.3 `query` — デフォルトクエリパラメータ

```js
// 共有ヘルパー（helpers.js 参照）：
export const orderByIdDesc = { '@order': 'entity.id|DESC' }

list: {
  query: orderByIdDesc
  // またはインライン記法：
  query: { '@order': 'entity.sort|ASC, entity.id|DESC' }
}
```

サポートされるパラメータ：`@filter`、`@order`、`@select`、`@groupBy`、`page`、`limit` など。

### 8.4 `disabled_actions`（非表示アクション） — デフォルトアクションの非表示

| アクション ID | 非表示にする内容 |
|---|---|
| `new` | "作成"ボタン |
| `detail` | 各行の"詳細"ボタン |
| `edit` | 各行の"編集"ボタン |
| `delete` | 各行の"削除"ボタン |
| `batch_edit` | "一括編集"ツールバーボタン |
| `batch_delete` | "一括削除"ツールバーボタンと選択列 |
| `lines` | "操作"列全体 |
| `pager` | ページネーション |
| `export` | "エクスポート"ボタン |

```js
list: {
  disabled_actions: ['new', 'delete']   // 読み取り専用テーブル
}
```

### 8.5 `data_processor`（カスタム取得） — カスタムデータ取得

デフォルトの `em.structure()` + `em.list()` フローを上書きします：

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

### 8.6 `actions`（カスタムボタン） — カスタムアクションボタン

```typescript
interface ActionButton {
  name: string                    // 一意の名前
  position: 'top' | 'list'       // 上部ツールバー または 各行の操作列
  component: VueComponent         // Vue コンポーネントまたは JSX レンダー関数
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
              削除
            </el-button>
          )
        }
      }
    }
  ]
}
```

### 8.7 `export`（エクスポート） — CSV エクスポート

```js
list: {
  export: {
    query: { '@select': 'entity.title, entity.createdAt' },
    label: {
      title: 'タイトル',
      createdAt: '作成日'
    }
  }
}
```

- `query`：デフォルトクエリ + 現在のフィルターに追加される追加パラメータ。`@select` でエクスポートフィールドを制限します。
- `label`：列ヘッダーマッピング。省略時はプロパティ名がヘッダーとして使用されます。

---

## 9. DetailConfig（詳細設定） — 読み取り専用詳細ページ

```typescript
interface DetailConfig {
  detail_display?: FieldConfig[] | '__all__'    // 表示するフィールド
  fields?: FieldConfig[] | '__all__'             // detail_display の別名
  disabled_actions?: string[]                    // 非表示アクション：'edit'
}
```

### 9.1 フィールドフォールバックチェーン

```
detail.detail_display  →  list.list_display  →  form.fields  →  全 API フィールド
```

### 9.2 詳細ページ固有の機能

```js
detail: {
  detail_display: [
    'id',
    'title',
    'category',
    { property: 'metadata', type: 'json', full_width: true },  // 全幅行
    { property: 'items', full_width: true },                    // リレーション
    'createdAt'
  ]
}
```

`full_width: true` はフィールドを行全体に表示します。JSON オブジェクト、リッチテキスト、リレーションリストに適しています。

### 9.3 詳細プラグイン

詳細ビュー用のカスタムプラグインは `plugins/detail/` に配置します。既存のもの：

| プラグイン | タイプ | 動作 |
|------|------|------|
| `image.vue` | image | 枠線と影付きの全幅プレビュー |
| `json.vue` | json | 2 スペースインデントの `<pre>`、折りたたみ可能、シンタックスハイライト |

新しい詳細プラグインの追加：props `value`、`field`、`scope`、`em`、`struct` を持つ `plugins/detail/{type}.vue` を作成します。`import.meta.glob` で自動検出されます。

---

## 10. ルート設定 — サイドバーとナビゲーション

ファイル：`src/configs/routes.js`

```js
import { r } from '@/router/generator'
import { t } from '@/i18n'
import Layout from '@/layout'

export default [
  {
    path: '/content',
    name: 'ContentManage',                                  // 一意のルート名
    component: Layout,                                      // 常に Layout
    meta: {
      title: t('Content Management'),                       // サイドバーメニューテキスト
      icon: 'el-icon-notebook',                              // Element Plus アイコン
      roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']             // アクセス制御
    },
    children: [
      ...r('Content', t('Content')),                         // エンティティルート
      ...r('Page', t('Page')),
      ...r('Comment', t('Comment')),
    ]
  }
]
```

### 10.1 `r(entityName, title)` ジェネレーター

```js
r('Product', 'Product')
```

以下を生成します：
- `/{kebab-name}/list` — 一覧ページ
- `/{kebab-name}/create` — 作成ページ
- `/{kebab-name}/:id/update` — 編集ページ
- `/{kebab-name}/:id/detail` — 詳細ページ

エンティティ名から URL セグメントへ：`inflect.dasherize(inflect.underscore(entityName))`。

| エンティティ名 | URL セグメント |
|---|---|
| Product | product |
| WalletTransaction | wallet-transaction |
| OrderItem | order-item |

### 10.2 `g(entityName, title, meta?, component?)` ジェネレーター

`r()` の代替。共有 CRUD ビューではなくカスタムページコンポーネントを使用する場合に使用します。

### 10.3 `meta` フィールド

| フィールド | 型 | 説明 |
|---|---|---|
| `title` | string | サイドバーメニューテキスト |
| `icon` | string | Element Plus アイコンクラス（例：`el-icon-goods`） |
| `roles` | string[] | アクセス制御の許可ロール |
| `hidden` | boolean | サイドバーで非表示（URL からはアクセス可能） |
| `noCache` | boolean | keep-alive キャッシュを無効化 |
| `affix` | boolean | タブを固定 |

---

## 11. 完全な実例

### 11.1 シンプルな CMS コンテンツ

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

### 11.2 JSX カスタムコンポーネント付き商品

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
        // ネストされた仕様用のカスタムインラインコンポーネント
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

### 11.3 注文 — 多数のフィルター + 全幅詳細

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

## 12. クイックリファレンス

### 12.1 すべての `type` 値

| カテゴリ | タイプ |
|---|---|
| テキスト | `input`、`text`、`textarea`、`code` |
| 数値 | `integer` |
| 真偽値 | `boolean` |
| 日付/時刻 | `date`、`datetime` |
| メディア | `image`、`file` |
| 構造化 | `json`、`json-custom`、`array` |
| リレーション | `RelationToOne`、`RelationToMany` |
| 選択 | `select`、`transfer` |

### 12.2 すべての `disabled_actions` 値

| 値 | 効果 |
|---|---|
| `new` | "作成"ボタンを非表示 |
| `detail` | 各行の"詳細"ボタンを非表示 |
| `edit` | 各行の"編集"ボタンを非表示 |
| `delete` | 各行の"削除"ボタンを非表示 |
| `batch_edit` | "一括編集"ボタンを非表示 |
| `batch_delete` | "一括削除"ボタン + 選択列を非表示 |
| `lines` | 操作列全体を非表示 |
| `pager` | ページネーションを非表示 |
| `export` | "エクスポート"ボタンを非表示 |

### 12.3 フィルタータイプ

| タイプ | レンダリング |
|---|---|
| `select` | `<el-select>` ドロップダウン |
| `input` | 検索アイコン付き `<el-input>` |
| `boolean` | `<el-switch>` |
| `datetime` | `<el-date-picker type="datetime">` |
| `date` | `<el-date-picker type="date">` |
| `time` | `<el-date-picker type="time">` |

### 12.4 詳細ページの追加プロパティ

| プロパティ | 型 | 説明 |
|---|---|---|
| `full_width` | boolean | 行全体に表示 |
| `type` | string | レンダリングプラグインを強制指定（例：`json`、`image`） |
| `label` | string | 表示ラベルを上書き |

---

## 13. よくあるパターン

### 13.1 共有ヘルパー関数（`helpers.js`）

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

### 13.2 API パス構築

```js
import { API_PREFIX, apiPath } from '@/api/prefix'

apiPath(API_PREFIX, 'manage/categories')
// → "/api/v1/manage/categories"
```

### 13.3 クエリ構築付きカスタムデータ取得

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
      context.filter,     // 現在のフィルターオプションから構築
      context.pager,      // { page, limit }
      context.sort        // 列ソート状態
    )).then(res => {
      context.list = res.data
      context.paginator = res.paginator
      context.loading = false
    })
  }
}
```

### 13.4 ルートによるアクセス制御

```js
meta: {
  title: t('System Options'),
  icon: 'el-icon-setting',
  roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']   // これらのロールのみアクセス可能
}
```

権限は `src/permission.js`（`router.beforeEach`）でチェックされます。必要なロールを持たないユーザーはそのセクションにアクセスできません。

### 13.5 一括操作チェックリスト

1. `form.batch_edit.fields` に一括処理対象のフィールドを追加します。
2. `delete` + `batch_delete` が無効化されていない場合、選択列が自動的に表示されます。
3. "一括削除"は選択された各レコードに対して `DELETE /{plural}/{id}` を呼び出し、部分的な失敗を報告します。
4. "一括編集"はダイアログを開きます。ユーザーがフィールドを選択 → 値を入力 → `POST /{plural}/batch-update?@basis=id&@mode=update`。

---

## 14. 国際化に関する注意

- すべてのエンティティ名は `en.js`、`zh.js`、`zh-Hant.js`、`ja.js` に i18n キーとして登録する必要があります。
- ルートタイトルは `import { t } from '@/i18n'` を使用してサイドバーラベルを生成します。
- フィールドラベルが明示的に設定されていない場合、バックエンドのメタデータ翻訳から自動的に取得されます。
- テンプレートでは `$t('key')`、スクリプト/設定では `t('key')` を使用し、混在させないでください。
