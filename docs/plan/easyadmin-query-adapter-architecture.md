# EasyAdmin Query Adapter Architecture Plan

> Status: active; query-contract baseline complete
> Last updated: 2026-09-18
> Scope: Move EasyAdmin toward a testable query core and CrudSkeleton adapter without changing existing CRUD behavior.

---

## 1. Goal

EasyAdmin currently combines Vue UI state, CSQE/DQL string construction, URL state,
metadata loading, and REST calls in `ListAdmin.vue`, `SearchFilter.vue`, and
`utils/entity.ts`.

The target is a layered architecture where:

```text
Vue UI -> application use cases -> core query model <- CrudSkeleton adapter
```

- Vue UI owns interaction and rendering only.
- The core owns backend-independent query, filter, sort, and pagination values.
- Application code composes UI state into `AdminQuery` and executes CRUD use cases.
- `adapters/crudskeleton` is the only place that emits CrudSkeleton query syntax
  and calls the CrudSkeleton REST API.
- `utils/request.ts` remains an HTTP/auth/locale transport utility. It must never
  translate EasyAdmin business queries.

There is currently no GraphQL backend plan. `adapters/graphql/` is intentionally
only a reserved placeholder and must not introduce speculative behavior.

---

## 2. Current State

### Completed

1. Moved the Vue layer from `src/components/EasyAdmin/` to
   `src/easyadmin/ui/vue/`.
2. Updated production imports, coverage scope, README/manual/design references,
   and retained a Vitest-only alias for old test imports during the structural
   migration.
3. Added a pure query core:
   - `core/query/filter-node.ts`
   - `core/query/dql-ops.ts`
   - `core/query/sort-node.ts`
   - `core/query/pagination.ts`
4. Added application helpers:
   - `application/query/build-admin-query.ts`
   - `application/query/url-query-sync.ts`
   - `application/usecases/export-records.ts`
   - `application/usecases/batch-update-records.ts`
   - `application/usecases/resolve-batch-fields.ts`
5. Added the CrudSkeleton boundary:
   - `adapters/crudskeleton/CrudSkeletonQueryCompiler.ts`
   - `adapters/crudskeleton/CrudSkeletonAdapter.ts`
6. Added explicit JSON golden fixtures and config-matrix tests. The focused
   fixtures lock unusual output for Order, User, Product, Assignment, AuditLog,
   Role, Setting, and Stock configurations.
7. Audited all EasyAdmin entity configs and the CrudSkeleton backend Core source.
8. Corrected non-DQL-safe `entity.isSystem()` config expressions to
   `entity.getIsSystem()`.
9. Added a direct all-config golden matrix for every real entity configuration.
   It imports the actual config modules, resolves the Category/Content async
   filter factories with deterministic mocked data, and compares exact
   `AdminQuery`, CSQE params, URL state, and adapter identity to checked-in JSON.

### Current Test Baseline

- 99 test files and 1316 tests pass.
- EasyAdmin UI, core, application, and CrudSkeleton adapter coverage has a 100%
  statements/branches/lines threshold.
- Golden outputs use explicit `*.golden.json` plus `toEqual`; snapshots are not
  used for query contracts.

---

## 3. Directory Contract

```text
src/easyadmin/
├── core/
│   ├── query/                         # Pure TS: no Vue, axios, Vuex, or DOM
│   │   ├── admin-query.ts             # Planned canonical AdminQuery model
│   │   ├── filter-node.ts
│   │   ├── dql-ops.ts
│   │   ├── pagination.ts
│   │   └── sort-node.ts
│   ├── model/                         # Planned value types and metadata types
│   │   ├── entity-identity.ts
│   │   ├── field-config.ts
│   │   ├── record.ts
│   │   └── admin-meta.ts
│   └── ports/                         # Planned interfaces, not implementations
│       ├── admin-repository.ts
│       ├── meta-provider.ts
│       └── query-compiler.ts
├── application/
│   ├── query/
│   │   ├── build-admin-query.ts
│   │   └── url-query-sync.ts
│   └── usecases/
│       ├── batch-update-records.ts
│       ├── export-records.ts
│       ├── resolve-batch-fields.ts
│       ├── list-records.ts            # Planned
│       ├── get-record.ts              # Planned
│       ├── save-record.ts             # Planned
│       └── delete-records.ts          # Planned
├── adapters/
│   ├── crudskeleton/
│   │   ├── CrudSkeletonAdapter.ts
│   │   └── CrudSkeletonQueryCompiler.ts
│   └── graphql/
│       └── README.md                  # Reserved; no implementation planned
└── ui/
    └── vue/
        ├── ListAdmin.vue
        ├── SearchFilter.vue
        ├── FormAdmin.vue
        ├── DetailAdmin.vue
        ├── plugins/
        └── ui/feedback.ts
```

