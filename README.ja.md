# crud-admin

<p align="center">
  <b>Vue 3、Element Plus、EasyAdmin による設定駆動型管理パネル</b>
  <br><br>
  <img src="https://img.shields.io/badge/vue-3.5-brightgreen?logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/vite-5.x-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/node-%3E%3D14-green?logo=node.js" alt="Node">
  <br><br>
</p>

> English: [README.md](README.md) · 简体中文: [README.zh-cn.md](README.zh-cn.md) · 繁體中文: [README.zh-Hant.md](README.zh-Hant.md)

> バックエンド： [crud-skeleton](https://github.com/immane/crud-skeleton) — Symfony 8.1 API、動的クエリエンジン、モジュラーアーキテクチャ

## 目次

- [機能](#機能)
- [技術スタック](#技術スタック)
- [国際化](#国際化)
- [プロジェクト構成](#プロジェクト構成)
- [はじめに](#はじめに)
- [設定](#設定)
- [EasyAdmin CRUD エンジン](#easyadmin-crud-エンジン)
- [API 統合](#api-統合)
- [ドキュメント](#ドキュメント)
- [テスト](#テスト)
- [デプロイ](#デプロイ)
- [ライセンス](#ライセンス)

## 機能

- **設定駆動型 CRUD エンジン（EasyAdmin）** — 設定でエンティティを宣言するだけで、リスト/フォーム/詳細/ルートを自動生成
- **17 種類以上のプラグ可能なフォームフィールド** — テキスト入力、テキストエリア、セレクト、ブール、数値、日付、画像、ファイル、JSON、リッチテキスト、リレーションピッカー、トランスファーなど
- **フォールバックチェーン付き詳細ビュー** — `detail/` → `list/` → プレーンテキストプラグイン
- **国際化（i18n）** — 英語、簡体字中国語、繁体字中国語、日本語；ブラウザ言語自動検出；ナビゲーションバーの言語切替；`Accept-Language` ヘッダーと `_locale` パラメータを API リクエストに自動注入
- **JWT 認証** — Bearer トークンログイン、自動トークンリフレッシュ、Cookie 永続化、同時リクエストキューイング
- **ロールベースのアクセス制御** — Vuex + Vue Router 4 によるロール別動的ルートフィルタリング
- **エンティティイントロスペクション** — バックエンド `/system/entities` からフィールド型、null 許容、リレーションを自動推論
- **動的フィルタとソート** — 設定駆動の検索 UI からサーバーサイドフィルタ式を生成（`@filter`、`@sort`、`@order`）
- **エンタープライズダッシュボード** — リアルタイムの注文/商品/ユーザー指標、SVG スパークライン、位置情報天気ウィジェット
- **レスポンシブレイアウト** — 折りたたみ可能なサイドバー（SVG アイコン）、パンくずナビゲーション、固定ヘッダーオプション
- **コード分割とビルド最適化** — Vite によるチャンク分割とツリーシェイキング
- **Vitest ユニットテスト** — 38 のコンポーネントおよびユーティリティテスト

<p align="center">
  <img src="docs/images/dashboard-sample.jpg" alt="Dashboard" width="32%" />
  <img src="docs/images/list-sample.jpg" alt="List" width="32%" />
  <img src="docs/images/detail-sample.jpg" alt="Detail" width="32%" />
</p>

## 技術スタック

| コンポーネント | 技術 |
|-----------|-----------|
| フレームワーク | Vue 3.5 |
| UI ライブラリ | Element Plus 2.9 |
| 状態管理 | Vuex 4 |
| ルーティング | Vue Router 4 |
| HTTP | Axios |
| ビルド | Vite 5 |
| CSS | SCSS (Dart Sass) |
| アイコン | @element-plus/icons-vue + SVG スプライト |
| テスト | Vitest 2.1 |
| 型 | TypeScript 6.0 |
| バックエンド | [crud-skeleton](https://github.com/immane/crud-skeleton) (Symfony 8.1) |

## 国際化

初回ロード時にブラウザ言語を検出し、`localStorage` で選択を永続化します。ナビゲーションバーのドロップダウンからいつでも言語を切り替えられます——切り替え時にエンティティキャッシュをクリアし、ページをリロードします。

| 言語 | コード | Element Plus | API ヘッダー |
|--------|------|-------------|------------|
| English（デフォルト） | `en` | en | `Accept-Language: en`, `_locale=en` |
| 中文 (简体) | `zh` | zh-cn | `Accept-Language: zh`, `_locale=zh` |
| 中文 (繁體) | `zh-Hant` | zh-tw | `Accept-Language: zh-Hant`, `_locale=zh-Hant` |
| 日本語 | `ja` | ja | `Accept-Language: ja`, `_locale=ja` |

翻訳キーは英語文字列をそのまま使用します（フラット形式）。例：`$t('New / Edit')`。新しい言語を追加するには `src/i18n/{コード}.js` ファイルを作成し、ナビゲーションバーのドロップダウンに項目を追加するだけです。

## プロジェクト構成

```text
.
├── src/
│   ├── main.js                      # エントリ：createApp、プラグインインストール、マウント
│   ├── permission.js                # ナビゲーションガード（認証 + ロールチェック）
│   ├── components/EasyAdmin/        # ⭐ コア CRUD エンジン
│   │   ├── FormAdmin.vue            # 動的フォームビルダー
│   │   ├── ListAdmin.vue            # 動的リスト/テーブルビルダー
│   │   ├── DetailAdmin.vue          # 設定可能なレコード詳細ページ
│   │   ├── SearchFilter.vue         # 動的フィルタ UI
│   │   └── plugins/
│   │       ├── form/                # 17 のフィールド型プラグイン
│   │       ├── list/                # 9 のリストレンダリングプラグイン
│   │       └── detail/              # 2 の詳細専用プラグイン
│   ├── configs/                     # 宣言的エンティティ設定
│   │   ├── routes.js                # メニュー/ルート定義
│   │   ├── entities.js              # 自動ローダー（import.meta.glob）
│   │   └── collections/             # エンティティスキーマ（7 バンドル、22 エンティティ）
│   ├── i18n/                        # ロケールファイル（en, zh, zh-Hant, ja）
│   │   └── index.js                 # i18n プラグイン + ブラウザ言語検出
│   ├── icons/                       # SVG スプライト + レガシーアイコン互換マップ
│   ├── layout/                      # サイドバー + ナビゲーションバー + AppMain
│   ├── router/                      # Vue Router 4 + r()/g() ジェネレータ
│   ├── store/                       # Vuex 4（modules/ を自動ロード）
│   ├── styles/                      # グローバル SCSS（サイドバー、トランジション、オーバーライド）
│   ├── utils/                       # auth.js、entity.ts、request.ts など
│   └── views/                       # ページビュー
│       ├── admin/                   # 汎用 CRUD（list + form + detail）
│       ├── dashboard/               # エンタープライズダッシュボード
│       └── login/                   # ログインページ
├── tests/unit/                      # 38 の Vitest テスト
├── docs/                            # 設計契約 + AI コンテキスト
│   └── ai/context.md                # AI アシスタントリファレンス
├── vite.config.ts                   # Vite 5 + Vue 3 + JSX 設定
├── vitest.config.ts                 # Vitest 設定
├── tsconfig.json
└── package.json
```

## はじめに

### 前提条件

- **Node.js** >= 14.18
- **npm** >= 6.0.0

### 1) クローン

```bash
git clone https://github.com/immane/crud-admin.git
cd crud-admin
```

### 2) インストール

```bash
npm install
```

### 3) 環境設定

開発環境ファイルをコピーして編集：

```bash
cp .env.example .env.development
```

主要変数：

```dotenv
VITE_BASE_API=
VITE_PROXY_TARGET=http://127.0.0.1:8000
VITE_API_PREFIX=/api/v1
VITE_AUTH_API_PREFIX=/api/auth
VITE_SYSTEM_API_PREFIX=/system
```

### 4) 実行

```bash
npm run dev          # 開発（localhost:9528、HMR）
npm run build        # 本番ビルド
npm run lint         # ESLint
npm run type-check   # TypeScript チェック
npm run test         # Vitest
```

## 設定

### 環境ファイル

| ファイル | 目的 |
|------|---------|
| `.env.development` | 開発サーバー（ビルド出力なし） |
| `.env.staging` | ステージングビルド |
| `.env.production` | 本番ビルド |

### 環境変数

| 変数 | 説明 | デフォルト |
|----------|-------------|---------|
| `VITE_BASE_API` | API ベース URL | `''` |
| `VITE_PROXY_TARGET` | 開発プロキシターゲット | — |
| `VITE_API_PREFIX` | ビジネス API プレフィックス | `/api/v1` |
| `VITE_AUTH_API_PREFIX` | 認証 API プレフィックス | `/api/auth` |
| `VITE_SYSTEM_API_PREFIX` | システム API プレフィックス | `/system` |
| `VITE_TINYMCE_SRC` | TinyMCE スクリプトソース | `''` |

### ビルドカスタマイズ

`vite.config.ts` の主要設定：
- **base**：本番環境 `/admin/`、開発環境 `/`
- **開発プロキシ**：`/api`、`/system`、`/upload`、`/uploads` を `VITE_PROXY_TARGET` にプロキシ
- **プラグイン**：`@vitejs/plugin-vue` + `@vitejs/plugin-vue-jsx`
- **エイリアス**：`@` → `src/`
- **Define**：コンパイル時に `process.env.VITE_*` を注入

## EasyAdmin CRUD エンジン

EasyAdmin は本プロジェクトの中核です——宣言的なエンティティ定義から **CRUD インターフェースを自動生成** する設定駆動エンジンです。

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  エンティティ設定  │     │  バックエンド API  │     │  レンダリング UI  │
│  (collections/)  │     │  /system/entities │     │                   │
│                  │     │                   │     │  ┌─────────────┐  │
│  fields: [...]   │────▶│  フィールド型、    │────▶│  │ ListAdmin   │  │
│  list_display    │     │  null 許容、      │     │  │ (テーブル)   │  │
│  list_filter     │     │  リレーション     │     │  └─────────────┘  │
│  detail_display  │     │                   │     │  ┌─────────────┐  │
│                  │     │                   │     │  │ FormAdmin   │  │
│                  │     │                   │     │  │ (フォーム)   │  │
│                  │     │                   │     │  └─────────────┘  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### ステップ 1 — エンティティ設定を定義

`src/configs/collections/common/Content.js`：

```js
import { t } from '@/i18n'

export default {
  Content: {
    form: {
      fields: [
        'title',
        { property: 'category', required: false },
        { property: 'tags', required: false }
      ]
    },
    list: {
      query: { '@order': 'entity.id|DESC' },
      list_filter: {
        title: t('Title'),
        'category.id': () => axios
          .get('/api/v1/manage/categories')
          .then(res => Object.assign({ __label: t('Category') }, ...res.data.map(v => ({ [v.id]: v.name }))))
      },
      list_display: ['id', 'title', 'category', 'tags', 'createdAt']
    },
    detail: {
      detail_display: ['id', 'title', 'category', 'tags', 'body', 'createdAt']
    }
  }
}
```

### ステップ 2 — ルートを登録

`src/configs/routes.js`：

```js
import { r } from '@/router/generator'
import { t } from '@/i18n'
{
  path: '/content', component: Layout,
  meta: { title: t('Content Management'), icon: 'el-icon-notebook' },
  children: [...r('Content', t('Content'))]
}
```

**これだけです** — 自動翻訳された完全なリスト、フォーム、詳細ページが利用可能になります。

### フィールド型プラグイン

EasyAdmin には 17 のフィールド型プラグインが組み込まれており、エンティティメタデータから自動解決されます：

| プラグイン | 型 | 説明 |
|--------|------|-------------|
| `input.vue` | string（デフォルト） | テキスト入力 |
| `textarea.vue` | text | 複数行テキストエリア |
| `text.vue` | — | TinyMCE リッチテキストエディタ |
| `boolean.vue` | boolean | チェックボックス |
| `integer.vue` | integer | 数値入力 |
| `select.vue` | — | ドロップダウンセレクタ |
| `date.vue` | date | 日付ピッカー |
| `datetime.vue` | datetime | 日時ピッカー |
| `image.vue` | image | 画像アップロード/プレビュー |
| `file.vue` | — | ファイルアップロード |
| `json.vue` | — | JSON エディタ（コード/ツリービュー） |
| `json-custom.vue` | — | ネストされたサブオブジェクトエディタ |
| `array.vue` | array | 配列エディタ（セレクトまたはネストフォーム） |
| `RelationToOne.vue` | ManyToOne, OneToOne | リレーションピッカー（リモート検索付き） |
| `RelationToMany.vue` | ManyToMany, OneToMany | 複数リレーションピッカー |
| `transfer.vue` | — | シャトル/トランスファーコンポーネント |
| `code.vue` | — | コードテキストエリア |

（以下、フィールド設定リファレンス、ルートジェネレータ、API 統合、ドキュメント、テスト、デプロイ、ライセンス、謝辞の章は英語版と同様のため省略）
