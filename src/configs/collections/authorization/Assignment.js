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
          help: '数据库自增主键，只读。<br/>Help: Auto-increment DB id, read-only.',
          field_options: { disabled: true }
        },
        {
          property: 'uuid',
          required: false,
          help: 'Assignment UUID v4，创建时后端自动生成。若幂等命中已存在 active 记录则复用该 uuid。<br/>Help: Business primary key, auto-generated UUID v4.',
          field_options: { disabled: true, placeholder: 'auto-generated' }
        },
        {
          property: 'userUuid',
          required: true,
          help: '被授权用户 UUID，对应 Identity.User.uuid (36 chars, UUID 格式)。' +
            '创建/更新必填，后端校验 <code>UUID::is_valid</code>，非法返回 400 “Invalid userUuid”。<br/>' +
            '别名兼容 <code>user_uuid</code>。前端建议用 RelationToOne 远程搜索用户列表后回填 uuid。<br/>Help: Target user UUID (Identity User).',
          field_options: { placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }
        },
        {
          property: 'role',
          type: 'RelationToOne',
          required: true,
          help: '关联角色 (ManyToOne Role)。前端传入 <code>roleUuid</code> / <code>role_uuid</code> / <code>roleId</code> (code/uuid/id 三者皆可解析，优先级 uuid > id > code)。' +
            '<br/>后端 resolveRole() 按 UUID -> ID -> code 依次查找。<br/>' +
            '校验: Role.scopeType 必须与 assignment.scopeType 一致，否则 400。<br/>' +
            'Help: The granted role; its scopeType must match assignment scopeType.',
          type_options: { entity_name: 'Role' },
          // 后端 API 实际接受 roleUuid/roleId/code，此处用 relation 便捷选角色
          field_options: { placeholder: t('Please select') }
        },
        {
          property: 'scopeType',
          type: 'select',
          required: true,
          default_value: 'store',
          help: '作用域类型，枚举 <code>global</code>（全局）或 <code>store</code>（门店级）。<br/>' +
            '- global: scopeUuid 必须为 null/空<br/>' +
            '- store: scopeUuid 必须为合法 UUID (指向 Store.uuid)<br/>' +
            '非法值返回 400 “Invalid scopeType”。别名兼容 <code>scope_type</code>。<br/>Help: Assignment scope discriminator.',
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
          help: '作用域对象 UUID。<br/>' +
            '- 当 scopeType=global 时必须为 null/空，否则 400 “scopeUuid must be null for global scope”<br/>' +
            '- 当 scopeType=store 时必须为合法 UUID，否则 400 “Valid scopeUuid required for store scope”<br/>' +
            '别名兼容 <code>scope_uuid</code>。后端写入后同步到 scopeKey (scopeUuid ?? \'\') 参与唯一约束。<br/>Help: Scope object UUID, nullable for global scope.',
          field_options: { placeholder: t('UUID') }
        },
        {
          property: 'scopeKey',
          required: false,
          help: '冗余唯一键 = scopeUuid ?? ""，由 PrePersist/PreUpdate syncScopeKey() 自动维护，用于 UNIQUE(user_uuid, role_id, scope_type, scope_key)。只读。<br/>Help: Derived unique key for scoping, read-only.',
          field_options: { disabled: true }
        },
        {
          property: 'grantedByUuid',
          required: false,
          help: '授权操作人 UUID (执行授予的管理员 User.uuid)，创建时自动取当前登录用户。只读。<br/>Help: Actor who granted this assignment, auto-filled, read-only.',
          field_options: { disabled: true, placeholder: 'auto-filled' }
        }
      ],
      batch_edit: {
        // 批量仅适合演示，实际通常不批量改 scope
        fields: ['scopeType']
      }
    },

    list: {
      query: orderByIdDesc,
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
        { property: 'userUuid', type: 'plain-text', help: '被授权用户' },
        { property: 'role', type: 'RelationToOne' },
        'scopeType',
        'scopeUuid',
        'scopeKey',
        'grantedByUuid',
        { property: 'createdAt', type: 'datetime' },
        { property: 'revokedAt', type: 'datetime', help: 'null=生效中' }
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
