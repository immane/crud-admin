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
          help: '主键 ID，数据库自增只读。由后端自动生成，前端不可编辑。<br/>Help: Primary key, auto-increment, read-only.',
          field_options: { disabled: true }
        },
        {
          property: 'code',
          required: true,
          help: '权限编码，唯一且全局唯一索引。格式 <code>{module}:{resource}:{action}</code> ' +
            '例如 <code>authorization:role:manage</code>、<code>store:order:read</code>。' +
            '正则 <code>^[a-z0-9:_]+$</code>。<br/>' +
            '需通过 <code>bin/console app:authorization:seed</code> 种子写入，Manage API 不提供创建/修改。' +
            '<br/>Help: Unique permission code in "{module}:{resource}:{action}" pattern.',
          field_options: { placeholder: 'authorization:role:manage' }
        },
        {
          property: 'module',
          required: true,
          help: '所属模块，如 <code>authorization</code>、<code>common</code>、<code>store</code>、<code>wallet</code>。' +
            '与 code 的首段保持一致。<br/>Help: Business module that owns this permission.',
          field_options: { placeholder: 'authorization' }
        },
        {
          property: 'resource',
          required: true,
          help: '资源名，如 <code>role</code>、<code>assignment</code>、<code>content</code>、<code>product</code>、<code>order</code>。' +
            '与 code 的中段一致。<br/>Help: Resource name (second segment of code).',
          field_options: { placeholder: 'role' }
        },
        {
          property: 'action',
          required: true,
          help: '动作，如 <code>manage</code>、<code>read</code>、<code>create</code>、<code>update</code>、<code>delete</code>、<code>accept</code>。<br/>' +
            '与 code 的末段一致。<br/>Help: Action name (last segment of code).',
          field_options: { placeholder: 'manage' }
        },
        {
          property: 'name',
          required: true,
          help: '人类可读名称，例如 “Manage roles”、“Read store orders”。在种子数据中定义，多语言由前端 i18n 映射。<br/>Help: Human-readable permission name.',
          field_options: { placeholder: t('Name') }
        },
        {
          property: 'description',
          type: 'textarea',
          required: false,
          help: '详细说明，例如 “Create and manage roles”。支持长文本，可为空。<br/>Help: Optional long description of what the permission grants.',
          field_options: { rows: 3, placeholder: t('Description') }
        },
        {
          property: 'isSystem',
          type: 'boolean',
          required: false,
          default_value: false,
          help: '是否为系统内置权限。种子权限 isSystem=true，通过 API 不可创建 system 角色/权限 widening。<br/>' +
            '前端展示为只读标签，后端禁止随意修改。<br/>Help: System-builtin flag; true = seeded and protected.',
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
        { property: 'code', help: '唯一编码 module:resource:action' },
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