Dependency rules:

1. `core` imports nothing from `application`, `adapters`, Vue, axios, Vuex, or
   browser globals.
2. `application` imports `core` and its injected ports only; it does not emit
   CSQE strings or call axios directly.
3. `adapters/crudskeleton` implements backend syntax and network-backed behavior.
4. `ui/vue` may call application code but must not create new `@filter`,
   `@order`, `@basis`, or `@mode` protocol semantics.
5. Project entity declarations remain under `src/configs/`; they are application
   configuration, not EasyAdmin engine source.

---

## 4. CrudSkeleton Query Contract

The following contract was checked against
`/Volumes/Nayuki/Development/PHP/crud-skeleton/src/Core`.

### 4.1 List Parameters

```text
GET {prefix}/{plural}
  ?@filter=<DQL expression>
  &@order=<field|DIR[,field|DIR]>
  &page=<1-based number>
  &limit=<number>
```

- `@order` is the normal database sort parameter. Use comma-separated
  `field|ASC` / `field|DESC` values.
- `@sort` is an administrator-only in-memory comparator using `x`/`y` variables.
  UI code must never use it.
- `@dql` and `@hints` are administrator-only. `@showDQL` is development-only.
- Relation dropdowns use `@display=reduce` and currently request `limit=1e10`.
  No limit cap was found in the audited Core list layer; preserve current behavior
  until a paginator-level cap is confirmed.

### 4.2 DQL Rules

```text
entity.getUser().getName() matches 'Rin'
entity.getCreatedAt() >= datetime.get("2024-01-01T00:00:00+00:00")
entity.getIsSystem() == true
!entity.getRevokedAt()
```

- Use `entity.getX()` chains only. They compile directly to Doctrine joins and
  fields.
- Do not use `entity.field`, `entity.isX()`, `entity.hasX()`, or bare names.
  They fail the DQL fast path: non-admin requests receive HTTP 403; admin requests
  may silently fall back to full-table in-memory evaluation.
- Join predicates with `&&` / `||`, never `and` / `or`.
- `matches 'text'` becomes a backend-escaped substring `LIKE`; do not pre-wrap
  the value in `%`.
- `:value` is a frontend configuration placeholder. It must be substituted before
  sending `@filter`; the backend does not replace it in filter expressions.
- Use bare `entity.getX()` for `IS NOT NULL` and `!entity.getX()` for `IS NULL`.
  Never use `== null`, which compiles to SQL `= NULL`.
- `datetime.get()` is valid through the backend expression value map. Prefer an
  ISO-8601 timestamp with timezone for date boundaries.

### 4.3 Metadata

```text
GET /system/entities                 -> string[] FQCNs with backslashes
GET /system/entities/{FQCN with /}   -> field structure map
```

The structure map provides `metadata` plus `plantext` and `translation`. The
frontend currently types `plaintext`; normalize that spelling when metadata moves
into `core/model/admin-meta.ts`.

Metadata types include Doctrine scalar types and relation values:
`ManyToOne`, `OneToOne`, `ManyToMany`, and `OneToMany`. `targetEntity` is a
backslash-delimited FQCN.

### 4.4 Mutations

```text
POST {prefix}/{plural}/batch-update?@basis=id&@mode=update
[
  { "id": 1, "fieldToUpdate": "new value" },
  { "id": 2, "fieldToUpdate": "new value" }
]
```

- The batch body must be a top-level JSON array.
- Omitted fields remain unchanged; only owned and selected batch fields are sent.
- `@mode=mixed` is backend default upsert behavior. Any non-`mixed` value,
  including current `update`, skips non-matching records rather than creating them.
