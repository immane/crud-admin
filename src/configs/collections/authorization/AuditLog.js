import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

/**
 * AuditLog (authorization_audit_log)
 *
 * Backend source:
 *   - Entity: App\Authorization\Entity\AuditLog (authorization_audit_log table, bigint PK)
 *   - Service: App\Authorization\Service\AuditLogService / AuthorizationAuditService
 *   - Controller: App\Authorization\Controller\Manage\AuditLogController
 *     @Route('/manage/audit-logs') #[IsGranted('ROLE_ADMIN')]
 *     Mixins: List + Detail (read-only, no Create/Update/Delete)
 *
 * Fields:
 *   - id: bigint auto-increment, read-only
 *   - actorUuid: operator User.uuid (nullable, e.g. seed scripts)
 *   - action: action enum string, e.g.:
 *       'role.created' / 'role.permissions.replaced' / 'field_grant.replaced' /
 *       'assignment.granted' / 'assignment.updated' / 'assignment.revoked'
 *   - targetType: target type, e.g. 'role' / 'assignment' / 'role' (field_grant reuses role)
 *   - targetUuid: target object UUID (Role.uuid / Assignment.uuid), nullable
 *   - beforeData / afterData: json snapshots, before/after change (e.g. { permissions: [...] } or { fields: [...] })
 *   - requestId: request trace ID (X-Request-Id), nullable
 *   - createdAt: datetime_immutable, auto-written via PrePersist
 *
 * List filtering (AuditLogController::listFilter):
 *   - targetType / actorUuid  (direct query param mapping)
 *   - generic @filter / @order / @dql still available (BaseService)
 *
 * Audit write timing: see afterCreated/afterUpdated/replacePermissions/replaceFieldGrant/processDeletion in each Controller
 * Frontend only shows read-only audit trace, no create/edit/delete.
 */
export default {
  AuditLog: {
    entity: { name: 'AuditLog', plural: 'audit-logs' },

    form: {
      fields: [
        {
          property: 'id',
          type: 'integer',
          required: false,
          field_options: { disabled: true }
        },
        {
          property: 'actorUuid',
          required: false,
          field_options: { disabled: true, placeholder: 'system / null' }
        },
        {
          property: 'action',
          required: true,
          field_options: { disabled: true }
        },
        {
          property: 'targetType',
          required: true,
          field_options: { disabled: true }
        },
        {
          property: 'targetUuid',
          required: false,
          field_options: { disabled: true }
        },
        {
          property: 'beforeData',
          type: 'json',
          required: false,
          field_options: { disabled: true }
        },
        {
          property: 'afterData',
          type: 'json',
          required: false,
          field_options: { disabled: true }
        },
        {
          property: 'requestId',
          required: false,
          field_options: { disabled: true }
        }
      ]
    },

    list: {
      query: orderByIdDesc,
      // Read-only audit table
      disabled_actions: ['new', 'edit', 'delete', 'batch_edit', 'batch_delete'],
      list_filter: {
        action: {
          __label: t('Action'),
          'role.created': 'role.created',
          'role.permissions.replaced': 'role.permissions.replaced',
          'field_grant.replaced': 'field_grant.replaced',
          'assignment.granted': 'assignment.granted',
          'assignment.updated': 'assignment.updated',
          'assignment.revoked': 'assignment.revoked'
        },
        targetType: {
          __label: t('Target Type'),
          role: 'role',
          assignment: 'assignment'
        },
        targetUuid: t('Target UUID'),
        actorUuid: t('Actor UUID'),
        requestId: t('Request ID')
      },
      list_display: [
        'id',
        'actorUuid',
        'action',
        'targetType',
        'targetUuid',
        { property: 'beforeData', type: 'json' },
        { property: 'afterData', type: 'json' },
        'requestId',
        { property: 'createdAt', type: 'datetime' }
      ]
    },

    detail: {
      detail_display: [
        'id',
        'actorUuid',
        'action',
        'targetType',
        'targetUuid',
        { property: 'beforeData', type: 'json' },
        { property: 'afterData', type: 'json' },
        'requestId',
        { property: 'createdAt', type: 'datetime' }
      ],
      disabled_actions: ['edit']
    }
  }
}
