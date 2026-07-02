# Task 04: Vuex 4 Store Migration

## Goal

Migrate from Vuex 3 to Vuex 4, preserving existing state modules, permission state, user state, and getters behavior.

## Scope

- `src/store/index.js`
- `src/store/getters.js`
- `src/store/modules/*.js`
- Components using `$store`

## Pre-checks

- Task 03 is complete or Router migration plan is finalized.
- Confirmed that Pinia is NOT migrated in this phase.

## Implementation Steps

1. Install and use `vuex@4`.
2. Replace `new Vuex.Store` with `createStore`.
3. Remove `Vue.use(Vuex)`.
4. Replace `require.context('./modules', true, /\.js$/)` with `import.meta.glob('./modules/*.js', { eager: true })`.
5. Preserve existing module namespaces.
6. Check all action return values; ensure login, logout, getInfo, generateRoutes still return Promises or async results.
7. Check that `this.$store` is available in components.
8. If TypeScript errors occur, add minimal type declarations; do not fully type the store in this phase.

## Acceptance Criteria

- Store registers correctly via `app.use(store)`.
- `store.getters.token` and `store.getters.roles` work.
- `user/login`, `user/getInfo`, `user/logout` work.
- `permission/generateRoutes` works.
- All store modules are auto-loaded.

## Risks

- `import.meta.glob` reads module default exports differently than `require.context`.
- Vuex 4 API is largely compatible, but TypeScript type exposure differs.
- Migrating Pinia simultaneously would amplify permission regression risk, so this phase skips it.
