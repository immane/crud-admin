import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

/**
 * Role (authorization_role)
 *
 * 后端来源:
 *   - Entity: App\Authorization\Entity\Role (authorization_role 表)
 *   - Service: App\Authorization\Service\RoleService (extends BaseService<Role>)
 *   - Controller: App\Authorization\Controller\Manage\RoleController
 *     @Route('/manage/roles', name: 'manage-roles-') #[IsGranted('ROLE_ADMIN')]
 *     Mixins: List + Detail + Create + Update + Delete
 *   - 关联表 authorization_role_permission (ManyToMany Permission)
 *   - 字段授权表 authorization_role_field_grant (RoleFieldGrant)
 *
 * 核心约束 (见 RoleController::processCreateContent / processUpdateContent / deleteAction):
 *   - code: ^[a-z0-9_]+$  (80 chars, unique)  例如 store_content_editor / authorization_administrator
 *   - name: 人类可读名称，最大 120 chars
 *   - scopeType: 枚举 global | store (Role::SCOPES) 创建后不可变更语义(种子角色禁止 scopeType 变更)
 *   - isSystem: 系统内置角色 (种子写入) 禁止通过 API 修改/删除/改权限/改 fieldGrant
 *   - uuid: 36 chars UUID v4，创建时自动生成，可显式传入但校验 is_valid
 *
 * 扩展接口 (Manage Role 子资源):
 *   - POST   /manage/roles/{uuid}/permissions
 *       Body: { permissions: ["common:content:read", ...] } 或直接 ["code1","code2"]
 *       校验: code 正则 ^[a-z0-9:_]+$，不存在的 code 返回 400，system 角色返回 403
 *       副作用: 清空原 permissions -> addPermission loop -> flush + auditService.record('role.permissions.replaced') + cacheInvalidator.invalidateUsers(...)
 *   - PUT    /manage/roles/{uuid}/field-grants/{resource}/{action}
 *       Body: { fields: ["title","body",...] } 或直接 ["title",...]
 *       校验: AuthorizationResourceRegistry::assertValidFields()，未知 resource:action 或非法 field 返回 400
 *       当前 registry 默认: { 'common:content': { create: [title,body,category,tags,metadata], update: [...] } }
 *       副作用: upsert RoleFieldGrant + audit('field_grant.replaced') + invalidateUsers
 *   - DELETE /manage/roles/{id}  (覆写) system 角色禁止删除，返回 403
 *
 * 审计: create -> audit 'role.created'；permissions/fieldGrant/更新均写 audit_log + 失效用户缓存
 *
 * 前端 EasyAdmin 使用:
 *   - 列表/表单自动通过 EntityManage (utils/entity.ts) 走 /api/v1/manage/roles CRUD
 *   - 关联权限建议用 RelationToMany 或 transfer 组件；字段授权可用 json/array + help 说明
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
          help: '数据库自增主键，只读。前端详情展示用，表单提交无需填写。<br/>Help: Auto-increment DB id, read-only.',
          field_options: { disabled: true }
        },
        {
          property: 'uuid',
          required: false,
          help: 'UUID v4 主键 (36 chars)，后端 __construct 自动生成 <code>UUID::v4()</code>。' +
            '可在创建时显式传入 (acceptedCreateProperties 含 uuid)，需满足 UUID 格式。<br/>' +
            '更新与详情中展示为只读。种子角色的 uuid 固定用于关联。<br/>Help: Primary business key, auto-generated UUID v4.',
          field_options: { placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', disabled: false }
        },
        {
          property: 'code',
          required: true,
          help: '角色编码，唯一索引 (80 chars)，正则 <code>^[a-z0-9_]+$</code>。' +
            '例如 <code>store_content_editor</code>、<code>authorization_administrator</code>、<code>store_catalog_manager</code>。<br/>' +
            '创建必填，更新时仍可改但需再次正则校验；system 角色禁止修改。<br/>Help: Unique role code, lowercase snake_case.',
          field_options: { placeholder: 'store_content_editor' }
        },
        {
          property: 'name',
          required: true,
          help: '人类可读名称，例如 “Store Content Editor”。最长 120 chars，支持 i18n。<br/>Help: Human-readable role name.',
          field_options: { placeholder: t('Name') }
        },
        {
          property: 'scopeType',
          type: 'select',
          required: true,
          default_value: 'store',
          help: '作用域类型，枚举值仅 <code>global</code>（全局）或 <code>store</code>（门店级）。<br/>' +
            'global 角色的 Assignment 的 scopeUuid 必须为 null；store 角色的 Assignment 必须携带合法 store UUID。<br/>' +
            '后端校验: <code>in_array(scopeType, Role::SCOPES)</code>，非法返回 400 “Invalid scopeType”。<br/>' +
            '种子角色示例: store_content_editor/store_catalog_manager -> store；authorization_administrator -> global。<br/>' +
            'Help: Scope that this role can be assigned under.',
          type_options: { options: scopeOptions },
          field_options: { placeholder: t('Please select') }
        },
        {
          property: 'isSystem',
          type: 'boolean',
          required: false,
          default_value: false,
          help: '系统内置标记。种子数据 isSystem=true 的角色受保护：<br/>' +
            '- API 禁止修改/删除 (processUpdateContent/deleteAction 抛 InvalidArgumentException / 403)<br/>' +
            '- 禁止通过 POST /permissions 或 PUT /field-grants 修改<br/>' +
            '新建时传入 isSystem=true 会被拦截 “Cannot create system role via API”。前端置为只读。<br/>Help: System role is protected from API mutations.',
          field_options: { disabled: true }
        },
        {
          property: 'permissions',
          type: 'RelationToMany',
          required: false,
          help: '关联权限 (ManyToMany Permission)。前端展示为多选关联，实际存储在 <code>authorization_role_permission</code> 中间表。<br/>' +
            'API 层面并非通过 PUT /roles/{id} 直接写关联，而是通过专用端点 <code>POST /manage/roles/{uuid}/permissions</code> 批量替换。<br/>' +
            'Body 支持 <code>{ permissions: ["code1","code2"] }</code> 或 <code>{ codes: [...] }</code> 或直接数组。<br/>' +
            '每个 code 必须匹配 <code>^[a-z0-9:_]+$</code> 且在 permission 表中存在，否则 400。<br/>' +
            '替换后会 <code>cacheInvalidator.invalidateUsers()</code> 使相关用户权限缓存失效。<br/>' +
            '前端如需可视化，可在此字段使用 transfer/RelationToMany，并额外提供按钮调用该子资源接口。<br/>Help: Linked permissions; managed via POST /{uuid}/permissions.',
          type_options: {
            entity_name: 'Permission'
            // 可选: 远程搜索限定
            // relation_filter: { '@order': 'entity.module|ASC, entity.code|ASC' }
          },
          field_options: { placeholder: t('Please select') }
        }
      ],
      // 批量编辑仅允许名称相关，scopeType/system 不应在批量中改动
      batch_edit: {
        fields: ['name']
      }
    },

    list: {
      query: orderByIdDesc,
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
        { property: 'uuid', type: 'plain-text', help: '业务主键 UUID' },
        'code',
        'name',
        {
          property: 'scopeType',
          type: 'select',
          help: 'global=全局可见，store=限定门店'
        },
        { property: 'isSystem', type: 'boolean' },
        { property: 'permissions', type: 'RelationToMany', help: '关联权限数/列表' },
        { property: 'createdAt', type: 'datetime' },
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
