# Task 02: Vue3 Entry and Global Plugin Migration

## Goal

Migrate the app bootstrap to Vue3 `createApp`, and complete the migration of global plugins, global properties, and global components.

## Scope

- `src/main.js`
- `src/main.ts`
- `src/App.vue`
- `src/icons/index.js`
- `src/shims-vue.d.ts`
- `src/utils/request.ts`
- Global style entry

## Pre-checks

- Task 01 is complete.
- Target UI library confirmed as `element-plus`.
- Vue3 replacement strategy confirmed for `vue-baidu-map`, `v-fit-columns`, `vue-json-editor`, `vue-prism-editor`.

## Implementation Steps

1. Unify the real entry to `src/main.ts`.
2. Remove the forwarding-only `import './main.js'` from `src/main.ts`.
3. Use `createApp(App)` to create the app instance.
4. Replace `new Vue({ ... }).$mount` or `el: '#app'` with `app.mount('#app')`.
5. Replace `Vue.use(...)` with `app.use(...)`.
6. Replace `Vue.prototype.$getValue` with `app.config.globalProperties.$getValue`.
7. Replace `Vue.prototype.axios` with `app.config.globalProperties.axios` or use explicit imports.
8. Change global `svg-icon` registration to `app.component(...)`.
9. Replace Element UI initialization with Element Plus.
10. Update global CSS import paths to ensure styles load correctly in Vite.

## Acceptance Criteria

- App entry no longer references the `Vue` constructor.
- No `Vue.use`, `Vue.prototype`, or `new Vue` in the entry.
- Global styles load correctly.
- `App.vue` mounts successfully with Vue3.
- No entry-level runtime errors in the console.

## Risks

- Vue2 plugins may not directly work with `app.use`.
- Vue3 removed filters; pages relying on filters still need to be handled in follow-up tasks.
- Some global properties need type declarations in TypeScript.
