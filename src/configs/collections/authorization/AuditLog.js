import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

/**
 * AuditLog (authorization_audit_log)
 *
 * 后端来源:
 *   - Entity: App\Authorization\Entity\AuditLog (authorization_audit_log 表，bigint PK)
 *   - Service: App\Authorization\Service\AuditLogService / AuthorizationAuditService
 *   - Controller: App\Authorization\Controller\Manage\AuditLogController
 *     @Route('/manage/audit-logs') #[IsGranted('ROLE_ADMIN')]
 *     Mixins: List + Detail (只读，无 Create/Update/Delete)
 *
 * 字段:
 *   - id: bigint 自增，只读
 *   - actorUuid: 操作人 User.uuid (可为 null，例如种子脚本)
 *   - action: 动作枚举字符串，例如:
 *       'role.created' / 'role.permissions.replaced' / 'field_grant.replaced' /
 *       'assignment.granted' / 'assignment.updated' / 'assignment.revoked'
 *   - targetType: 目标类型，例如 'role' / 'assignment' / 'role' (field_grant 复用 role)
 *   - targetUuid: 目标对象 UUID (Role.uuid / Assignment.uuid)，可为 null
 *   - beforeData / afterData: json 快照，记录变更前后 (例如 { permissions: [...] } 或 { fields: [...] })
 *   - requestId: 请求链路 ID (X-Request-Id)，可为 null
 *   - createdAt: datetime_immutable，PrePersist 自动写入
 *
 * 列表过滤 (AuditLogController::listFilter):
 *   - targetType / actorUuid  (query param 直接映射)
 *   - 通用 @filter / @order / @dql 仍可用 (BaseService)
 *
 * 审计写入时机见各 Controller 的 afterCreated/afterUpdated/replacePermissions/replaceFieldGrant/processDeletion
 * 前端仅做只读审计追溯展示，不开放新增/编辑/删除。
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
      // 只读审计表
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