- Default `@partial=false` is transactional: an error rolls back the whole batch.
  `@partial=true` flushes records independently and silently omits failed records
  from the response.
- The backend has no batch-delete route. Batch deletion remains concurrent
  `DELETE {prefix}/{plural}/{id}` requests with `Promise.allSettled`.
- Create and single-update validation errors are string messages in warning
  envelopes, not field-keyed error maps. Batch-update errors may bubble directly.

---

## 5. Golden Contract Strategy

The query boundary is protected by explicit fixtures under:

```text
tests/unit/easyadmin/golden/__fixtures__/*.golden.json
```

Every fixture must assert with `toEqual`:

1. `adminQuery`: core filter/sort/page representation.
2. `csqeParams`: exact HTTP query params (`@filter`, `@order`, `page`, `limit`).
3. `urlQueryString`: URL state serialization.
4. `exportRequest`: merged query, labels, normalized data, and filename.
5. `batchUpdateBody`: selected-field payload records.

Existing fixture coverage:

| Fixture | Locked behavior |
|---|---|
| Order | select shorthand, dotted string filter, currency display, default ordering |
| User | full boolean expression, object batch fields, false filter drop versus URL retention |
| Product | nested relation query shape |
| Assignment | relation id expression, select shorthand, bare non-null expression, `relation_filter` substitution |
| AuditLog | `datetime.get(":value")` expression |
| Role | `system` input key to `getIsSystem()` field path and ASC sort |
| Setting | three-key sort order |
| Stock | custom prefix and non-default multi-key order |

The focused fixtures are supplemented by
`all-config-query-matrix.golden.json`. It has exactly one row per real PascalCase
entity loaded by `configs/entities.js`. Each row includes every key from that
entity's `list.list_filter`, plus the exact final `AdminQuery`, CSQE params, URL
query string, and resolved `name`/`prefix`/`plural` identity. The matrix test
fails when an entity is added, removed, or gains/removes a list filter without a
deliberate golden update.

When adding a config shape, add a fixture if it creates a new protocol output. Do
not add snapshots; intentional contract changes must be visible as JSON diffs.
The all-config matrix must be updated in the same commit as every entity config
query/filter/identity change.

---

## 6. Remaining Implementation Phases

### Phase 1: Introduce Canonical Core Models

Status: complete for query/identity/record/ports; `field-config.ts` re-exports
`src/types/admin.ts` as the single source until consumers migrate, and
`admin-meta.ts` holds backend-faithful `plantext` types.

1. Added `core/query/admin-query.ts` as the canonical `AdminQuery` type; the
   duplicated interfaces in `build-admin-query.ts` and
   `CrudSkeletonQueryCompiler.ts` now import it (compiler keeps a `CompileInput`
   extension for transport extras).
2. Added `core/model/entity-identity.ts` (`resolveEntityIdentity`, injected
   pluralize strategy), `record.ts`, and `field-config.ts`.
3. `CrudSkeletonAdapter` now builds identity via `resolveEntityIdentity` and
   imports record types from core; runtime output unchanged.
4. Defined `AdminMeta` raw types from the audited `/system/entities` response,
   preserving the backend spelling `plantext` at the adapter boundary.
5. Added `core/ports/admin-repository.ts`, `meta-provider.ts`, and
   `query-compiler.ts` (interfaces only, no implementations wired yet).

Acceptance:

- Pure core modules have 100% statements/branches/lines coverage.
- Core has no Vue, axios, Vuex, DOM, or CrudSkeleton imports.

### Phase 2: Replace `EntityManage` Behind a Port

Status: adapter exists; UI is not yet switched.

1. Define `AdminRepository` and `MetaProvider` ports in `core/ports/`.
2. Make `CrudSkeletonAdapter` implement those ports.
3. Extract the Vuex/sessionStorage entity-structure cache from
   `store/modules/entity.js` into the CrudSkeleton metadata adapter boundary while
   retaining the store as an implementation detail initially.
4. Move `EntityManage` consumers incrementally to injected/constructed
   `CrudSkeletonAdapter` instances.
5. Delete `src/utils/entity.ts` only after no production or test import remains.

Acceptance:

- URL matrix covers every custom `name` / `prefix` / `plural` config identity.
- Metadata cache hit, miss, entity-not-found, and response normalization tests
  remain green.
