# Task 08: Final Regression and Release Preparation

## Goal

Complete end-to-end manual regression, build verification, and release preparation after the Vue3 + TSX + Vite migration.

## Scope

- Entire project
- Deployment configuration
- API proxy configuration
- Static asset paths
- Login and permission flow
- CRUD main flow

## Pre-checks

- Tasks 01 through 07 are complete.
- Local development environment can start.
- Build and test commands are executable.

## Regression Steps

1. Run `npm run lint`.
2. Run `npm run type-check`.
3. Run `npm run test`.
4. Run `npm run build`.
5. Run `npm run preview`.
6. Verify static asset paths under `/admin/` base path are correct.
7. Verify unauthenticated access to protected pages redirects to login.
8. Verify user info and roles are fetched after successful login.
9. Verify dynamic routes and menu generation are correct.
10. Verify dynamic routes are restored correctly after page refresh.
11. Verify logout clears token, roles, dynamic routes, and tags view correctly.
12. Verify Dashboard, 404, and Login pages.
13. Verify Sidebar, Breadcrumb, Navbar.
14. Verify EasyAdmin list, filter, pagination, sort.
15. Verify EasyAdmin create, edit, delete.
16. Verify special form plugins: upload, rich text, JSON, code editor, relation fields.
17. Verify export functionality.
18. Verify mobile layout and sidebar behavior.

## Release Preparation

- Confirm production `.env.production` uses `VITE_*` variables.
- Confirm backend Nginx or static server supports history fallback.
- Confirm `/admin/` sub-path deployment works.
- Confirm API proxy is only used in development; production uses the correct API base.
- Confirm build output does not contain old Vue CLI injected variables.

## Acceptance Criteria

- All automated checks pass.
- Core manual regression passes.
- Production preview has no static asset 404s.
- No blocking runtime errors in the console.
- Login, permissions, and CRUD main flows work.

## Risks

- History mode under `/admin/` sub-path requires server-side fallback configuration.
- Static asset base path errors can cause white screen in production.
- Dynamic route issues may only surface on refresh or after logout.
