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

- 101 test files and 1330 tests pass.
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

Status: complete. `utils/entity.ts` is deleted; `tests/unit/utils/entity*.spec.js`
now target the adapter directly.

1. Defined `AdminRepository` and `MetaProvider` ports in `core/ports/`;
   `CrudSkeletonAdapter` implements both.
2. Extracted the Vuex/sessionStorage entity-structure flow into
   `adapters/crudskeleton/CrudSkeletonMetaProvider`; the adapter delegates
   `listEntities()` / `getStructure()` / `structure()` to it. The store remains
   the persistence implementation detail.
3. Moved all production `EntityManage` consumers (`ListAdmin`, `FormAdmin`,
   `DetailAdmin`, `RelationToOne`, `utils/relation`, dashboard) to constructed
   `CrudSkeletonAdapter` instances.
4. Deleted `src/utils/entity.ts` after migrating `tests/unit/utils/entity*.spec.js`.
5. Component specs mock the adapter module path.

Acceptance:

- URL matrix covers every custom `name` / `prefix` / `plural` config identity.
- Metadata cache hit, miss, entity-not-found, and response normalization tests
  remain green.
- No runtime behavior changes in list, form, detail, relation dropdown, delete,
  export, or batch edit flows.

### Phase 3: Move List Query Assembly Out of Vue

Status: complete for list, export, and batch paths. `SearchFilter` expression
ownership moves in Phase 4; relation option loading moves in Phase 5.

1. `ListAdmin`'s default `dataProcessor` now merges via `compileCsqeQuery()`
   (`query` + `@filter` + pager + sort) instead of an inline `Object.assign`.
2. Component-local `buildQueryParams()` / `applyQueryParams()` delegate to
   `application/query/url-query-sync.ts` (method names and external behavior
   unchanged; the helper preserves raw filter values and stringifies only
   `page`/`limit`).
3. `normalizePaginator()` delegates to `core/query/pagination.ts`, retaining
   `totalCount ?? total` until the backend paginator owner is audited.
4. Export flows through `buildExportRequest()` via a new `exportData()` method;
   batch delete/edit ids and payloads flow through `collectBatchDeleteIds()` /
   `collectBatchUpdateData()`; sort mapping flows through
   `mapElementPlusSort()` / `formatSortParam()`.

Acceptance:

- Existing UI specs continue to pass without changing externally visible output.
- Each config golden produces identical `csqeParams`, URL string, export request,
  and batch body before and after the switch.
- No `Object.assign({}, query, filter, pager, sort)` query assembly remains in a
  Vue component.

### Phase 4: Move Filter Generation to Core Nodes

Status: complete for `SearchFilter`; relation option loading moves in Phase 5.

1. `SearchFilter.filterProcess()` now derives reduced-style filters through
   `dql-ops.shorthandExpression()`; full-style filters still pass through
   untouched and async factories keep their resolve flow.
2. `SearchFilter.filterGenerate()` now joins through `shouldIncludeValue()` /
   `substituteValue()` / `joinExpressions()`; emitted `update:modelValue` and
   `update:filter` shapes are unchanged.
3. The final `@filter` HTTP param for list fetching is produced by
   `CrudSkeletonQueryCompiler` (wired in Phase 3); relation option `@filter`
   substitution in `RelationToOne` stays until Phase 5.
4. Existing falsy semantics preserved and golden-tested: DQL generation drops
   `0`, `false`, `''`, `null`, and `undefined`, while URL serialization keeps
   `0` and `false`.

Acceptance:

- No Vue file builds `@filter` directly.
- `@filter` is emitted only from `adapters/crudskeleton`.
- Golden tests retain the explicit false/zero behavior.

### Phase 5: Form, Detail, and Relation Boundaries

Status: complete for save/delete/relation-request/feedback paths. `DetailAdmin`
fetch orchestration and plugin micro-interactions remain UI-owned by design.

1. Form save flows through `save-record` (`cleanBlankAttributes`,
   `isUpdateOperation`); `FormAdmin` keeps validation, feedback, and routing.