- No runtime behavior changes in list, form, detail, relation dropdown, delete,
  export, or batch edit flows.

### Phase 3: Move List Query Assembly Out of Vue

Status: helpers exist; `ListAdmin.vue` still owns behavior.

1. Replace `ListAdmin`'s default `dataProcessor` merge with
   `buildAdminQuery()` -> `compileCsqeQuery()` -> `CrudSkeletonAdapter.list()`.
2. Replace component-local `buildQueryParams()` and `applyQueryParams()` calls
   with `application/query/url-query-sync.ts`.
3. Extract `normalizePaginator()` into the application read path while retaining
   current `totalCount ?? total` behavior until the backend paginator owner is
   audited.
4. Route export and batch edit through their existing pure use cases.

Acceptance:

- Existing UI specs continue to pass without changing externally visible output.
- Each config golden produces identical `csqeParams`, URL string, export request,
  and batch body before and after the switch.
- No `Object.assign({}, query, filter, pager, sort)` query assembly remains in a
  Vue component.

### Phase 4: Move Filter Generation to Core Nodes

Status: not started.

1. Let `SearchFilter` emit filter state or `FilterNode`, not a final `@filter`
   string.
2. Keep reduced-style configuration conversion and async filter factories in the
   Vue/config boundary, but use `dql-ops.ts` for expression construction.
3. Make `CrudSkeletonQueryCompiler` the only source of final `@filter` and
   `@order` HTTP parameter strings.
4. Preserve existing falsy semantics: `SearchFilter` currently drops `0`, `false`,
   `''`, `null`, and `undefined` from DQL filtering. This is intentional legacy
   behavior and is golden-tested; do not change it incidentally.
5. Keep the known distinction: URL query serialization preserves `0` and `false`
   while DQL filter generation drops them.

Acceptance:

- No Vue file builds `@filter` directly.
- `@filter` is emitted only from `adapters/crudskeleton`.
- Golden tests retain the explicit false/zero behavior.

### Phase 5: Form, Detail, and Relation Boundaries

Status: not started.

1. Move form save/create/update and delete orchestration into application use
   cases, preserving backend validation-message behavior.
2. Route relation option loading through the repository port. Preserve
   `@display=reduce`, `limit=1e10`, `relation_filter`, and remote `:value`
   substitution.
3. Keep plugin selection and Element Plus rendering in `ui/vue/plugins/`.
4. Flatten `ui/vue/ui/feedback.ts` to `ui/vue/feedback.ts` when test imports are
   migrated, then remove the Vitest old-path alias.

Acceptance:

- Relation option requests have exact contract tests for base filter, remote query,
  `@display`, and `limit`.
- Save and mutation use cases cover success, validation string errors, 403, 404,
  and batch partial/full-transaction behavior.

### Phase 6: Remove Migration Compatibility

Status: deferred until Phases 2-5 complete.

1. Update all tests from `@/components/EasyAdmin/...` to
   `@/easyadmin/ui/vue/...`.
2. Remove the Vitest-only `@/components/EasyAdmin` alias.
3. Delete `utils/entity.ts` after adapter migration.
4. Remove duplicate types and obsolete Vue-local query helpers.
5. Update README, manual, design contracts, and this plan after each completed
   phase; never document an unimplemented runtime contract as complete.

---

## 7. Non-Goals

- No GraphQL implementation until a backend contract exists.
- No forced cursor pagination; current CrudSkeleton protocol is offset
  `page`/`limit`.
- No Axios interceptor query rewriting.
- No spontaneous change to falsy filter semantics, relation dropdown limit, or
  batch-update mode behavior.
- No broad rewrite of Options API or plugins as part of query-adapter work.

---

## 8. Required Verification Per Change

Every phase must run:

```bash
npm run test:coverage
npm run type-check
npm run build
```

Coverage requirements remain 100% statements, branches, and lines for:

```text
src/easyadmin/ui/vue/**/*.{vue,ts}
src/easyadmin/core/**/*.ts
src/easyadmin/application/**/*.ts
src/easyadmin/adapters/crudskeleton/**/*.ts
```

`src/easyadmin/adapters/graphql/**` remains explicitly excluded until a real
backend contract exists.
