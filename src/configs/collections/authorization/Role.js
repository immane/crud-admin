import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

/**
 * Role (authorization_role)
 *
 * Backend source:
 *   - Entity: App\Authorization\Entity\Role (authorization_role table)
 *   - Service: App\Authorization\Service\RoleService (extends BaseService<Role>)
 *   - Controller: App\Authorization\Controller\Manage\RoleController
 *     @Route('/manage/roles', name: 'manage-roles-') #[IsGranted('ROLE_ADMIN')]
 *     Mixins: List + Detail + Create + Update + Delete
 *   - Join table authorization_role_permission (ManyToMany Permission)
 *   - Field grant table authorization_role_field_grant (RoleFieldGrant)
 *
 * Core constraints (see RoleController::processCreateContent / processUpdateContent / deleteAction):
 *   - code: ^[a-z0-9_]+$  (80 chars, unique)  e.g. store_content_editor / authorization_administrator
 *   - name: human-readable name, max 120 chars
 *   - scopeType: enum global | store (Role::SCOPES) cannot change semantics after creation (seed roles forbid scopeType change)
 *   - isSystem: system built-in role (written by seeds) forbidden to modify/delete/change permissions/fieldGrant via API
 *   - uuid: 36 chars UUID v4, auto-generated on creation, can be explicitly passed but validates is_valid
 *
 * Extended endpoints (Manage Role sub-resources):
 *   - POST   /manage/roles/{uuid}/permissions
 *       Body: { permissions: ["common:content:read", ...] } or directly ["code1","code2"]
 *       Validation: code pattern ^[a-z0-9:_]+$, unknown code returns 400, system role returns 403
 *       Side effects: clear existing permissions -> addPermission loop -> flush + auditService.record('role.permissions.replaced') + cacheInvalidator.invalidateUsers(...)
 *   - PUT    /manage/roles/{uuid}/field-grants/{resource}/{action}
 *       Body: { fields: ["title","body",...] } or directly ["title",...]
 *       Validation: AuthorizationResourceRegistry::assertValidFields(), unknown resource:action or invalid field returns 400
 *       Current registry default: { 'common:content': { create: [title,body,category,tags,metadata], update: [...] } }
 *       Side effects: upsert RoleFieldGrant + audit('field_grant.replaced') + invalidateUsers
 *   - DELETE /manage/roles/{id}  (overridden) system roles forbidden to delete, returns 403
 *
 * Audit: create -> audit 'role.created'; permissions/fieldGrant/update all write audit_log + invalidate user cache
 *
 * Frontend EasyAdmin usage:
 *   - list/form automatically go through EntityManage (utils/entity.ts) via /api/v1/manage/roles CRUD
 *   - recommend RelationToMany or transfer component for associated permissions; field grants can use json/array + help text
 */

const scopeOptions = [
  { value: 'global', label: t('Global') },
  { value: 'store', label: t('Store') }
]

export default {
  Role: {
    entity: { name: 'Role', plural: 'roles' },

    form: {
      fields: [
        {
          property: 'id',
          type: 'integer',
          required: false,
          field_options: { disabled: true }
        },
        {
          property: 'uuid',
          required: false,
          field_options: { placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', disabled: false }
        },
        {
          property: 'code',
          required: true,
          help: t('Role code help'),
          field_options: { placeholder: 'store_content_editor' }
        },
        {
          property: 'name',
          required: true,
          field_options: { placeholder: t('Name') }
        },
        {
          property: 'scopeType',
          type: 'select',
          required: true,
          default_value: 'store',
          help: t('Role scope type help'),
          type_options: { options: scopeOptions },
          field_options: { placeholder: t('Please select') }
        },
        {
          property: 'isSystem',
          type: 'boolean',
          required: false,
          default_value: false,
          field_options: { disabled: true }
        },
        {
          property: 'permissions',
          // Use transfer widget for bulk permission grants (left=available / right=selected); reuses RelationToMany EntityManage fetch logic under the hood
          // Corresponding type: list page auto-maps to plugins/list/RelationToMany, form page maps to plugins/form/transfer
          type: 'transfer',
          required: false,
          help: t('Role permissions help'),
          type_options: {
            entity_name: 'Permission'
          },
          field_options: { placeholder: t('Please select') }
        }
      ],
      // Batch edit only allows name-related fields; scopeType/system should not be changed in bulk
      batch_edit: {
        fields: ['name']
      }
    },

    list: {
      query: orderByIdDesc,
      disabled_actions: ['batch_edit', 'batch_delete'],
      list_filter: {
        code: t('Code'),
        name: t('Name'),
        scopeType: {
          __label: t('Scope Type'),
          global: t('Global'),
          store: t('Store')
        },
        isSystem: {
          label: t('Is System'),
          type: 'boolean',
          expression: 'entity.isSystem() == :value'
        },
        uuid: t('UUID')
      },
      list_display: [
        'id',
        { property: 'uuid', type: 'plain-text' },
        'code',
        'name',
        {
          property: 'scopeType',
          type: 'select'
        },
        { property: 'isSystem', type: 'boolean' },
        'permissions',
        { property: 'updatedAt', type: 'datetime' }
      ]
    },

    detail: {
      detail_display: [
        'id',
        'uuid',
        'code',
        'name',
        'scopeType',
        { property: 'isSystem', type: 'boolean' },
        { property: 'permissions', type: 'RelationToMany' },
        { property: 'createdAt', type: 'datetime' },
        { property: 'updatedAt', type: 'datetime' }
      ],
      disabled_actions: []
    }
  }
}