2. Batch deletion counts flow through `summarizeSettledDeletions()`.
3. Relation option requests flow through `buildRelationListParams()`,
   preserving `@display=reduce`, `limit=1e10`, `relation_filter`, and remote
   `:value` substitution. The adapter instance remains constructed in the
   plugin; port-level injection would require prop drilling and is deferred.
4. Flattened `ui/vue/ui/feedback.ts` to `ui/vue/feedback.ts`; component and
   test imports follow. The Vitest old-path alias moves in Phase 6.

Acceptance:

- Relation option requests have exact contract tests for base filter, remote query,
  `@display`, and `limit`.
- Save and mutation use cases cover success, validation string errors, 403, 404,
  and batch partial/full-transaction behavior.

### Phase 6: Remove Migration Compatibility

Status: complete.

1. Migrated all tests from `@/components/EasyAdmin/...` to
   `@/easyadmin/ui/vue/...`, and `tests/unit/utils/entity*.spec.js` to the
   adapter module.
2. Removed the Vitest-only `@/components/EasyAdmin` alias.
3. Deleted `utils/entity.ts` after adapter migration.
4. Removed the duplicate `AdminQuery` re-export from `build-admin-query.ts`;
   `field-config.ts` remains a single-source re-export of `types/admin.ts`
   until consumers migrate.
5. README, manual, design contracts, and this plan were updated with each
   phase. Test-local mock identifiers (`MockEntityManage`, `EntityManageMock`)
   were intentionally left untouched.

---

## 7. Known Debt: CSQE Dialect Inside Core

Status: recorded, not yet scheduled. Deliberately deferred: behavior is fully
golden-locked, and the fix churns every fixture for modeling purity only.

`src/easyadmin/core` currently emits and validates CrudSkeleton query syntax,
contradicting the dependency rule that only `adapters/crudskeleton` may do so:

1. `core/query/dql-ops.ts` renders DQL: `shorthandExpression()` produces
   `` entity... matches ':value' `` / `` == ':value' `` strings,
   `dottedKeyToExpression()` produces `.getX()` chains, and
   `joinExpressions()` joins with parens + `&&`. `FilterNode` is therefore
   backend-independent in name only — `cond(expression)` carries DQL payload.
   (Historical cause: verbatim extraction from `SearchFilter` in Phase 0,
   before a canonical node model existed.)
2. `core/query/validate-dql-expression.ts` encodes backend parser knowledge
   (`getX()` fast path, `&&`/`||`, `== null` ban). It belongs in
   `adapters/crudskeleton/`.
3. `core/query/sort-node.ts` leaks twice: `mapElementPlusSort()` knows Element
   Plus vocabulary (belongs in `ui/vue` or application) and
   `formatSortParam()` renders the CSQE `entity.field|DIR` dialect (belongs in
   the compiler). Core should keep only the `SortNode { field, dir }` data type.
4. Comment-level coupling in `core/query/admin-query.ts` and
   `core/ports/admin-repository.ts` (mention CrudSkeleton by name).

Remediation sketch (when scheduled): redefine `FilterNode` as data
(`{ field, op, value }` leaves + `and` + `raw` escape hatch for hand-authored
config DQL such as `datetime.get(...)`; UI generates AND only, so no full
boolean tree), move DQL/`@order` rendering into the CrudSkeleton compiler,
move the validator into `adapters/crudskeleton/`, and regenerate fixture
`adminQuery.filter` shapes while keeping every `csqeParams`/`urlQueryString`
byte-identical. Possibly co-move `normalizePaginator` (CSQE response shape)
once paginator authority is audited.

---

## 8. Non-Goals
- No GraphQL implementation until a backend contract exists.
- No forced cursor pagination; current CrudSkeleton protocol is offset
  `page`/`limit`.
- No Axios interceptor query rewriting.
- No spontaneous change to falsy filter semantics, relation dropdown limit, or
  batch-update mode behavior.
- No broad rewrite of Options API or plugins as part of query-adapter work.

---

## 9. Required Verification Per Change

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
