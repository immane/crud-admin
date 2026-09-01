import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

/**
 * Assignment (authorization_assignment)
 *
 * Backend source:
 *   - Entity: App\Authorization\Entity\Assignment (authorization_assignment table)
 *   - Controller: App\Authorization\Controller\Manage\AssignmentController
 *     @Route('/manage/assignments') #[IsGranted('ROLE_ADMIN')]
 *     Mixins: List + Detail + Create + Update + Delete (Delete overridden as soft delete)
 *   - Unique constraint: UNIQUE(user_uuid, role_id, scope_type, scope_key)
 *     Indexes: idx_authorization_assignment_user_revoked, idx_authorization_assignment_scope_revoked
 *
 * Core field semantics:
 *   - uuid: Assignment own UUID v4 (primary business key)
 *   - userUuid: granted user User.uuid (36 chars, requires UUID::is_valid)
 *   - role: ManyToOne Role (FK role_id, RESTRICT) — frontend selects role via RelationToOne
 *   - scopeType: enum global | store (Assignment::SCOPE_GLOBAL / SCOPE_STORE)
 *   - scopeUuid: scope object UUID, must be null/empty for global; must be valid UUID for store (linked to Store.uuid)
 *   - scopeKey: redundant column = scopeUuid ?? '', maintained by syncScopeKey() for unique constraint
 *   - grantedByUuid: granting operator User.uuid (taken from current logged-in user getUser()->getUuid() on creation)
 *   - createdAt / revokedAt: revokedAt is soft-delete marker, isActive() = revokedAt === null
 *
 * Business validation (processCreateContent / normalizeAssignmentInput / processEntity):
 *   - userUuid, roleUuid and scopeType are all required, otherwise 400
 *   - userUuid must be valid UUID; scopeType must be global/store; nullability/validity of scopeUuid must strictly match scopeType
 *   - role.scopeType must match assignment.scopeType, otherwise 400 'Role scope incompatible ...'
 *   - if active Assignment already exists (findActiveAssignment) return that record directly (idempotent grant)
 *   - if revoked record exists, revive it (setRevokedAt(null)); otherwise create new Assignment
 *   - create supports compatible field aliases: user_uuid / role_uuid / roleId / scope_type / scope_uuid
 *
 * List filtering (listFilter override):
 *   - query: userUuid / roleId / scopeType / scopeUuid / includeRevoked (boolean default false)
 *   - when includeRevoked=false, automatically appends revokedAt IS NULL to show only active grants
 *   - when includeRevoked=true, shows all records including revoked
 *
 * Soft-delete behavior (processDeletion override):
 *   - if already revoked, DELETE returns 204 idempotently
 *   - otherwise set revokedAt = now(), write audit 'assignment.revoked', cacheInvalidator.invalidateUser(userUuid)
 *   - update similarly records 'assignment.updated' and invalidates cache for old and new userUuid
 *   - afterCreated only writes 'assignment.granted' + invalidates cache when truly newly created (grantedAssignments[oid]=true)
 *
 * Frontend notes:
 *   - for create/edit, provide User selector (via /manage/users remote search, pass userUuid)
 *   - after selecting Role, scopeType is auto-linked; recommend linked validation: hide scopeUuid input when global role is selected
 */
export default {
  Assignment: {
    entity: { name: 'Assignment', plural: 'assignments' },

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
          field_options: { disabled: true, placeholder: 'auto-generated' }
        },
        {
          property: 'userUuid',
          required: true,
          field_options: { placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }
        },
        {
          property: 'role',
          type: 'RelationToOne',
          required: true,
          type_options: { entity_name: 'Role' },
          // Backend API actually accepts roleUuid/roleId/code, using relation here for convenient role selection
          field_options: { placeholder: t('Please select') }
        },
        {
          property: 'scopeType',
          type: 'select',
          required: true,
          default_value: 'store',
          help: t('Assignment scope type help'),
          type_options: {
            options: [
              { value: 'global', label: t('Global') },
              { value: 'store', label: t('Store') }
            ]
          }
        },
        {
          property: 'scopeUuid',
          required: false,
          field_options: { placeholder: t('UUID') }
        },
        {
          property: 'scopeKey',
          required: false,
          field_options: { disabled: true }
        },
        {
          property: 'grantedByUuid',
          required: false,
          field_options: { disabled: true, placeholder: 'auto-filled' }
        }
      ]
    },

    list: {
      query: orderByIdDesc,
      disabled_actions: ['batch_edit', 'batch_delete'],
      list_filter: {
        userUuid: t('User UUID'),
        roleId: {
          label: t('Role'),
          type: 'input',
          expression: 'entity.getRole().getId() == :value'
        },
        scopeType: {
          __label: t('Scope Type'),
          global: t('Global'),
          store: t('Store')
        },
        scopeUuid: t('Scope UUID'),
        revokedAt: {
          label: t('Revoked'),
          type: 'boolean',
          expression: 'entity.getRevokedAt() IS NOT NULL'
        }
        // Note: backend listFilter additionally supports ?includeRevoked=true to control whether revoked records are included
      },
      list_display: [
        'id',
        'uuid',
        { property: 'userUuid', type: 'plain-text' },
        { property: 'role', type: 'RelationToOne' },
        'scopeType',
        'scopeUuid',
        'scopeKey',
        'grantedByUuid',
        { property: 'createdAt', type: 'datetime' },
        { property: 'revokedAt', type: 'datetime' }
      ]
    },

    detail: {
      detail_display: [
        'id',
        'uuid',
        'userUuid',
        { property: 'role', type: 'RelationToOne' },
        'scopeType',
        'scopeUuid',
        'scopeKey',
        'grantedByUuid',
        { property: 'createdAt', type: 'datetime' },
        { property: 'revokedAt', type: 'datetime' }
      ]
    }
  }
}
