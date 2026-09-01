import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

/**
 * Permission (authorization_permission)
 *
 * 后端来源: App\Authorization\Entity\Permission (src/Authorization/Entity/Permission.php)
 * Manage API: GET/GET /api/v1/manage/permissions  (App\Authorization\Controller\Manage\PermissionController)
 *   - 仅支持 List + Detail (ListApiViewMixin + DetailApiViewMixin)，无 Create/Update/Delete
 *   - 权限路由限 ROLE_ADMIN: #[IsGranted('ROLE_ADMIN')] @Route('/manage/permissions')
 *   - 列表支持 @filter / @order / @dql / @select / @expands 等通用查询 (BaseService)
 *
 * 权限模型: code = "{module}:{resource}:{action}" 例如 "store:product:create"
 *   - module: 业务模块 (authorization / common / store / wallet)
 *   - resource: 资源 (role / assignment / content / product / order / voucher …)
 *   - action: 动作 (manage / read / create / update / delete / accept / fulfill / manual …)
 *   - name/description: 人类可读展示；isSystem: 是否系统内置(不可通过 API 随意增删)
 *   - 权限通过 SeedAuthorizationCommand 种子数据写入 DB，isSystem=true
 *
 * 前端注意: Permission 是只读字典表，不提供新增/编辑/删除入口；角色的权限通过 Role 的
 * POST /manage/roles/{uuid}/permissions 接口批量替换。
 */
export default {
  Permission: {
    // entity 配置: 映射到后端 /api/v1/manage/permissions
    entity: {
      name: 'Permission',
      // API 前缀默认 /api/v1/manage，plural 覆写避免复数推断歧义
      plural: 'permissions'
    },

    form: {
      fields: [
        {
          property: 'id',
          type: 'integer',
          required: false,
          field_options: { disabled: true }
        },
        {
          property: 'code',
          required: true,
          field_options: { placeholder: 'authorization:role:manage' }
        },
        {
          property: 'module',
          required: true,
          field_options: { placeholder: 'authorization' }
        },
        {
          property: 'resource',
          required: true,
          field_options: { placeholder: 'role' }
        },
        {
          property: 'action',
          required: true,
          field_options: { placeholder: 'manage' }
        },
        {
          property: 'name',
          required: true,
          field_options: { placeholder: t('Name') }
        },
        {
          property: 'description',
          type: 'textarea',
          required: false,
          field_options: { rows: 3, placeholder: t('Description') }
        },
        {
          property: 'isSystem',
          type: 'boolean',
          required: false,
          default_value: false,
          field_options: { disabled: true }
        }
      ]
    },

    list: {
      query: orderByIdDesc,
      // 只读实体: 禁用新增/编辑/删除/批量操作
      disabled_actions: ['new', 'edit', 'delete', 'batch_edit', 'batch_delete'],
      list_filter: {
        code: t('Code'),
        module: {
          __label: t('Module'),
          authorization: 'authorization',
          common: 'common',
          store: 'store',
          wallet: 'wallet'
        },
        resource: {
          __label: t('Resource'),
          role: 'role',
          assignment: 'assignment',
          content: 'content',
          product: 'product',
          order: 'order',
          specification: 'specification',
          voucher: 'voucher'
        },
        action: {
          __label: t('Action'),
          manage: 'manage',
          read: 'read',
          create: 'create',
          update: 'update',
          delete: 'delete',
          accept: 'accept',
          reject: 'reject',
          fulfill: 'fulfill',
          manual: 'manual'
        },
        name: t('Name'),
        isSystem: {
          label: t('Is System'),
          type: 'boolean',
          expression: 'entity.isSystem() == :value'
        }
      },
      list_display: [
        'id',
        'code',
        'module',
        'resource',
        'action',
        'name',
        { property: 'isSystem', type: 'boolean' },
        { property: 'createdAt', type: 'datetime' },
        { property: 'updatedAt', type: 'datetime' }
      ]
    },

    detail: {
      detail_display: [
        'id',
        'code',
        'module',
        'resource',
        'action',
        'name',
        { property: 'description', type: 'textarea' },
        { property: 'isSystem', type: 'boolean' },
        { property: 'createdAt', type: 'datetime' },
        { property: 'updatedAt', type: 'datetime' }
      ],
      disabled_actions: ['edit']
    }
  }
}
