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
          // 表单使用 transfer 穿梭框更适合权限批量授予（左侧_available_ / 右侧_selected_）；底层复用 RelationToMany 的 EntityManage 拉取逻辑
          // 使用相应的 type: 列表页自动映射到 plugins/list/RelationToMany，表单页映射到 plugins/form/transfer
          type: 'transfer',
          required: false,
          help: t('Role permissions help'),
          type_options: {
            entity_name: 'Permission'
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
