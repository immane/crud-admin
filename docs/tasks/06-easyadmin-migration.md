# Task 06: EasyAdmin Specialized Migration

## Goal

Migrate the config-driven CRUD core capabilities, ensuring list, filter, pagination, sort, create, edit, delete, form plugins, and export work correctly.

## Scope

- `src/components/EasyAdmin/ListAdmin.vue`
- `src/components/EasyAdmin/FormAdmin.vue`
- `src/components/EasyAdmin/SearchFilter.vue`
- `src/components/EasyAdmin/plugins/form/*.vue`
- `src/components/EasyAdmin/plugins/list/editable-plain.vue`
- `src/components/EasyAdmin/ui/feedback.ts`
- `src/views/admin/*.vue`
- `src/views/user/*.vue`

## Pre-checks

- Task 05 is complete.
- Element Plus basic components are available.
- Router and Store migrations are complete.

## Implementation Steps

1. Migrate `SearchFilter.vue`.
2. Change `SearchFilter`'s `value/input` protocol to `modelValue/update:modelValue`.
3. Replace `this.$set` in `SearchFilter` with direct assignment.
4. Change `filter.sync` to `v-model:filter`.
5. Migrate `FormAdmin.vue`.
6. Change `FormAdmin`'s `value/input` protocol to `modelValue/update:modelValue`.
7. Replace dynamic plugin `require()` in `FormAdmin` with `import.meta.glob`.
8. Migrate `ListAdmin.vue`.
9. Remove Vue filters in `ListAdmin.vue`, replace with methods or utility functions.
10. Replace old slot, Dialog, Pagination, Popconfirm syntax in `ListAdmin.vue`.
11. Migrate Vue2 JSX `scopedSlots` in `ListAdmin.vue`.
12. Migrate v-model protocol and Element Plus differences in `plugins/form/*.vue`.
13. Migrate `.native` events in `plugins/list/editable-plain.vue`.
14. Check v-model protocol in `src/views/admin/*.vue` and `src/views/user/*.vue`.

## TSX Splitting Suggestions

- Do NOT convert `ListAdmin.vue` entirely to TSX at once.
- Prioritize extracting dynamic action rendering into TSX sub-components.
- Prioritize extracting dialog form action rendering into TSX sub-components.
- Keep regular pages and simple templates as SFC.

## Acceptance Criteria

- `admin/list` page loads and displays data.
- `admin/form` page creates and edits data.
- `user/list` page displays users and opens role dialog.
- Filters generate correct `@filter`.
- Pagination and sort trigger new requests.
- Dynamic form plugins load based on field type.
- Image, file, date, boolean, and relation fields work.
- Delete confirmation works.
- Export functionality works.

## Risks

- EasyAdmin relies on runtime dynamic component loading; Vite requires static analyzable mappings.
- Vue3 removed filters, directly affecting list field display.
- Vue3 slot and TSX slot syntax differ, potentially causing content not to render without obvious errors.
- Form v-model protocol changes affect parent-child data synchronization.
