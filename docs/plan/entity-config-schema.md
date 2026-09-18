# Entity Config JSON Schema Plan

> Status: implemented (schema + Ajv spec green on all 31 entities)
> Last updated: 2026-09-18
> Scope: Give every EasyAdmin entity config a machine-checkable schema so AI
> authors get autocomplete and instant validation instead of test-run feedback.

---

## 1. Why

Entity configs are already AI-written in practice. Today's safety net runs late:

```text
AI writes config → vitest (config-shape + golden) → human reads diff
```

The shape spec and golden matrix catch errors **after** authoring. A JSON Schema
moves the same rules to **authorship time** (editor completion + inline errors),
using the exact stack the repo already owns: draft-07 schemas (`StoreAddress.json`
convention), `$id` addressing, and Ajv (`allErrors: true, strict: false`, same
options as the `json_schema` form plugin).

Non-goal: replacing `config-shape.spec.js` or the golden matrix. The schema is
the fast inner loop; tests remain the contract gate.

---

## 2. Design Constraints (from audit)

1. **Functions cannot live in JSON Schema.** Configs legitimately contain
   async filter factories (`Category.parent.id`, `Content.category.id`),
   `component` (Vue/JSX), `data_processor`, `actions[].component`,
   `is_locked`. The schema must describe every declarative slot strictly and
   explicitly permit function slots without deep-validating them
   (companion JS assertions keep covering those — they already do).
2. **DQL strings are opaque to JSON Schema.** `expression` values stay
   `type: string`; semantic safety remains with `validateDqlExpression` and the
   config-wide fast-path test. Schema may add `pattern` guards only where they
   cannot false-positive (none proposed initially).
3. **Follow repo conventions**: `$schema: http://json-schema.org/draft-07/schema#`,
   `$id: EasyAdmin/EntityConfig`, `additionalProperties: false` on known
   objects (mirrors `StoreAddress.json`), English `description` on every node
   (descriptions double as AI authoring hints).
4. **One schema, all 31 entities.** No per-bundle variants. Unknown keys reject,
   so a new config capability forces a deliberate schema update in the same
   commit — the same rule the golden matrix already enforces for query output.

---

## 3. Schema Location and Shape

New file: `src/configs/schema/entity-config.schema.json`

```text
src/configs/
├── schema/
│   └── entity-config.schema.json   # $id: EasyAdmin/EntityConfig, draft-07
├── collections/ ...                # unchanged
├── entities.js / routes.js ...     # unchanged
```

Top level (each collection file exports `{ EntityName: EntityConfig }`):

- `entity`: `{ name (required), prefix?, plural? }` — string-or-object forms
  currently in use stay valid; no normalization.
- `form.fields`: array of `string | FieldOption | '__all__'`-adjacent shapes;
  `FieldOption` covers `property` (required), `label`, `type` (enum of the 21
  plugin types plus relation aliases), `required`, `editable`, `tab`,
  `default_value`, `field_options/events`, `type_options/events`, `hidden`
  (`boolean | array of create/update/edit`), `relation_filter`
  (`@filter`/`@order` strings), `relation` (entity/target/valueKey/multiple/
  cardinality), `component` (permitted, unvalidated), `rules`/`validator`
  (permitted, unvalidated), `help`, `full_width`, index-tolerant extras per
  current `FieldOption` contract.
- `form.batch_edit.fields`: non-empty array, same item shape.
- `list`: `list_display` (array), `list_filter` (object; values may be
  string/null/object — functions permitted, unvalidated),
  `query` (`@order`/`@filter` strings), `disabled_actions` (enum of the 9 known
  actions), `data_processor`/`actions`/`export` (permitted, unvalidated),
  `is_locked` (permitted, unvalidated).
- `detail.detail_display`: `'__all__'` or array.
- `adapters` (reserved, optional object): placeholder for per-backend overrides
  if the second-backend strategy is ever approved. Schema accepts and ignores;
  no compiler reads it until then.

---

## 4. Validation Wiring (executable, not advisory)

1. New spec `tests/unit/easyadmin/configs/entity-config-schema.spec.js`:
   - Loads Ajv with the repo's options, compiles the schema once.
   - For every real PascalCase entity in `@/configs/entities`, validates a
     **JSON-safe projection**: functions/components replaced by marker stubs
     (projection helper lives in the spec file, ~15 lines; source configs are
     never mutated).
   - Asserts valid; on failure prints `ajv.errorsText` with entity name.
   - Targeted unit cases for each rejection rule (unknown key, bad `type` enum,
     unknown `disabled_actions` value, empty `batch_edit.fields`).
2. Coverage: schema file is JSON (no gates needed); the spec runs inside the
   existing 100% suite without touching thresholds.
3. Editor integration (no code): point `json.schemas` at the schema file for
   `src/configs/collections/**/*.{js,jsx}` glob in `.vscode/settings.json`
   (create only if the team wants it; keep out of versioned config otherwise).

---

## 5. AI Authoring Checklist (normative for generated configs)

1. Prefer reduced shorthand (`'name'`, `{ __label, __default, options }`).
   Full-style `expression` only when shorthand cannot express the predicate.
2. Full-style expressions must pass `validateDqlExpression`: `entity.getX()`
   chains, `&&`/`||`, no `== null`, no bare `is*`/`has*`.
3. Sort via `@order` `field|DIR` comma lists; never `@sort`.
4. New query-relevant keys require same-commit updates to:
   `all-config-query-matrix.golden.json` + this schema (if shape is new).
5. Async filter factories must return promises resolving to select-shorthand;
   `component`/`data_processor`/`actions` slots stay hand-reviewed.

---

## 6. Phases

1. **Schema draft**: author `entity-config.schema.json` from `types/admin.ts` +
   `config-shape.spec.js` assertions (the spec is the checklist; every assertion
   becomes a schema node or an explicit function-slot carve-out).
2. **Projection spec**: add the Ajv spec; all 31 entities green on first run
   (fix schema, not configs, on mismatch unless a real violation surfaces).
3. **Editor integration (local-only, implemented)**: `.vscode/tasks.json`
   exposes a default test-group task running `npm run validate:configs`;
   `.vscode/extensions.json` recommends eslint + Vitest explorer + Volar.
   These files are intentionally **not versioned** (`.gitignore` excludes
   `.vscode`). Rationale, verified during implementation: VS Code
   `json.schemas` associations apply to JSON/YAML files only and cannot attach
   to `.js` entity configs, so a committed `settings.json` mapping would be a
   no-op lie. Editor feedback for JS configs stays one keypress away via the
   task; contractual feedback stays in CI/build.
4. **Build gate (versioned, implemented)**: `package.json` gains
   `validate:configs` (scoped Ajv spec, ~3s) chained into `build`,
   `build:prod`, and `build:stage`. A shape-violating config now fails the
   build before Vite runs.

Acceptance per phase: `npm run test:coverage`, `type-check`, `build`,
`git diff --check` clean; no production behavior change (schema + spec only,
zero `src/` runtime edits).

---

## 7. Open Questions

1. `component`/`actions` slots: keep permanently unvalidated, or introduce a
   `{ componentName }` registry enum later so AI can only reference registered
   components?
2. Should `adapters` reservation be dropped from v1 to avoid blessing an
   unapproved strategy?
3. ~~`.vscode/settings.json`: version it (team-wide) or document as opt-in?~~
   Resolved: `.vscode/` is gitignored repo-wide, so editor integration is
   local-only by policy (`tasks.json` + extension recommendations, no
   `json.schemas` mapping — inapplicable to `.js` files).
