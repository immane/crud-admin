# Task 01: Vite Infrastructure Migration

## Goal

Migrate the project from Vue CLI/Webpack build chain to Vite, establishing a bootable and buildable foundation for subsequent Vue3 migration.

## Scope

- `package.json`
- `vite.config.ts`
- `index.html`
- `.env.development`
- `.env.production`
- `.env.staging`
- `tsconfig.json`
- `public/`
- `vue.config.js`

## Pre-checks

- Record current results of `npm run lint`, `npm run type-check`, `npm run test:unit`, `npm run build:prod`.
- Confirm whether `src/background.js` still needs Electron support.
- Confirm whether production base path continues to be `/admin/`.

## Implementation Steps

1. Add `vite.config.ts`.
2. Configure `@vitejs/plugin-vue` and `@vitejs/plugin-vue-jsx`.
3. Configure `@` alias pointing to `src`.
4. Configure Vite `base`: `/` for dev, `/admin/` for production.
5. Migrate `/api` and `/system` proxy from `vue.config.js` to `server.proxy`.
6. Move `public/index.html` to root `index.html`.
7. Replace Vue CLI template variables in HTML (e.g., `<%= BASE_URL %>`, `<%= webpackConfig.name %>`).
8. Rename environment variables from `VUE_APP_*` to `VITE_*`.
9. Update `package.json` scripts: `dev`, `build`, `preview`, `type-check`.
10. Remove Vue CLI/Webpack-specific dependencies.
11. Add Vite, Vue plugin, and Vue TS checking dependencies.

## Acceptance Criteria

- `npm run dev` starts Vite dev server.
- `index.html` correctly mounts `#app`.
- Vite recognizes `@/` path alias.
- `/api` and `/system` proxies still work.
- `npm run build` at least enters Vite build flow, no longer depends on `vue-cli-service`.

## Risks

- Old Webpack features may still error out, e.g., `require.context`, dynamic `require()`.
- This task only migrates build foundations; business pages are not required to be fully operational.
