import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

/**
 * Assignment (authorization_assignment)
 *
 * 后端来源:
 *   - Entity: App\Authorization\Entity\Assignment (authorization_assignment 表)
 *   - Controller: App\Authorization\Controller\Manage\AssignmentController
 *     @Route('/manage/assignments') #[IsGranted('ROLE_ADMIN')]
 *     Mixins: List + Detail + Create + Update + Delete (Delete 被覆写为软删除)
 *   - 唯一约束: UNIQUE(user_uuid, role_id, scope_type, scope_key)
 *     索引: idx_authorization_assignment_user_revoked, idx_authorization_assignment_scope_revoked
 *
 * 核心字段语义:
 *   - uuid: Assignment 自身 UUID v4 (主键业务键)
 *   - userUuid: 被授权用户 User.uuid (36 chars, 需 UUID::is_valid)
 *   - role: ManyToOne Role (外键 role_id, RESTRICT)  — 前端用 RelationToOne 选择角色
 *   - scopeType: 枚举 global | store (Assignment::SCOPE_GLOBAL / SCOPE_STORE)
 *   - scopeUuid: 作用域对象 UUID，global 时必须 null/空；store 时必填合法 UUID (关联 Store.uuid)
 *   - scopeKey: 冗余列 = scopeUuid ?? ''，由 syncScopeKey() 维护，用于唯一约束
 *   - grantedByUuid: 授权操作人 User.uuid (创建时取当前登录用户 getUser()->getUuid())
 *   - createdAt / revokedAt: revokedAt 为软删除标记，isActive() = revokedAt === null
 *
 * 业务校验 (processCreateContent / normalizeAssignmentInput / processEntity):
 *   - userUuid、roleUuid、scopeType 三者必填，否则 400
 *   - userUuid 必须 UUID 合法；scopeType 必须 global/store；scopeUuid 与 scopeType 的 null/合法性强一致
 *   - role.scopeType 必须与 assignment.scopeType 一致，否则 400 'Role scope incompatible ...'
 *   - 若已存在 active Assignment (findActiveAssignment) 则直接返回该记录 (幂等授予)
 *   - 若存在 revoked 记录则复活 (setRevokedAt(null))；否则新建 Assignment
 *   - create 支持兼容字段别名: user_uuid / role_uuid / roleId / scope_type / scope_uuid
 *
 * 列表过滤 (listFilter 覆写):
 *   - query: userUuid / roleId / scopeType / scopeUuid / includeRevoked (布尔默认 false)
 *   - includeRevoked=false 时自动追加 revokedAt IS NULL，仅展示生效授权
 *   - 若 includeRevoked=true 则展示包含已撤销的全部记录
 *
 * 软删除行为 (processDeletion 覆写):
 *   - 已 revoked 再 DELETE 直接返回 204 幂等
 *   - 否则置 revokedAt = now()，写审计 'assignment.revoked'，cacheInvalidator.invalidateUser(userUuid)
 *   - update 同理会记录 'assignment.updated' 并失效新旧 userUuid 缓存
 *   - afterCreated 仅当真正新建 (grantedAssignments[oid]=true) 才写 'assignment.granted' + 失效缓存
 *
 * 前端注意:
 *   - 新增/编辑建议提供 User 选择 (可通过 /manage/users 远程搜索，传入 userUuid)
 *   - Role 选择后自动关联 scopeType，建议联动校验：选 global 角色时隐藏 scopeUuid 输入
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
          // 后端 API 实际接受 roleUuid/roleId/code，此处用 relation 便捷选角色
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
        // 注意: 后端 listFilter 额外支持 ?includeRevoked=true 控制是否包含已撤销
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
