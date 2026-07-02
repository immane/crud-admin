# Task 07: Testing and Quality Assurance Migration

## Goal

Migrate the test pipeline from Jest + Vue2 Test Utils to Vitest + Vue3 Test Utils, and establish regression guarantees after the Vue3 migration.

## Scope

- `jest.config.js`
- `tests/unit/**/*.spec.js`
- `package.json`
- `vite.config.ts`
- `.eslintrc.js` or future ESLint config
- `tsconfig.json`

## Pre-checks

- Tasks 01 through 06's main code migrations are complete.
- The app can start locally.
- The app can enter the build process.

## Implementation Steps

1. Install `vitest`, `@vue/test-utils@2`, `jsdom`.
2. Configure test environment in `vite.config.ts` or `vitest.config.ts`.
3. Remove or disable `jest.config.js`.
4. Replace Jest global APIs or enable Vitest globals.
5. Migrate utility function tests.
6. Migrate basic component tests: `Hamburger`, `Breadcrumb`, `SvgIcon`.
7. Migrate `request.ts` test, mock axios and `ElMessage`.
8. Add core smoke tests for EasyAdmin.
9. Update `package.json` scripts: `test`, `test:unit`, `test:ci`.
10. Check that lint and type-check cover `.vue`, `.ts`, `.tsx` files.

## Suggested Test Priority

Priority P0:

- `tests/unit/utils/validate.spec.js`
- `tests/unit/utils/formatTime.spec.js`
- `tests/unit/utils/parseTime.spec.js`
- `tests/unit/utils/param2Obj.spec.js`
- `tests/unit/utils/entity.spec.js`

Priority P1:

- `tests/unit/components/Hamburger.spec.js`
- `tests/unit/components/Breadcrumb.spec.js`
- `tests/unit/components/SvgIcon.spec.js`
- `tests/unit/utils/request.spec.js`

Priority P2:

- EasyAdmin filter generation smoke test
- EasyAdmin form default value smoke test
- EasyAdmin dynamic plugin resolution smoke test
- EasyAdmin list action smoke test

## Acceptance Criteria

- `npm run test` passes.
- `npm run type-check` passes.
- `npm run build` passes.
- Key component tests no longer depend on Vue2 Test Utils API.
- CI commands no longer call `vue-cli-service test:unit`.

## Risks

- Vue Test Utils 2's mount API and wrapper behavior differ from the Vue2 version.
- Element Plus component tests require proper stubbing.
- Old snapshots may need rebuilding and should not be blindly preserved.
