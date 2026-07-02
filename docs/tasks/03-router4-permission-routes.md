# Task 03: Router 4 and Permission Routes Migration

## Goal

Migrate from Vue Router 3 to Vue Router 4, maintaining stable login validation, role-based permissions, dynamic routing, and route reset behavior.

## Scope

- `src/router/index.js`
- `src/router/generator.js`
- `src/permission.js`
- `src/store/modules/permission.js`
- `src/store/modules/user.js`
- `src/configs/routes.js`

## Pre-checks

- Task 02 is complete.
- Production base path confirmed as `/admin/`.
- All dynamic route names are listed to avoid omissions during route reset.

## Implementation Steps

1. Replace `new Router` with `createRouter`.
2. Replace `mode: 'history'` and `base: 'admin'` with `createWebHistory('/admin/')`.
3. Replace wildcard route `path: '*'` with `path: '/:pathMatch(.*)*'`.
4. Remove `Vue.use(Router)`.
5. Replace `router.addRoutes(accessRoutes)` with `router.addRoute(...)`.
6. Implement a recursive dynamic route addition utility function.
7. Rewrite `resetRouter()` to use `router.removeRoute(name)` for cleanup.
8. Replace dynamic `require()` in `src/router/generator.js` with `import.meta.glob`.
9. Review `beforeEach` logic in `src/permission.js`, gradually migrate from `next` style to return style if needed.
10. Update role switching and logout route reset logic in `src/store/modules/user.js`.

## Acceptance Criteria

- Unauthenticated access to protected pages redirects to login.
- After successful login, dynamic routes are added based on roles.
- Dynamic routes are restored after page refresh.
- Dynamic routes are cleaned up after logout.
- Non-existent paths redirect to 404.
- `router.addRoutes` no longer appears.

## Risks

- Incorrect parent-child dynamic route addition order can make child routes inaccessible.
- Missing dynamic route names can prevent `removeRoute` from cleaning up.
- Vite cannot handle runtime path-concatenated `import()`; `import.meta.glob` mapping is required.
